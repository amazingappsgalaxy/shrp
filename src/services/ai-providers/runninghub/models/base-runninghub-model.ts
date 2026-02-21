import { BaseModelAdapter } from '../../common/model-adapter'
import { EnhancementRequest, EnhancementResponse } from '../../common/types'

/**
 * Base class for all RunningHub model adapters
 * Provides common RunningHub-specific functionality
 */
export abstract class BaseRunningHubModel extends BaseModelAdapter {
  protected workflowId: string

  constructor(config: {
    apiKey: string
    baseUrl: string
    workflowId: string
    timeout?: number
    retries?: number
  }) {
    super(config)
    this.workflowId = config.workflowId
  }

  /**
   * Create a ComfyUI task with RunningHub API
   */
  protected async createComfyTask(
    imageUrl: string,
    nodeInfoList: Array<{ nodeId: string; fieldName: string; fieldValue: string }>,
    options?: { outputsToExecute?: string[] }
  ): Promise<{ success: boolean; taskId?: string; error?: string }> {
    try {
      // Note: imageUrl processing should be done before calling this method
      // The nodeInfoList should already contain processed URLs

      // Safety-net default: if not specified, only execute SaveImage(144)
      const outputsToExecute = options?.outputsToExecute ?? ['144']

      console.log(`🚀 ${this.getModelId()}: Creating ComfyUI task`, {
        workflowId: this.workflowId,
        nodeCount: nodeInfoList.length,
        imageUrl: imageUrl.substring(0, 100) + '...',
        outputs_to_execute: outputsToExecute
      })

      const requestPayload = {
        apiKey: this.apiKey,
        workflowId: this.workflowId,
        nodeInfoList,
        addMetadata: true,
        // Explicitly select which output nodes to execute (per RunningHub advanced API)
        outputs_to_execute: outputsToExecute
      }

      const response = await this.makeApiRequest('/task/openapi/create', 'POST', requestPayload, {
        'Host': 'www.runninghub.ai'
      })

      const data = await response.json()
      console.log(`✅ ${this.getModelId()}: Task creation response:`, data)

      if (data.code === 0 && data.data?.taskId) {
        // Check for workflow errors
        if (data.data.promptTips) {
          this.handleWorkflowErrors(data.data.promptTips)
        }

        return {
          success: true,
          taskId: data.data.taskId
        }
      } else {
        console.log(`❌ ${this.getModelId()}: Task creation failed with code:`, data.code, 'message:', data.msg)

        // If area protection caused the failure, try again without it
        if (data.msg === 'APIKEY_INVALID_NODE_INFO') {
          const areaProtectionNodes = nodeInfoList.filter(node => node.nodeId === '133')

          if (areaProtectionNodes.length > 0) {
            console.log(`🔄 ${this.getModelId()}: Retrying without area protection (node 133 not supported)`) 

            // Remove all node 133 entries and retry
            const nodeInfoListWithoutAreaProtection = nodeInfoList.filter(node => node.nodeId !== '133')

            const retryPayload = {
              apiKey: this.apiKey,
              workflowId: this.workflowId,
              nodeInfoList: nodeInfoListWithoutAreaProtection,
              addMetadata: true,
              outputs_to_execute: outputsToExecute
            }

            console.log(`🔄 ${this.getModelId()}: Retry with ${nodeInfoListWithoutAreaProtection.length} nodes (removed ${areaProtectionNodes.length} area protection nodes)`, {
              outputs_to_execute: outputsToExecute
            })

            try {
              const retryResponse = await this.makeApiRequest('/task/openapi/create', 'POST', retryPayload, {
                'Host': 'www.runninghub.ai'
              })

              const retryData = await retryResponse.json()
              console.log(`✅ ${this.getModelId()}: Retry successful:`, retryData)

              if (retryData.code === 0 && retryData.data?.taskId) {
                console.log(`⚠️ ${this.getModelId()}: Area protection not supported in current workflow, proceeding without it`)
                return {
                  success: true,
                  taskId: retryData.data.taskId
                }
              }
            } catch (retryError) {
              console.log(`❌ ${this.getModelId()}: Retry also failed:`, retryError)
            }
          }
        }

        return {
          success: false,
          error: data.msg || 'Failed to create ComfyUI task'
        }
      }
    } catch (error) {
      console.error(`❌ ${this.getModelId()}: Task creation failed:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error creating task'
      }
    }
  }

  /**
   * Poll for task completion
   */
  protected async pollTaskCompletion(taskId: string): Promise<{
    success: boolean
    outputUrl?: string
    processingTime?: number
    error?: string
  }> {
    const maxAttempts = 60 // 5 minutes with 5-second intervals
    const pollInterval = 5000 // 5 seconds
    let attempts = 0
    const startTime = Date.now()

    console.log(`⏳ ${this.getModelId()}: Starting to poll task ${taskId}`)

    while (attempts < maxAttempts) {
      try {
        // Check task status
        const statusResponse = await this.makeApiRequest('/task/openapi/status', 'POST', {
          apiKey: this.apiKey,
          taskId
        }, { 'Host': 'www.runninghub.ai' })

        const statusData = await statusResponse.json()

        console.log(`🔍 ${this.getModelId()}: Polling attempt ${attempts + 1}, status:`, statusData.data)

        if (statusData.code === 0) {
          const status = statusData.data

          if (status === 'SUCCESS') {
            console.log(`✅ ${this.getModelId()}: Task completed, fetching outputs...`)

            // Get outputs with retry logic
            const outputResult = await this.getTaskOutputs(taskId)
            if (outputResult.success) {
              return {
                success: true,
                outputUrl: outputResult.outputUrl,
                processingTime: Date.now() - startTime
              }
            } else {
              return {
                success: false,
                error: outputResult.error,
                processingTime: Date.now() - startTime
              }
            }
          } else if (status === 'FAILED') {
            console.log(`❌ ${this.getModelId()}: Task failed`)
            return {
              success: false,
              error: 'Task failed on RunningHub'
            }
          }
          // Continue polling for QUEUED or RUNNING status
        }

        attempts++
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, pollInterval))
        }
      } catch (error) {
        console.error(`❌ ${this.getModelId()}: Polling error:`, error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Error polling task status'
        }
      }
    }

    return {
      success: false,
      error: 'Task timeout - processing took too long'
    }
  }

  /**
   * Get task outputs with retry logic
   */
  private async getTaskOutputs(taskId: string): Promise<{
    success: boolean
    outputUrl?: string
    error?: string
  }> {
    const maxOutputAttempts = 3
    let outputAttempts = 0

    while (outputAttempts < maxOutputAttempts) {
      try {
        const outputResponse = await this.makeApiRequest('/task/openapi/outputs', 'POST', {
          apiKey: this.apiKey,
          taskId
        }, { 'Host': 'www.runninghub.ai' })

        const outputData = await outputResponse.json()

        console.log(`🔍 ${this.getModelId()}: Output attempt ${outputAttempts + 1}:`, {
          code: outputData.code,
          hasData: !!outputData.data,
          dataLength: outputData.data?.length || 0
        })

        if (outputData.code === 0 && Array.isArray(outputData.data) && outputData.data.length > 0) {
          // Find the final output using model-specific logic
          const finalOutput = this.findFinalOutput(outputData.data)

          if (finalOutput && finalOutput.fileUrl) {
            console.log(`✅ ${this.getModelId()}: Found final output:`, finalOutput.fileUrl)
            return {
              success: true,
              outputUrl: finalOutput.fileUrl
            }
          }
        }

        outputAttempts++
        if (outputAttempts < maxOutputAttempts) {
          console.log(`⏳ ${this.getModelId()}: No outputs yet, waiting before retry...`)
          await new Promise(resolve => setTimeout(resolve, 3000 * outputAttempts))
        }
      } catch (error) {
        console.error(`❌ ${this.getModelId()}: Output fetch error:`, error)
        break
      }
    }

    return {
      success: false,
      error: 'No valid output found after all attempts'
    }
  }

  /**
   * Handle base64 image - upload to structured Tebi storage for RunningHub compatibility
   */
  protected async processImageUrl(imageUrl: string): Promise<string> {
    if (!imageUrl.startsWith('data:')) {
      return imageUrl // Already a URL
    }

    try {
      console.log(`🔄 ${this.getModelId()}: Converting base64 to structured Tebi upload...`)

      const base64Data = imageUrl.split(',')[1]
      const mimeType = imageUrl.match(/data:([^;]+)/)?.[1] || 'image/jpeg'
      const extension = mimeType.split('/')[1] || 'jpg'

      if (!base64Data) {
        throw new Error('Invalid base64 data URL')
      }

      const buffer = Buffer.from(base64Data, 'base64')

      // Use TebiUserFileUploads structured approach
      const { default: tebiClient, tebiUtils } = await import('../../../../lib/tebi')
      const bucketName = process.env.NEXT_PUBLIC_TEBI_BUCKET_NAME || 'sharpiiweb'

      // Generate structured filename for enhancement inputs
      const originalName = `enhancement-input.${extension}`
      const structuredFilename = tebiUtils.generateUserFileUploadFilename(
        originalName,
        'runninghub', // Use 'runninghub' as identifier for API uploads
        new Date()
      )

      const uploadParams = {
        Bucket: bucketName,
        Key: structuredFilename,
        Body: buffer,
        ContentType: mimeType,
        Metadata: {
          originalName: originalName,
          category: 'enhancement-input',
          provider: 'runninghub',
          uploadedAt: new Date().toISOString(),
          modelId: this.getModelId(),
          source: 'base64-conversion'
        }
      }

      console.log(`📁 ${this.getModelId()}: Uploading to structured path: ${structuredFilename}`)

      await tebiClient.putObject(uploadParams).promise()
      const publicUrl = tebiUtils.getFileUrl(structuredFilename)

      console.log(`✅ ${this.getModelId()}: Successfully uploaded to structured Tebi storage: ${publicUrl}`)
      return publicUrl
    } catch (error) {
      console.error(`❌ ${this.getModelId()}: Failed to upload base64 image:`, error)
      throw new Error('Failed to process base64 image')
    }
  }

  /**
   * Handle workflow errors from promptTips
   */
  private handleWorkflowErrors(promptTips: string): void {
    try {
      const tips = JSON.parse(promptTips)
      if (tips.node_errors && Object.keys(tips.node_errors).length > 0) {
        console.warn(`⚠️ ${this.getModelId()}: Node errors detected:`, tips.node_errors)

        const errorMessages: string[] = []
        for (const [nodeId, nodeError] of Object.entries(tips.node_errors as Record<string, any>)) {
          if (nodeError.errors && Array.isArray(nodeError.errors)) {
            for (const error of nodeError.errors) {
              errorMessages.push(`Node ${nodeId}: ${error.details || error.message || 'Unknown error'}`)
            }
          }
        }

        console.warn(`⚠️ ${this.getModelId()}: Workflow errors:`, errorMessages)
      }
    } catch (parseError) {
      console.warn(`⚠️ ${this.getModelId()}: Could not parse promptTips:`, parseError)
    }
  }

  /**
   * Abstract method for finding the final output node
   * Each model adapter should implement this based on their workflow
   */
  protected abstract findFinalOutput(outputs: any[]): { nodeId?: string; fileUrl?: string } | null

  /**
   * Map common sampler names to RunningHub values
   */
  protected mapSamplerName(samplerName: string | undefined): string {
    if (!samplerName) return 'dpmpp_2m'

    const samplerMap: Record<string, string> = {
      'DPM++ 2M': 'dpmpp_2m',
      'dpmpp_2m': 'dpmpp_2m',
      'DPM++ 2M Karras': 'dpmpp_2m',
      'Euler': 'euler',
      'euler': 'euler',
      'Euler a': 'euler_ancestral',
      'euler_ancestral': 'euler_ancestral',
      'Heun': 'heun',
      'heun': 'heun',
      'DPM2': 'dpm_2',
      'dpm_2': 'dpm_2',
      'DPM2 a': 'dpm_2_ancestral',
      'dpm_2_ancestral': 'dpm_2_ancestral',
      'LMS': 'lms',
      'lms': 'lms',
      'DPM++ SDE': 'dpmpp_sde',
      'dpmpp_sde': 'dpmpp_sde',
      'DPM++ 2S a': 'dpmpp_2s_ancestral',
      'dpmpp_2s_ancestral': 'dpmpp_2s_ancestral'
    }

    return samplerMap[samplerName] || 'dpmpp_2m'
  }

  /**
   * Map scheduler names to RunningHub values
   */
  protected mapSchedulerName(schedulerName: string | undefined): string {
    if (!schedulerName) return 'sgm_uniform'

    const schedulerMap: Record<string, string> = {
      'Normal': 'normal',
      'normal': 'normal',
      'Karras': 'karras',
      'karras': 'karras',
      'Exponential': 'exponential',
      'exponential': 'exponential',
      'Simple': 'simple',
      'simple': 'simple',
      'SGM Uniform': 'sgm_uniform',
      'sgm_uniform': 'sgm_uniform',
      'DDIM Uniform': 'ddim_uniform',
      'ddim_uniform': 'ddim_uniform',
      'Beta': 'beta',
      'beta': 'beta'
    }

    return schedulerMap[schedulerName] || 'sgm_uniform'
  }
}