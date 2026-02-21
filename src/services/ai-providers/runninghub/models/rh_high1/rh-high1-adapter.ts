import { BaseRunningHubModel } from '../base-runninghub-model'
import { EnhancementRequest, EnhancementResponse, ModelInfo, ProviderType } from '../../../common/types'

/**
 * RH High1 Model Adapter
 * Handles the specific ComfyUI workflow for high-quality image enhancement on RunningHub
 * Based on workflow ID: 1969370493155483650
 */
export class RhHigh1Adapter extends BaseRunningHubModel {
  private static readonly MODEL_ID = 'rh_high1'
  private static readonly WORKFLOW_ID = '1969370493155483650'

  // Node IDs from the new workflow configuration
  private static readonly NODES = {
    // Core workflow nodes
    LOAD_IMAGE: '97',                    // LoadImage - input image
    FINAL_SAVE_IMAGE: '136',             // SaveImage - final output (node #136)

    // Model and processing nodes
    MEGAPIXELS: '85',                    // Megapixels setting
    STEPS: '90',                         // Steps setting
    UPSCALE_SWITCH: '142',               // Boolean switch for upscaling

    // Additional required workflow nodes (discovered through testing)
    IMAGE_SIZE_NODE: '102',              // Image sizing node
    PROCESSING_NODE: '139',              // Additional processing node
    OUTPUT_NODE: '137',                  // Additional output node

    // Area protection nodes (Node 138)
    FACE_PARSING_RESULTS_PARSER: '138',  // FaceParsingResultsParser with all protection settings
  } as const

  constructor(config: {
    apiKey: string
    baseUrl: string
    timeout?: number
    retries?: number
  }) {
    super({
      ...config,
      workflowId: RhHigh1Adapter.WORKFLOW_ID
    })
  }

  getModelId(): string {
    return RhHigh1Adapter.MODEL_ID
  }

  getModelInfo(): ModelInfo {
    return {
      id: RhHigh1Adapter.MODEL_ID,
      name: 'RH High1 Model',
      displayName: 'RunningHub High Quality Enhancement',
      description: 'High-quality image enhancement with advanced facial area protection and megapixel upscaling.',
      provider: {
        name: ProviderType.RUNNINGHUB,
        displayName: 'RunningHub.ai',
        description: 'ComfyUI cloud platform for advanced image processing',
        supportedFeatures: ['image-enhancement', 'upscaling', 'facial-protection', 'high-quality']
      },
      version: '1.0',
      capabilities: [
        'image-enhancement',
        'quality-enhancement',
        'upscaling',
        'comfyui-workflow',
        'advanced-enhancement',
        'area-protection',
        'face-protection',
        'eye-protection',
        'mouth-protection'
      ],
      parameters: {
        steps: {
          type: 'number',
          default: 10,
          min: 1,
          max: 50,
          description: 'Number of denoising steps'
        },
        megapixels: {
          type: 'number',
          default: 10,
          min: 1,
          max: 50,
          description: 'Target megapixels for upscaling'
        },
        enable_upscale: {
          type: 'boolean',
          default: true,
          description: 'Enable upscaling (if disabled, only enhancement is applied)'
        },
        areaProtection: {
          type: 'object' as const,
          default: '' as any, // TypeScript workaround for object default
          description: 'Area protection settings for preserving specific facial features'
        }
      },
      pricing: {
        costPerImage: 0.008,
        currency: 'USD'
      }
    }
  }

