
import { RunningHubProvider } from './runninghub-provider';
import { EnhancementRequest, ProviderConfig } from '../common/types';

// Mock fetch globally
global.fetch = jest.fn();

describe('RunningHubProvider', () => {
  let provider: RunningHubProvider;
  const config: ProviderConfig = {
    apiKey: 'test-key',
    baseUrl: 'https://www.runninghub.ai'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new RunningHubProvider(config);
  });

  it('should explicitly disable Smart Upscale nodes when smartUpscale is false', async () => {
    // Mock successful task creation
    (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
        if (url.includes('/task/openapi/create')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              code: 0,
              data: { taskId: 'test-task-id' },
              msg: 'Success'
            }),
          };
        }
        if (url.includes('/task/openapi/status')) {
          return {
              ok: true,
              status: 200,
              json: async () => ({
                  code: 0,
                  data: 'SUCCESS'
              })
          }
        }
        if (url.includes('/task/openapi/outputs')) {
            return {
                ok: true,
                json: async () => ({
                    code: 0,
                    data: [{ nodeId: '136', fileUrl: 'http://test.com/image.png' }]
                })
            }
        }
        // Mock image download
        if (url.endsWith('.png') || url.endsWith('.jpg')) {
            return {
                ok: true,
                arrayBuffer: async () => new ArrayBuffer(8),
                headers: {
                    get: (key: string) => {
                        if (key.toLowerCase() === 'content-type') return 'image/png';
                        return null;
                    }
                },
                json: async () => ({})
            }
        }
    
        // Mock upload to RunningHub (if applicable) or S3
        if (url.includes('upload')) {
             return {
                ok: true,
                json: async () => ({
                    code: 0,
                    data: { url: 'http://runninghub.ai/uploaded.png', fileName: 'uploaded.png' },
                    msg: 'Success'
                })
             }
        }
        return { ok: true, json: async () => ({}) };
      });

    const request: EnhancementRequest = {
      userId: 'test-user',
      imageId: 'test-image',
      imageUrl: 'http://test.com/input.png',
      settings: {
        smartUpscale: false, // EXPLICITLY DISABLED
        upscaleResolution: '4k',
        prompt: 'test prompt'
      }
    };

    await provider.enhanceImage(request, 'skin-editor');

    // Verify the create task call payload
    const createCall = (global.fetch as jest.Mock).mock.calls.find(call => call[0].includes('/task/openapi/create'));
    expect(createCall).toBeDefined();

    const body = JSON.parse(createCall[1].body);
    const nodeInfoList = body.nodeInfoList;

    const node229 = nodeInfoList.filter((n: any) => n.nodeId === '229');
    expect(node229.length).toBe(0);

    expect(body.workflowId).toBe('2023005806844710914');
  });

  it('should enable Smart Upscale nodes when smartUpscale is true', async () => {
    // Mock successful task creation
    (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
        if (url.includes('/task/openapi/create')) {
          return {
            ok: true,
            json: async () => ({
              code: 0,
              data: { taskId: 'test-task-id' },
              msg: 'Success'
            }),
          };
        }
        if (url.includes('/task/openapi/status')) {
          return {
              ok: true,
              json: async () => ({
                  code: 0,
                  data: 'SUCCESS'
              })
          }
        }
        if (url.includes('/task/openapi/outputs')) {
            return {
                ok: true,
                json: async () => ({
                    code: 0,
                    data: [{ nodeId: '136', fileUrl: 'http://test.com/image.png' }]
                })
            }
        }
        // Mock image download
        if (url.endsWith('.png') || url.endsWith('.jpg')) {
            return {
                ok: true,
                arrayBuffer: async () => new ArrayBuffer(8),
                headers: {
                    get: (key: string) => {
                        if (key.toLowerCase() === 'content-type') return 'image/png';
                        return null;
                    }
                },
                json: async () => ({})
            }
        }
    
        // Mock upload to RunningHub (if applicable) or S3
        if (url.includes('upload')) {
             return {
                ok: true,
                json: async () => ({
                    code: 0,
                    data: { url: 'http://runninghub.ai/uploaded.png', fileName: 'uploaded.png' },
                    msg: 'Success'
                })
             }
        }
        return { ok: true, json: async () => ({}) };
      });

    const request: EnhancementRequest = {
      userId: 'test-user',
      imageId: 'test-image',
      imageUrl: 'http://test.com/input.png',
      settings: {
        smartUpscale: true, // ENABLED
        upscaleResolution: '4k',
        prompt: 'test prompt'
      }
    };

    await provider.enhanceImage(request, 'skin-editor');

    const createCall = (global.fetch as jest.Mock).mock.calls.find(call => call[0].includes('/task/openapi/create'));
    expect(createCall).toBeDefined();

    const body = JSON.parse(createCall[1].body);
    const nodeInfoList = body.nodeInfoList;
    
    expect(body.workflowId).toBe('2023026925354094594');

    const scaleBy = nodeInfoList.find((n: any) => n.nodeId === '213' && n.fieldName === 'scale_by');
    const width = nodeInfoList.find((n: any) => n.nodeId === '214' && n.fieldName === 'width');
    const height = nodeInfoList.find((n: any) => n.nodeId === '214' && n.fieldName === 'height');

    expect(scaleBy?.fieldValue).toBe('2.000000000000');
    expect(width?.fieldValue).toBe('4096');
    expect(height?.fieldValue).toBe('4096');
  });

  it('should retry when task status is initially FAILED', async () => {
    jest.useFakeTimers();
    
    let statusCallCount = 0;
    
    // Mock task creation and status polling
    (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
        if (url.includes('/task/openapi/create')) {
          return {
            ok: true,
            json: async () => ({
              code: 0,
              data: { taskId: 'test-task-id' },
              msg: 'Success'
            }),
          };
        }
        
        if (url.includes('/task/openapi/status')) {
          statusCallCount++;
          // Fail first 2 times, then succeed
          if (statusCallCount <= 2) {
              return {
                  ok: true,
                  json: async () => ({
                      code: 0,
                      data: 'FAILED'
                  })
              }
          }
          
          return {
              ok: true,
              json: async () => ({
                  code: 0,
                  data: 'SUCCESS'
              })
          }
        }
        
        if (url.includes('/task/openapi/outputs')) {
            return {
                ok: true,
                json: async () => ({
                    code: 0,
                    data: [{ nodeId: '136', fileUrl: 'http://test.com/image.png' }]
                })
            }
        }
        
        // Mock image download/upload
        if (url.endsWith('.png') || url.endsWith('.jpg') || url.includes('upload')) {
             return {
                ok: true,
                arrayBuffer: async () => new ArrayBuffer(8),
                headers: { get: () => 'image/png' },
                json: async () => ({
                    code: 0,
                    data: { url: 'http://runninghub.ai/uploaded.png', fileName: 'uploaded.png' },
                    msg: 'Success'
                })
             }
        }
        
        return { ok: true, json: async () => ({}) };
      });

    const request: EnhancementRequest = {
      userId: 'test-user',
      imageId: 'test-image',
      imageUrl: 'http://test.com/input.png',
      settings: {
        smartUpscale: false,
        upscaleResolution: '4k',
        prompt: 'test prompt'
      }
    };

    // Helper to flush promises using actual setImmediate to avoid fake timer interference
    const flushPromises = () => new Promise(resolve => {
        if (typeof setImmediate === 'function') {
            setImmediate(resolve);
        } else {
            jest.requireActual('timers').setTimeout(resolve, 0);
        }
    });

    // Start the enhancement promise
    const enhancePromise = provider.enhanceImage(request, 'skin-editor');
    
    // Initial flush to start execution until first await
    await flushPromises();

    // 1st polling attempt -> FAILED -> wait 10s
    // Advance time by 10s
    await jest.advanceTimersByTimeAsync(10000);
    await flushPromises();
    
    // 2nd polling attempt -> FAILED -> wait 20s
    // Advance time by 20s
    await jest.advanceTimersByTimeAsync(20000);
    await flushPromises();
    
    // 3rd polling attempt -> SUCCESS -> wait 1s (before fetching outputs)
    await jest.advanceTimersByTimeAsync(1000);
    await flushPromises();

    // Fetch outputs should happen now
    // Wait for final result
    const result = await enhancePromise;
    
    expect(result.success).toBe(true);
    if (result.success) {
        if (Array.isArray(result.enhancedUrl)) {
            expect(result.enhancedUrl).toContain('http://test.com/image.png');
        } else {
            expect(result.enhancedUrl).toBe('http://test.com/image.png');
        }
    }
    
    // Verify we called status at least 3 times (fail, fail, success)
    expect(statusCallCount).toBeGreaterThanOrEqual(3);
    
    jest.useRealTimers();
  });
});