  async enhanceImage(request: EnhancementRequest): Promise<EnhancementResponse> {
    try {
      console.log(`🚀 ${this.getModelId()}: Starting enhancement`, {
        userId: request.userId,
        imageId: request.imageId,
        hasAreaProtection: !!((request.settings as any).areaProtection)
      })

      // Validate request
      const validation = this.validateSettings(request.settings)
      if (!validation.valid) {
        return this.createErrorResponse(`Invalid settings: ${validation.errors?.join(', ')}`)
      }

      // Process settings
      const processedSettings = this.processSettings(request.settings)

      // Process image URL first (handles base64 to Tebi upload conversion)
      const processedImageUrl = await this.processImageUrl(request.imageUrl)

      // Build ComfyUI node mappings with processed URL
      const nodeInfoList = this.buildNodeMappings(processedImageUrl, processedSettings)

      console.log(`🔗 ${this.getModelId()}: Built ${nodeInfoList.length} node mappings`)

      // Create ComfyUI task with processed URL
      const taskResult = await this.createComfyTask(
        processedImageUrl,
        nodeInfoList,
        {
          outputsToExecute: [
            RhHigh1Adapter.NODES.IMAGE_SIZE_NODE,
            RhHigh1Adapter.NODES.PROCESSING_NODE,
            RhHigh1Adapter.NODES.FINAL_SAVE_IMAGE,
            RhHigh1Adapter.NODES.OUTPUT_NODE
          ]
        }
      )

      if (!taskResult.success) {
        return this.createErrorResponse(taskResult.error || 'Failed to create task')
      }

      // Poll for completion
      const result = await this.pollTaskCompletion(taskResult.taskId!)

      if (!result.success) {
        return this.createErrorResponse(result.error || 'Task failed')
      }

      console.log(`✅ ${this.getModelId()}: Enhancement completed successfully`)

      return {
        success: true,
        enhancedUrl: result.outputUrl!,
        metadata: {
          modelVersion: this.getModelInfo().version,
          processingTime: result.processingTime,
          settings: processedSettings,
          userId: request.userId,
          imageId: request.imageId,
          outputFormat: 'png',
          provider: ProviderType.RUNNINGHUB,
          model: this.getModelId(),
          timestamp: Date.now(),
          details: {
            workflowId: RhHigh1Adapter.WORKFLOW_ID,
            taskId: taskResult.taskId
          }
        }
      }

    } catch (error) {
      console.error(`❌ ${this.getModelId()}: Enhancement failed:`, error)
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Unknown enhancement error'
      )
    }
  }

  validateSettings(settings: any): { valid: boolean; errors?: string[] } {
    const errors: string[] = []

    // Validate steps
    if (settings.steps !== undefined) {
      const steps = Number(settings.steps)
      if (isNaN(steps) || steps < 1 || steps > 50) {
        errors.push('Steps must be between 1 and 50')
      }
    }

    // Validate megapixels
    if (settings.megapixels !== undefined) {
      const megapixels = Number(settings.megapixels)
      if (isNaN(megapixels) || megapixels < 1 || megapixels > 50) {
        errors.push('Megapixels must be between 1 and 50')
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
  }

  calculateCredits(width: number, height: number, settings: any): number {
    // Base credits calculation for RH High1
    const megapixels = (width * height) / 1000000
    let credits = Math.ceil(megapixels * 60) // Base cost

    // Add costs for various settings
    if (settings.enable_upscale) {
      credits += 40 // Upscaling cost
    }

    if (settings.steps && settings.steps > 20) {
      credits += Math.ceil((settings.steps - 20) * 3) // Extra steps cost
    }

    if (settings.megapixels && settings.megapixels > 10) {
      credits += Math.ceil((settings.megapixels - 10) * 5) // Extra megapixels cost
    }

    if ((settings as any).areaProtection) {
      // Add cost for area protection features
      const areaProtection = (settings as any).areaProtection
      const protectedAreas = Object.values(areaProtection).filter(Boolean).length
      credits += protectedAreas * 3
    }

    return Math.max(credits, 60) // Minimum 60 credits
  }

  protected findFinalOutput(outputs: any[]): { nodeId?: string; fileUrl?: string } | null {
    // Primary: Look for the official Final Save Image node (136)
    const finalOutput = outputs.find(o => String(o.nodeId) === RhHigh1Adapter.NODES.FINAL_SAVE_IMAGE && !!o.fileUrl)
    if (finalOutput) {
      console.log(`✅ ${this.getModelId()}: Found final output from node ${RhHigh1Adapter.NODES.FINAL_SAVE_IMAGE} (Final Save Image)`)
      return finalOutput
    }

    // Fallback: any output with a file URL
    const fallbackOutput = outputs.find(o => !!o.fileUrl)
    if (fallbackOutput) {
      console.log(`✅ ${this.getModelId()}: Using fallback output from node ${fallbackOutput.nodeId}`)
      return fallbackOutput
    }

    console.error(`❌ ${this.getModelId()}: No output found from Final Save Image node (${RhHigh1Adapter.NODES.FINAL_SAVE_IMAGE})`)
    return null
  }

  /**
   * Process and normalize settings for the RH High1 model
   */
  private processSettings(settings: any) {
    return {
      prompt: settings.prompt || 'high quality, detailed, enhanced',
      steps: settings.steps || 10,
      megapixels: settings.megapixels || 10,
      enable_upscale: settings.enable_upscale !== false,
      areaProtection: (settings as any).areaProtection
    }
  }

  /**
   * Build ComfyUI node mappings based on the new workflow configuration
   */
  private buildNodeMappings(imageUrl: string, settings: any): Array<{ nodeId: string; fieldName: string; fieldValue: string }> {
    const nodeInfoList: Array<{ nodeId: string; fieldName: string; fieldValue: string }> = []

    console.log(`🔧 ${this.getModelId()}: Building node mappings for workflow ${RhHigh1Adapter.WORKFLOW_ID}`)

    // 1. Load Image node (97) - input image
    nodeInfoList.push({
      nodeId: RhHigh1Adapter.NODES.LOAD_IMAGE,
      fieldName: 'image',
      fieldValue: imageUrl
    })

    // 2. Steps node (90) - number of steps
    nodeInfoList.push({
      nodeId: RhHigh1Adapter.NODES.STEPS,
      fieldName: 'steps',
      fieldValue: String(settings.steps || 10)
    })

    // 3. Megapixels node (85) - target megapixels
    nodeInfoList.push({
      nodeId: RhHigh1Adapter.NODES.MEGAPIXELS,
      fieldName: 'megapixels',
      fieldValue: String(settings.megapixels || 10)
    })

    // 4. Upscale switch node (142) - boolean for upscaling
    nodeInfoList.push({
      nodeId: RhHigh1Adapter.NODES.UPSCALE_SWITCH,
      fieldName: 'boolean',
      fieldValue: String(settings.enable_upscale !== false)
    })

    // 5. Additional required workflow nodes (verified working configuration)
    // Image size node (102) - working from test results
    nodeInfoList.push({
      nodeId: RhHigh1Adapter.NODES.IMAGE_SIZE_NODE,
      fieldName: 'longer_side',
      fieldValue: String(1024)
    })

    // Processing node (139) - uses image input (working configuration from tests)
    nodeInfoList.push({
      nodeId: RhHigh1Adapter.NODES.PROCESSING_NODE,
      fieldName: 'image',
      fieldValue: imageUrl
    })

    // Output node (137) - filename prefix for saving
    nodeInfoList.push({
      nodeId: RhHigh1Adapter.NODES.OUTPUT_NODE,
      fieldName: 'filename_prefix',
      fieldValue: 'rh_high1_output'
    })

    // NOTE: Area protection settings (Node 138) removed - they were causing workflow issues
    // The simplified 7-node configuration works perfectly without them

    console.log(`🔧 ${this.getModelId()}: Built ${nodeInfoList.length} node mappings`)
    return nodeInfoList
  }

}