import { BaseAIProvider } from '../common/base-provider'
import {
  EnhancementRequest,
  EnhancementResponse,
  ModelInfo,
  ProviderConfig,
  ProviderType,
  EnhancementSettings
} from '../common/types'
import { formatErrorMessage } from '../common/utils'

// Local types and guards to avoid using `any`
type RunningHubSettings = Omit<Partial<EnhancementSettings>, 'scheduler'> & {
  denoise?: number
  sampler_name?: string
  scheduler?: string
  node_191_mode?: string | number | boolean
  node_192_mode?: string | number | boolean
  node_193_mode?: string | number | boolean
  style?: string
  customPrompt?: string
  smartUpscale?: boolean
  upscaleResolution?: '4k' | '8k'
  workflowId?: string
  workflowJson?: Record<string, any>
  smartUpscaleWorkflowId?: string
  smartUpscaleWorkflowId4k?: string
  smartUpscaleWorkflowId8k?: string
  nodeInfoListOverride?: NodeInfoOverride[]
  protections?: {
    face?: {
      skin: boolean
      mouth: boolean
      lowerLip: boolean
      upperLip: boolean
      nose: boolean
    }
    eyes?: {
      eyeGeneral: boolean
      rightEye: boolean
      leftBrow: boolean
      rightBrow: boolean
      leftEye: boolean
    }
    other?: {
      background: boolean
      hair: boolean
      cloth: boolean
      neck: boolean
    }
  }
}

type NodeInfoOverride = {
  nodeId: string
  fieldName: string
  fieldValue: string | boolean | number | (string | number)[]
}

const mergeNodeInfoList = (base: NodeInfoOverride[], overrides: NodeInfoOverride[]): NodeInfoOverride[] => {
  if (!overrides.length) return base
  const overrideKeys = new Set(overrides.map(item => `${item.nodeId}:${item.fieldName}`))
  const filteredBase = base.filter(item => !overrideKeys.has(`${item.nodeId}:${item.fieldName}`))
  return [...filteredBase, ...overrides]
}


interface RunningHubOutputItem {
  nodeId?: string | number
  fileUrl?: string
}

interface RunningHubOutputsResponse {
  code: number
  data?: RunningHubOutputItem[]
  msg?: string
}

function isRunningHubOutputsResponse(val: unknown): val is RunningHubOutputsResponse {
  if (typeof val !== 'object' || val === null) return false
  const obj = val as Record<string, unknown>
  if (typeof obj.code !== 'number') return false
  if (obj.data !== undefined && !Array.isArray(obj.data)) return false
  return true
}


/**
 * RunningHub.ai Provider implementation
 * Integrates with RunningHub.ai ComfyUI API for image processing
 */
export class RunningHubProvider extends BaseAIProvider {
  private apiKey: string
  private baseUrl: string

  constructor(config: ProviderConfig) {
    super(config)
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || 'https://www.runninghub.ai'
    this.initializeModels()
    console.log('✅ RunningHubProvider initialized with models:', this.models.map(m => m.id))
  }

  getProviderName(): string {
    return ProviderType.RUNNINGHUB
  }

  getProviderDisplayName(): string {
    return 'RunningHub.ai'
  }

  getAvailableModels(): ModelInfo[] {
    return this.models
  }

  isConfigured(): boolean {
    return !!(this.apiKey && this.apiKey.trim())
  }

  private initializeModels(): void {
    this.models = [
      {
        id: 'smart-upscaler',
        name: 'Smart Upscaler',
        displayName: 'Smart Upscaler',
        description: 'High-quality image upscaling with crisp detail enhancement. Output in 4K (80 credits) or 8K (120 credits) resolution.',
        provider: {
          name: ProviderType.RUNNINGHUB,
          displayName: 'RunningHub.ai',
          description: 'ComfyUI cloud platform for advanced image processing',
          supportedFeatures: ['upscaling', '4k', '8k', 'crisp-detail']
        },
        version: '1.0',
        capabilities: ['upscaling', '4k-output', '8k-output'],
        parameters: {
          resolution: {
            type: 'select',
            default: '4k',
            options: ['4k', '8k'],
            description: 'Output resolution (4K or 8K)'
          }
        },
        pricing: {
          costPerImage: 0.008,
          currency: 'USD'
        }
      },
      {
        id: 'skin-editor',
        name: 'Skin Editor',
        displayName: 'Skin Editor',
        description: 'Advanced skin retraining and enhancement model with customizable modes for texture, blemishes, and more.',
        provider: {
          name: ProviderType.RUNNINGHUB,
          displayName: 'RunningHub.ai',
          description: 'ComfyUI cloud platform for advanced image processing',
          supportedFeatures: ['skin-enhancement', 'face-retouching', 'flux-processing']
        },
        version: '1.0',
        capabilities: [
          'skin-enhancement',
          'face-retouching',
          'texture-control',
          'blemish-control'
        ],
        parameters: {
          mode: {
            type: 'select',
            default: 'Subtle',
            options: ['Subtle', 'Clear', 'Pimples', 'Freckles'],
            description: 'Enhancement mode determining base settings'
          },
          denoise: {
            type: 'number',
            default: 0.20,
            min: 0.01,
            max: 1.0,
            step: 0.01,
            description: 'Denoising strength for img2img mode'
          },
          maxshift: {
            type: 'number',
            default: 1.0,
            min: 0.8,
            max: 1.2,
            step: 0.1,
            description: 'Max shift parameter'
          },
          megapixels: {
            type: 'number',
            default: 4,
            min: 2,
            max: 10,
            step: 1,
            description: 'Target megapixels'
          },
          seedvrupscaler: {
            type: 'boolean',
            default: false,
            description: 'Enable Seed VR Upscaler (generates multiple outputs)'
          }
        },
        pricing: {
          costPerImage: 0.01,
          currency: 'USD'
        }
      }
    ]
  }

  async enhanceImage(
    request: EnhancementRequest,
    modelId: string
  ): Promise<EnhancementResponse> {
    try {
      console.log(`🚀 RunningHub: enhancing image with modelId: ${modelId}`)
      console.log(`📋 RunningHub: Available models:`, this.models.map(m => m.id))

      // Validate request
      this.validateRequest(request)

      // Get model info
      const model = this.getModel(modelId)
      if (!model) {
        console.error(`❌ RunningHub: Model ${modelId} not found via getModel()`)
        return this.createErrorResponse(`Model ${modelId} not found`)
      }

      if (modelId === 'smart-upscaler') {
        return this.handleSmartUpscalerRequest(request, model)
      }

      if (modelId === 'skin-editor') {
        return this.handleSkinEditorRequest(request, model)
      }

      console.log('🚀 RunningHub: Enhancement request received', {
        modelId,
        userId: request.userId,
        imageId: request.imageId,
        settings: request.settings
      })

      // Sanitize and validate settings with correct parameter mapping
      const settings: RunningHubSettings = {
        prompt: request.settings.prompt || 'high quality, detailed, enhanced',
        steps: request.settings.steps || 10,
        guidance_scale: request.settings.guidance_scale || 3.5,
        denoise: request.settings.strength || request.settings.denoise || 0.3,
        sampler_name: this.mapSamplerName(String(request.settings.sampler_name || 'dpmpp_2m')),
        scheduler: this.mapSchedulerName(String(request.settings.scheduler || 'sgm_uniform')),
        seed: request.settings.seed,
        enable_upscale: request.settings.enable_upscale !== undefined ? request.settings.enable_upscale : true,
        upscaler: String(request.settings.upscaler || '4xRealWebPhoto_v4_dat2.pth')
      }

      // Validate parameter ranges
      if (typeof settings.steps === 'number' && (settings.steps < 1 || settings.steps > 50)) {
        return this.createErrorResponse('Steps must be between 1 and 50')
      }

      if (typeof settings.guidance_scale === 'number' && (settings.guidance_scale < 1 || settings.guidance_scale > 20)) {
        return this.createErrorResponse('Guidance scale must be between 1 and 20')
      }

      if (settings.seed && isNaN(parseInt(String(settings.seed)))) {
        return this.createErrorResponse('Seed must be a valid number')
      }

      if (typeof settings.denoise === 'number' && (settings.denoise < 0.1 || settings.denoise > 1)) {
        return this.createErrorResponse('Denoise strength must be between 0.1 and 1')
      }

      // Validate upscaler model selection
      const validUpscalers = ['4xRealWebPhoto_v4_dat2.pth', '4x_NMKD-Siax_200k.pth', '4x-UltraSharp.pth', 'RealESRGAN_x4plus.pth']
      if (typeof settings.upscaler === 'string' && !validUpscalers.includes(settings.upscaler)) {
        return this.createErrorResponse(`Invalid upscaler model. Must be one of: ${validUpscalers.join(', ')}`)
      }

      // Create ComfyUI task with RunningHub API
      const taskResponse = await this.createTask(request.imageUrl, settings)

      if (!taskResponse.success) {
        return this.createErrorResponse(taskResponse.error || 'Failed to create task')
      }

      // Poll for task completion
      const result = await this.pollTaskCompletion(taskResponse.taskId!)

      if (!result.success) {
        return this.createErrorResponse(result.error || 'Task failed')
      }

      console.log('✅ RunningHub: Enhancement completed successfully', {
        taskId: taskResponse.taskId,
        outputUrl: result.outputUrl
      })

      return {
        success: true,
        enhancedUrl: result.outputUrl,
        metadata: {
          modelVersion: model.version,
          processingTime: result.processingTime,
          settings: settings as EnhancementSettings,
          userId: request.userId,
          imageId: request.imageId,
          outputFormat: 'png',
          provider: this.getProviderName(),
          model: modelId,
          timestamp: Date.now(),
          details: {
            taskId: taskResponse.taskId,
            workflowId: (settings as any).workflowId || '1965053107388432385'
          }
        }
      }

    } catch (error: unknown) {
      console.error('❌ RunningHub: Enhancement failed:', error)
      return this.createErrorResponse(
        formatErrorMessage(error)
      )
    }
  }

  private async handleSmartUpscalerRequest(
    request: EnhancementRequest,
    model: ModelInfo
  ): Promise<EnhancementResponse> {
    const settings = request.settings as RunningHubSettings
    const { SMART_UPSCALER_WORKFLOW_ID, SMART_UPSCALER_NODES, SMART_UPSCALER_RESOLUTION_SETTINGS } = await import('../../../models/smart-upscaler/config')

    const resolution = ((settings as any).resolution as '4k' | '8k') || '4k'
    const resSettings = SMART_UPSCALER_RESOLUTION_SETTINGS[resolution] || SMART_UPSCALER_RESOLUTION_SETTINGS['4k']

    console.log(`🚀 RunningHub: Processing Smart Upscaler request`, {
      resolution,
      scaleBy: resSettings.scaleBy,
      width: resSettings.width,
      height: resSettings.height,
      workflowId: SMART_UPSCALER_WORKFLOW_ID
    })

    const nodeInfoListOverride = [
      {
        nodeId: SMART_UPSCALER_NODES.LOAD_IMAGE,
        fieldName: 'image',
        fieldValue: request.imageUrl.trim()
      },
      {
        nodeId: SMART_UPSCALER_NODES.SCALE_BY,
        fieldName: 'scale_by',
        fieldValue: resSettings.scaleBy
      },
      {
        nodeId: SMART_UPSCALER_NODES.RESIZE,
        fieldName: 'width',
        fieldValue: resSettings.width
      },
      {
        nodeId: SMART_UPSCALER_NODES.RESIZE,
        fieldName: 'height',
        fieldValue: resSettings.height
      }
    ]

    const taskResponse = await this.createTask(request.imageUrl, {
      workflowId: SMART_UPSCALER_WORKFLOW_ID,
      nodeInfoListOverride
    } as any)

    if (!taskResponse.success) {
      return this.createErrorResponse(taskResponse.error || 'Failed to create Smart Upscaler task')
    }

    const result = await this.pollTaskCompletion(taskResponse.taskId!, [SMART_UPSCALER_NODES.SAVE_IMAGE])

    if (!result.success) {
      return this.createErrorResponse(result.error || 'Smart Upscaler task failed')
    }

    console.log(`✅ RunningHub: Smart Upscaler completed successfully`)

    return {
      success: true,
      enhancedUrl: result.outputUrl,
      metadata: {
        modelVersion: model.version,
        processingTime: result.processingTime,
        settings: settings as EnhancementSettings,
        userId: request.userId,
        imageId: request.imageId,
        outputFormat: 'png',
        provider: this.getProviderName(),
        model: model.id,
        timestamp: Date.now(),
        details: {
          taskId: taskResponse.taskId,
          workflowId: SMART_UPSCALER_WORKFLOW_ID,
          resolution
        }
      }
    }
  }

  private async handleSkinEditorRequest(
    request: EnhancementRequest,
    model: ModelInfo
  ): Promise<EnhancementResponse> {
    const settings = request.settings as RunningHubSettings
    const { SKIN_EDITOR_MODES } = await import('../../../models/skin-editor/config')
    const isSmartUpscale = settings.smartUpscale === true

     // Apply mode defaults if not overridden
    const mode = (settings.mode as keyof typeof SKIN_EDITOR_MODES) || 'Subtle'
    const modeDefaults = SKIN_EDITOR_MODES[mode]

    // Handle Custom mode prompt
    let prompt = modeDefaults.prompt
    if (mode === 'Custom' && settings.customPrompt) {
        // Base part of the custom prompt (the suffixes about skin texture application)
        const baseSuffix = ", apply skin texture only for skin, apply skin texture only for face and skin and not on hair or dress, skin texture creates subtle micro-shadows and highlights under lighting"
        prompt = `${settings.customPrompt}${baseSuffix}`
    }

    const finalSettings = {
      ...modeDefaults,
      ...settings, // User overrides
      prompt // Use the constructed prompt
    }

    console.log('🚀 RunningHub: Processing Skin Editor request', {
      mode,
      finalSettings
    })

    // Prepare node overrides for Skin Editor workflow
    const nodeInfoList: NodeInfoOverride[] = [
      {
        nodeId: '97', // Input Image
        fieldName: 'image',
        fieldValue: request.imageUrl.trim() // Ensure no spaces
      },
      {
        nodeId: '140', // Prompt
        fieldName: 'text',
        fieldValue: finalSettings.prompt
      },
      {
        nodeId: '90', // Denoise
        fieldName: 'denoise',
        fieldValue: Number(finalSettings.denoise).toFixed(2) // Ensure proper number format
      },
      {
        nodeId: '167', // Max Shift
        fieldName: 'max_shift',
        fieldValue: Number(finalSettings.maxshift).toFixed(2)
      },
      {
        nodeId: '85', // Megapixels
        fieldName: 'megapixels',
        fieldValue: String(finalSettings.megapixels)
      },
      {
        nodeId: '88', // Guidance
        fieldName: 'guidance',
        fieldValue: String(finalSettings.guidance)
      }
    ]
    
    // Style Mapping (LoraLoader Node 166)
    if (settings.style) {
        nodeInfoList.push({
            nodeId: '166',
            fieldName: 'lora_name',
            fieldValue: settings.style
        })
    }
    
    // Protection Mapping (FaceParsingResultsParser Node 138)
    // Default protections if not provided
    const p = settings.protections || {
      face: { skin: false, nose: false, mouth: false, upperLip: false, lowerLip: false },
      eyes: { eyeGeneral: false, rightEye: false, leftEye: false, rightBrow: false, leftBrow: false },
      other: { hair: false, cloth: false, background: false, neck: false }
    };

    const protectionFields = [
      { field: 'skin', val: p.face?.skin },
      { field: 'nose', val: p.face?.nose },
      { field: 'mouth', val: p.face?.mouth },
      { field: 'u_lip', val: p.face?.upperLip },
      { field: 'l_lip', val: p.face?.lowerLip },
      { field: 'eye_g', val: p.eyes?.eyeGeneral },
      { field: 'r_eye', val: p.eyes?.rightEye },
      { field: 'l_eye', val: p.eyes?.leftEye },
      { field: 'r_brow', val: p.eyes?.rightBrow },
      { field: 'l_brow', val: p.eyes?.leftBrow },
      // Add defaults for others if needed
      { field: 'background', val: p.other?.background ?? false },
      { field: 'hair', val: p.other?.hair ?? false },
      { field: 'cloth', val: p.other?.cloth ?? false },
      { field: 'neck', val: p.other?.neck ?? false }
    ];

    protectionFields.forEach(({ field, val }) => {
      if (val !== undefined) {
        nodeInfoList.push({
          nodeId: '138',
          fieldName: field,
          fieldValue: String(val)
        })
      }
    })

    const resolution = settings.upscaleResolution || '4k'
    const smartUpscaleWorkflowId = settings.smartUpscaleWorkflowId
      || (resolution === '4k' ? settings.smartUpscaleWorkflowId4k : settings.smartUpscaleWorkflowId8k)
      || process.env.RUNNINGHUB_SKIN_EDITOR_SMART_UPSCALE_WORKFLOW_ID
      || '2023026925354094594'
    const standardWorkflowId = settings.workflowId
      || process.env.RUNNINGHUB_SKIN_EDITOR_WORKFLOW_ID
      || '2023005806844710914'
    const baseWorkflowId = isSmartUpscale ? smartUpscaleWorkflowId : standardWorkflowId
    const canUseSmartUpscale = isSmartUpscale

    if (canUseSmartUpscale) {
      if (resolution === '4k') {
        nodeInfoList.push({
          nodeId: '213',
          fieldName: 'scale_by',
          fieldValue: '2.000000000000'
        })
        nodeInfoList.push({
          nodeId: '214',
          fieldName: 'width',
          fieldValue: '4096'
        })
        nodeInfoList.push({
          nodeId: '214',
          fieldName: 'height',
          fieldValue: '4096'
        })
      } else {
        nodeInfoList.push({
          nodeId: '213',
          fieldName: 'scale_by',
          fieldValue: '4.000000000000'
        })
        nodeInfoList.push({
          nodeId: '214',
          fieldName: 'width',
          fieldValue: '8192'
        })
        nodeInfoList.push({
          nodeId: '214',
          fieldName: 'height',
          fieldValue: '8192'
        })
      }
    }

    const extraNodeInfoList = Array.isArray(settings.nodeInfoListOverride)
      ? settings.nodeInfoListOverride
      : []
    const finalNodeInfoList = mergeNodeInfoList(nodeInfoList, extraNodeInfoList)

    console.log('🚀 RunningHub: Final Node Overrides:', JSON.stringify(finalNodeInfoList, null, 2))

    // Create task
    const taskResponse = await this.createTask(request.imageUrl, {
      ...settings,
      workflowId: baseWorkflowId,
      nodeInfoListOverride: [
          ...finalNodeInfoList
      ]
    } as any)

    if (!taskResponse.success) {
      return this.createErrorResponse(taskResponse.error || 'Failed to create Skin Editor task')
    }

    const expectedNodeIds: string[] =
      canUseSmartUpscale ? ['215', '136'] : ['136']

    const result = await this.pollTaskCompletion(taskResponse.taskId!, expectedNodeIds)

    if (!result.success) {
      return this.createErrorResponse(result.error || 'Task failed')
    }

    // Determine final output(s)
    let finalOutput: string | string[] | undefined = result.outputUrl
    
    if (result.outputUrls && result.outputUrls.length > 0) {
        finalOutput = result.outputUrls;
    }

    return {
      success: true,
      enhancedUrl: finalOutput,
      metadata: {
        modelVersion: model.version,
        processingTime: result.processingTime,
        settings: finalSettings as unknown as EnhancementSettings,
        userId: request.userId,
        imageId: request.imageId,
        outputFormat: 'png',
        provider: this.getProviderName(),
        model: model.id,
        timestamp: Date.now(),
        details: {
          taskId: taskResponse.taskId,
          workflowId: baseWorkflowId
        }
      }
    }
  }

  private async createTask(imageUrl: string, settings: RunningHubSettings): Promise<{
    success: boolean
    taskId?: string
    error?: string
  }> {
    try {
      let processedImageUrl = imageUrl.trim()

      const uploadToRunningHub = async (buffer: Buffer, mimeType: string, extension: string) => {
        const formData = new FormData()
        const blob = new Blob([new Uint8Array(buffer)], { type: mimeType })
        const fileName = `upload-${Date.now()}.${extension}`

        formData.append('file', blob, fileName)
        formData.append('apikey', this.apiKey)
        formData.append('apiKey', this.apiKey)

        const uploadUrl = `${this.baseUrl}/task/openapi/upload`

        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error(`Upload failed with status ${response.status}`)
        }

        const data = await response.json() as any

        if (data.code !== 0 || !data.data || (!data.data.url && !data.data.fileName)) {
          console.error('RunningHub: Upload response error:', data)
          throw new Error(data.msg || 'Failed to upload image to RunningHub')
        }

        return data.data.fileName || data.data.url
      }

      const fetchWithRetry = async (url: string, attempts: number) => {
        let lastError: unknown
        for (let i = 0; i < attempts; i += 1) {
          try {
            const response = await fetch(url)
            if (response.ok) {
              return response
            }
            lastError = new Error(`Image download failed with status ${response.status}`)
          } catch (error) {
            lastError = error
          }
          if (i < attempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, 750 * (i + 1)))
          }
        }
        throw lastError
      }

      // Check if imageUrl is a base64 data URL and convert it
      if (imageUrl.startsWith('data:')) {
        console.log('RunningHub: Converting base64 image to public URL...')

        try {
          // Convert base64 to buffer for server-side upload
          const base64Data = imageUrl.split(',')[1]
          const mimeType = imageUrl.match(/data:([^;]+)/)?.[1] || 'image/jpeg'
          const extension = mimeType.split('/')[1] || 'jpg'

          console.log(`RunningHub: Base64 data length: ${base64Data?.length}, Mime: ${mimeType}`)

          if (!base64Data) {
            console.error('RunningHub: Invalid base64 data')
            return {
              success: false,
              error: 'Invalid base64 data URL'
            }
          }

          // Convert base64 to Buffer (Node.js compatible)
          const buffer = Buffer.from(base64Data, 'base64')

          console.log('RunningHub: Uploading directly to RunningHub...')

          processedImageUrl = await uploadToRunningHub(buffer, mimeType, extension)
          console.log('RunningHub: Successfully converted base64 to key/URL:', processedImageUrl)
        } catch (uploadError) {
          console.error('RunningHub: Failed to convert base64 image:', uploadError)
          return {
            success: false,
            error: 'Failed to process base64 image: ' + (uploadError instanceof Error ? uploadError.message : String(uploadError))
          }
        }
      } else if (/^https?:\/\//i.test(imageUrl)) {
        console.log('RunningHub: Downloading remote image for upload...')

        try {
          const response = await fetchWithRetry(imageUrl, 3)
          if (!response.ok) {
            throw new Error(`Image download failed with status ${response.status}`)
          }

          const arrayBuffer = await response.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const headerType = response.headers.get('content-type') || 'image/jpeg'
          const urlBase = imageUrl.split('?')[0] || ''
          const urlExtension = urlBase.includes('.') ? (urlBase.split('.').pop() || '') : ''
          const headerExtension = headerType.split('/')[1]
          const extension = headerExtension || urlExtension || 'jpg'

          processedImageUrl = await uploadToRunningHub(buffer, headerType, extension)
          console.log('RunningHub: Uploaded remote image to key/URL:', processedImageUrl)
        } catch (downloadError) {
          console.error('RunningHub: Failed to download/upload remote image:', downloadError)
          return {
            success: false,
            error: 'Failed to process remote image: ' + (downloadError instanceof Error ? downloadError.message : String(downloadError))
          }
        }
      } else {
        console.log('RunningHub: Image is not base64, using as is:', imageUrl.substring(0, 50) + '...')
      }

      // Generate random seed if not provided
      const seed = settings.seed ? parseInt(String(settings.seed)) : Math.floor(Math.random() * 1000000000000000)

      console.log('🔗 RunningHub: Creating task with image URL:', processedImageUrl.substring(0, 100) + '...')

      // Simplified node mapping focusing on essential parameters
      const nodeInfoList = [
        {
          nodeId: '97', // LoadImage node - essential for input
          fieldName: 'image',
          fieldValue: processedImageUrl
        },
        {
          nodeId: '86', // CLIPTextEncode node for prompt
          fieldName: 'text',
          fieldValue: settings.prompt || 'high quality, detailed, enhanced'
        },
        {
          nodeId: '89', // RandomNoise node for seed
          fieldName: 'noise_seed',
          fieldValue: seed.toString()
        }
      ]

      // Add additional nodes carefully to avoid conflicts
      if (settings.steps) {
        nodeInfoList.push({
          nodeId: '90', // BasicScheduler node for steps
          fieldName: 'steps',
          fieldValue: String(settings.steps)
        })
      }

      if (settings.guidance_scale) {
        nodeInfoList.push({
          nodeId: '88', // FluxGuidance node for guidance scale
          fieldName: 'guidance',
          fieldValue: String(settings.guidance_scale)
        })
      }

      if (settings.denoise && settings.steps) {
        // Only add denoise if we also have steps (same node)
        nodeInfoList.push({
          nodeId: '90', // BasicScheduler node for denoise strength
          fieldName: 'denoise',
          fieldValue: String(settings.denoise)
        })
      }

      if (settings.sampler_name) {
        nodeInfoList.push({
          nodeId: '87', // KSamplerSelect node for sampler
          fieldName: 'sampler_name',
          fieldValue: settings.sampler_name
        })
      }

      if (settings.scheduler && settings.steps) {
        // Only add scheduler if we also have steps (same node)
        nodeInfoList.push({
          nodeId: '90', // BasicScheduler node for scheduler
          fieldName: 'scheduler',
          fieldValue: settings.scheduler
        })
      }

      // Add upscaler node mode settings if present
      if (settings.node_191_mode !== undefined) {
        nodeInfoList.push({
          nodeId: '191',
          fieldName: 'mode',
          fieldValue: String(settings.node_191_mode)
        })
      }

      if (settings.node_192_mode !== undefined) {
        nodeInfoList.push({
          nodeId: '192',
          fieldName: 'mode',
          fieldValue: String(settings.node_192_mode)
        })
      }

      if (settings.node_193_mode !== undefined) {
        nodeInfoList.push({
          nodeId: '193',
          fieldName: 'mode',
          fieldValue: String(settings.node_193_mode)
        })
      }

      console.log('🔍 RunningHub: Node mappings being sent:', JSON.stringify(nodeInfoList, null, 2))

      const workflowId = (settings as any).workflowId || '2021189307448434690'
      let finalNodeInfoList = (settings as any).nodeInfoListOverride || nodeInfoList

      // Ensure the processed image URL is used in the final list (especially if override was used)
      // Matches any node with fieldName 'image' — works for all workflows (node '97', '230', etc.)
      if ((settings as any).nodeInfoListOverride && processedImageUrl !== imageUrl.trim()) {
        console.log('RunningHub: Updating image URL in override list with processed URL')
        finalNodeInfoList = finalNodeInfoList.map((node: any) => {
          if (node.fieldName === 'image') {
            return { ...node, fieldValue: processedImageUrl }
          }
          return node
        })
      }

      const requestPayload: any = {
        apiKey: this.apiKey,
        nodeInfoList: finalNodeInfoList
      }

      if (settings.workflowJson) {
        // Use provided workflow JSON (passed as 'prompt' parameter for ComfyUI API)
        // RunningHub might expect 'prompt' as an object, not a string
        requestPayload.prompt = settings.workflowJson
        // Some APIs require workflowId even if prompt is provided
        requestPayload.workflowId = workflowId
      } else {
        requestPayload.workflowId = workflowId
      }

      console.log('🔍 RunningHub: FULL API PAYLOAD:', JSON.stringify(requestPayload, null, 2))

      console.log(`🔍 RunningHub: Using ${settings.workflowJson ? 'Custom Workflow JSON' : 'Workflow ID: ' + workflowId}`)
      console.log('🔍 RunningHub: Node info list length:', finalNodeInfoList.length)

      console.log('🔍 RunningHub: API Request Details:', {
        url: `${this.baseUrl}/task/openapi/create`,
        method: 'POST',
        headers: {
          'Host': 'www.runninghub.ai',
          'Content-Type': 'application/json'
        },
        payloadSize: JSON.stringify(requestPayload).length,
        apiKeyLength: this.apiKey.length,
        workflowId,
        nodeCount: finalNodeInfoList.length
      })

      let response: Response
      try {
        response = await fetch(`${this.baseUrl}/task/openapi/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestPayload)
        })
        console.log('✅ RunningHub: Fetch successful, response status:', response.status)
      } catch (fetchError) {
        console.error('❌ RunningHub: Fetch failed with error:', fetchError)
        console.error('❌ RunningHub: Error details:', {
          name: fetchError instanceof Error ? fetchError.name : 'Unknown',
          message: fetchError instanceof Error ? fetchError.message : String(fetchError),
          cause: fetchError instanceof Error ? fetchError.cause : undefined
        })
        throw new Error(`Network request failed: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`)
      }

      console.log('🔍 RunningHub: Task creation response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log('❌ RunningHub: Task creation failed:', errorText)
        throw new Error(`RunningHub API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('✅ RunningHub: Task created successfully:', JSON.stringify(data, null, 2))

      if (data.code === 0 && data.data?.taskId) {
        // Check for node errors in promptTips
        if (data.data.promptTips) {
          try {
            const promptTips = JSON.parse(data.data.promptTips)
            if (promptTips.node_errors && Object.keys(promptTips.node_errors).length > 0) {
              console.log('⚠️ RunningHub: Node errors detected in workflow:', promptTips.node_errors)

              // Extract error details for better debugging
              const errorMessages: string[] = []
              for (const [nodeId, nodeError] of Object.entries(promptTips.node_errors as Record<string, any>)) {
                if (nodeError.errors && Array.isArray(nodeError.errors)) {
                  for (const error of nodeError.errors) {
                    errorMessages.push(`Node ${nodeId}: ${error.details || error.message || 'Unknown error'}`)
                  }
                }
              }

              console.log('🔍 RunningHub: Error details:', errorMessages)

              // Still continue with the task since it was created, but log the potential issues
              console.log('⚠️ RunningHub: Continuing with task despite node errors - outputs may be affected')
            }
          } catch (parseError) {
            console.log('⚠️ RunningHub: Could not parse promptTips:', parseError)
          }
        }

        return {
          success: true,
          taskId: data.data.taskId
        }
      } else {
        return {
          success: false,
          error: data.msg || 'Failed to create task'
        }
      }
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error creating task'
      }
    }
  }

  private async pollTaskCompletion(taskId: string, expectedNodeIds?: string[]): Promise<{
    success: boolean
    outputUrl?: string
    outputUrls?: string[]
    processingTime?: number
    error?: string
  }> {
    const maxAttempts = 60 // 5 minutes with 5-second intervals
    const pollInterval = 5000 // 5 seconds
    let attempts = 0
    const startTime = Date.now()

    let consecutiveErrors = 0
    const maxConsecutiveErrors = 20 // Increased from 5 to 20 to handle transient network issues
    let recoveryAttemptedCount = 0
    const maxRecoveryAttempts = 3

    while (attempts < maxAttempts) {
      try {
        // Check task status
        const statusResponse = await fetch(`${this.baseUrl}/task/openapi/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            apiKey: this.apiKey,
            taskId
          })
        })

        if (!statusResponse.ok) {
           throw new Error(`Status check failed: ${statusResponse.status} ${statusResponse.statusText}`)
        }

        const statusData = await statusResponse.json()
        
        // Reset error counter on success
        consecutiveErrors = 0

        console.log('🔍 RunningHub: Polling attempt', attempts + 1, 'Status response:', JSON.stringify(statusData, null, 2))

        if (statusData.code === 0) {
          const status = statusData.data

          console.log('🔍 RunningHub: Task status:', status)

          if (status === 'SUCCESS') {
            console.log('✅ RunningHub: Task completed successfully, waiting before fetching outputs...')
            await new Promise(resolve => setTimeout(resolve, 1000))

            console.log('🔍 RunningHub: Now fetching outputs...')

            // Try fetching outputs multiple times with increasing delays
            let outputData: any = null // Changed to any to avoid strict type checking issues with data access
            let outputAttempts = 0
            const maxOutputAttempts = 3

            while (outputAttempts < maxOutputAttempts) {
              try {
                const outputResponse = await fetch(`${this.baseUrl}/task/openapi/outputs`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    apiKey: this.apiKey,
                    taskId
                  })
                })
                
                if (outputResponse.ok) {
                    outputData = await outputResponse.json()
                    console.log(`🔍 RunningHub: Output attempt ${outputAttempts + 1}/${maxOutputAttempts}:`, JSON.stringify(outputData, null, 2))

                    // If we have outputs, break out of the loop
                    if (isRunningHubOutputsResponse(outputData) && Array.isArray(outputData.data) && outputData.code === 0 && outputData.data.length > 0) {
                        console.log('✅ RunningHub: Found outputs on attempt', outputAttempts + 1)
                        break
                    }
                } else {
                    console.warn(`⚠️ RunningHub: Output fetch failed with status ${outputResponse.status}`)
                }
              } catch (e) {
                console.warn(`⚠️ RunningHub: Output fetch error:`, e)
              }

              outputAttempts++
              if (outputAttempts < maxOutputAttempts) {
                console.log(`⏳ RunningHub: No outputs yet, waiting ${1000 * outputAttempts}ms before retry...`)
                await new Promise(resolve => setTimeout(resolve, 1000 * outputAttempts))
              }
            }

            if (isRunningHubOutputsResponse(outputData) && Array.isArray(outputData.data) && outputData.code === 0 && outputData.data.length > 0) {
              console.log('🔍 RunningHub: Output data found, checking for final output node...')
              console.log('🔍 RunningHub: Available outputs:', outputData.data.map((o) => ({ nodeId: o.nodeId, hasFileUrl: !!o.fileUrl })))

              // Log all available outputs for debugging
              console.log('🔍 RunningHub: All available outputs:', outputData.data.map(o => ({
                nodeId: o.nodeId,
                hasFileUrl: !!o.fileUrl,
                fileUrl: o.fileUrl ? o.fileUrl.substring(0, 100) + '...' : 'No URL'
              })))

              // Handle multiple expected outputs if provided
              if (expectedNodeIds && expectedNodeIds.length > 0) {
                  const sortedOutputs: string[] = []
                  
                  // Try to find outputs in the order of expectedNodeIds
                  for (const expectedId of expectedNodeIds) {
                      // Find output matching the node ID
                      const match = outputData.data.find(o => String(o.nodeId) === String(expectedId) && !!o.fileUrl)
                      if (match && match.fileUrl) {
                          sortedOutputs.push(match.fileUrl)
                      }
                  }
                  
                  const additionalOutputs = outputData.data
                    .map((o) => o.fileUrl)
                    .filter((url): url is string => !!url)
                    .filter((url) => !sortedOutputs.includes(url))

                  const combinedOutputs = [...sortedOutputs, ...additionalOutputs]
                  
                  if (combinedOutputs.length > 0) {
                      console.log(`✅ RunningHub: Found ${combinedOutputs.length} outputs with expected priority ordering`)
                      return {
                          success: true,
                          outputUrl: combinedOutputs[0],
                          outputUrls: combinedOutputs,
                          processingTime: Date.now() - startTime
                      }
                  } else {
                      console.warn('⚠️ RunningHub: Expected node IDs provided but no matching outputs found, falling back to default logic')
                  }
              }

              // Look for actual output node IDs from this workflow (prioritize common output nodes)
              // Added 98 and 139 based on outputs_to_execute from task creation response
              const priorityNodeIds = ['102', '136', '144', '138', '143', '98', '139'] // Main workflow outputs
              const fallbackNodeIds = ['99', '100', '101', '103', '104', '105'] // Common ComfyUI output nodes

              let finalOutput: RunningHubOutputItem | undefined

              // First try priority nodes
              for (const nodeId of priorityNodeIds) {
                finalOutput = outputData.data.find((output) => String(output.nodeId) === String(nodeId) && !!output.fileUrl)
                if (finalOutput) {
                  console.log(`✅ RunningHub: Found output from priority node ${nodeId}:`, finalOutput.fileUrl)
                  break
                }
              }

              // Then try fallback nodes
              if (!finalOutput) {
                for (const nodeId of fallbackNodeIds) {
                  finalOutput = outputData.data.find((output) => String(output.nodeId) === String(nodeId) && !!output.fileUrl)
                  if (finalOutput) {
                    console.log(`✅ RunningHub: Found output from fallback node ${nodeId}:`, finalOutput.fileUrl)
                    break
                  }
                }
              }

              // If no specific node found, try to find any output with a file URL
              if (!finalOutput) {
                finalOutput = outputData.data.find((output) => !!output.fileUrl)
                if (finalOutput) {
                  console.log('✅ RunningHub: Found any output from node', finalOutput.nodeId, ':', finalOutput.fileUrl)
                }
              }

              // Debug: Log the structure of the first item to check for property names
              if (outputData.data && outputData.data.length > 0) {
                 const firstItem = outputData.data[0]
                 if (firstItem) {
                    console.log('🔍 RunningHub: First output item keys:', Object.keys(firstItem))
                    
                    // Check if maybe the property is named differently (e.g. file_url, url, image, etc.)
                    const itemAny = firstItem as any
                    if (!finalOutput && (itemAny.file_url || itemAny.url || itemAny.image)) {
                        console.log('⚠️ RunningHub: Possible property mismatch. Found:', {
                          file_url: itemAny.file_url,
                          url: itemAny.url,
                          image: itemAny.image
                        })
                        // Try to use alternative property names
                        const altOutput = outputData.data.find((output: any) => output.file_url || output.url || output.image)
                        if (altOutput) {
                          const altItemAny = altOutput as any
                          const altUrl = altItemAny.file_url || altItemAny.url || altItemAny.image
                          console.log('✅ RunningHub: Found output using alternative property:', altUrl)
                          finalOutput = { ...altOutput, fileUrl: altUrl } as RunningHubOutputItem
                        }
                    }
                 }
              }

              if (finalOutput && finalOutput.fileUrl) {
                return {
                  success: true,
                  outputUrl: finalOutput.fileUrl,
                  processingTime: Date.now() - startTime
                }
              }

              console.log('❌ RunningHub: No valid output found in response')
              console.log('🔍 RunningHub: All outputs:', JSON.stringify(outputData.data, null, 2))
              return {
                success: false,
                error: 'No valid output found in response',
                processingTime: Date.now() - startTime
              }
            } else {
              // Check if we have a valid response with empty data
              if (isRunningHubOutputsResponse(outputData) && Array.isArray(outputData.data) && outputData.code === 0) {
                console.log('❌ RunningHub: Valid response but empty output data')
                console.log('🔍 RunningHub: Response details:', {
                  code: outputData.code,
                  msg: outputData.msg,
                  dataLength: outputData.data.length,
                  dataItems: outputData.data
                })
                return {
                  success: false,
                  error: 'Workflow completed successfully but produced no outputs. This may indicate a workflow configuration issue.',
                  processingTime: Date.now() - startTime
                }
              } else {
                console.log('❌ RunningHub: Invalid output response structure')
                try {
                  console.log('🔍 RunningHub: Raw output response:', JSON.stringify(outputData))
                } catch {
                  console.log('🔍 RunningHub: Could not stringify output response')
                }
                return {
                  success: false,
                  error: 'Invalid output response structure - unexpected response format',
                  processingTime: Date.now() - startTime
                }
              }
            }
          } else if (status === 'FAILED') {
            // Recovery logic for potential false failures
            if (recoveryAttemptedCount < maxRecoveryAttempts) {
              recoveryAttemptedCount++
              const waitTime = 10000 * recoveryAttemptedCount // 10s, 20s, 30s
              console.log(`⚠️ RunningHub: Task reported as FAILED. Attempt ${recoveryAttemptedCount}/${maxRecoveryAttempts} to double check in case of transient error. Waiting ${waitTime/1000}s...`)
              await new Promise(resolve => setTimeout(resolve, waitTime))
              continue
            }
            console.log('❌ RunningHub: Task confirmed failed on RunningHub after retries')
            return {
              success: false,
              error: 'Task failed on RunningHub'
            }
          } else {
            console.log('⏳ RunningHub: Task still processing, status:', status)
          }
          // Continue polling for QUEUED or RUNNING status
        }

        attempts++
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, pollInterval))
        }
      } catch (error: unknown) {
        console.warn('⚠️ RunningHub: Polling error:', error)
        consecutiveErrors++
        
        if (consecutiveErrors >= maxConsecutiveErrors) {
           console.error(`❌ RunningHub: Max consecutive errors (${maxConsecutiveErrors}) reached. Aborting.`)
           return {
            success: false,
            error: error instanceof Error ? error.message : 'Error polling task status (max retries reached)'
           }
        }
        
        // Exponential backoff for network errors: 5s, 10s, 15s... capped at 30s
        const backoffTime = Math.min(pollInterval * consecutiveErrors, 30000)
        console.log(`⏳ RunningHub: Retrying polling (error ${consecutiveErrors}/${maxConsecutiveErrors}) in ${backoffTime/1000}s...`)
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, backoffTime))
      }
    }

    return {
      success: false,
      error: 'Task timeout - processing took too long'
    }
  }

  // ── Async task methods (non-blocking: start task, return immediately) ────────

  public async startTaskForModel(
    request: EnhancementRequest,
    modelId: string
  ): Promise<{ success: boolean; runningHubTaskId?: string; expectedNodeIds?: string[]; error?: string }> {
    try {
      this.validateRequest(request)

      if (modelId === 'smart-upscaler') {
        const { SMART_UPSCALER_WORKFLOW_ID, SMART_UPSCALER_NODES, SMART_UPSCALER_RESOLUTION_SETTINGS } = await import('../../../models/smart-upscaler/config')
        const settings = request.settings as RunningHubSettings
        const resolution = ((settings as any).resolution as '4k' | '8k') || '4k'
        const resSettings = SMART_UPSCALER_RESOLUTION_SETTINGS[resolution] || SMART_UPSCALER_RESOLUTION_SETTINGS['4k']
        const nodeInfoListOverride = [
          { nodeId: SMART_UPSCALER_NODES.LOAD_IMAGE, fieldName: 'image', fieldValue: request.imageUrl.trim() },
          { nodeId: SMART_UPSCALER_NODES.SCALE_BY, fieldName: 'scale_by', fieldValue: resSettings.scaleBy },
          { nodeId: SMART_UPSCALER_NODES.RESIZE, fieldName: 'width', fieldValue: resSettings.width },
          { nodeId: SMART_UPSCALER_NODES.RESIZE, fieldName: 'height', fieldValue: resSettings.height }
        ]
        const taskResponse = await this.createTask(request.imageUrl, { workflowId: SMART_UPSCALER_WORKFLOW_ID, nodeInfoListOverride } as any)
        if (!taskResponse.success) return { success: false, error: taskResponse.error }
        return { success: true, runningHubTaskId: taskResponse.taskId, expectedNodeIds: [String(SMART_UPSCALER_NODES.SAVE_IMAGE)] }
      }

      if (modelId === 'skin-editor') {
        const settings = request.settings as RunningHubSettings
        const { SKIN_EDITOR_MODES } = await import('../../../models/skin-editor/config')
        const isSmartUpscale = settings.smartUpscale === true
        const mode = (settings.mode as keyof typeof SKIN_EDITOR_MODES) || 'Subtle'
        const modeDefaults = SKIN_EDITOR_MODES[mode]
        let prompt = modeDefaults.prompt
        if (mode === 'Custom' && settings.customPrompt) {
          prompt = `${settings.customPrompt}, apply skin texture only for skin, apply skin texture only for face and skin and not on hair or dress, skin texture creates subtle micro-shadows and highlights under lighting`
        }
        const finalSettings = { ...modeDefaults, ...settings, prompt }
        const nodeInfoList: NodeInfoOverride[] = [
          { nodeId: '97', fieldName: 'image', fieldValue: request.imageUrl.trim() },
          { nodeId: '140', fieldName: 'text', fieldValue: finalSettings.prompt },
          { nodeId: '90', fieldName: 'denoise', fieldValue: Number(finalSettings.denoise).toFixed(2) },
          { nodeId: '167', fieldName: 'max_shift', fieldValue: Number(finalSettings.maxshift).toFixed(2) },
          { nodeId: '85', fieldName: 'megapixels', fieldValue: String(finalSettings.megapixels) },
          { nodeId: '88', fieldName: 'guidance', fieldValue: String(finalSettings.guidance) }
        ]
        if (settings.style) nodeInfoList.push({ nodeId: '166', fieldName: 'lora_name', fieldValue: settings.style })
        const p = settings.protections || { face: { skin: false, nose: false, mouth: false, upperLip: false, lowerLip: false }, eyes: { eyeGeneral: false, rightEye: false, leftEye: false, rightBrow: false, leftBrow: false }, other: { hair: false, cloth: false, background: false, neck: false } }
        const protectionFields = [
          { field: 'skin', val: p.face?.skin }, { field: 'nose', val: p.face?.nose }, { field: 'mouth', val: p.face?.mouth },
          { field: 'u_lip', val: p.face?.upperLip }, { field: 'l_lip', val: p.face?.lowerLip }, { field: 'eye_g', val: p.eyes?.eyeGeneral },
          { field: 'r_eye', val: p.eyes?.rightEye }, { field: 'l_eye', val: p.eyes?.leftEye }, { field: 'r_brow', val: p.eyes?.rightBrow },
          { field: 'l_brow', val: p.eyes?.leftBrow }, { field: 'background', val: p.other?.background ?? false },
          { field: 'hair', val: p.other?.hair ?? false }, { field: 'cloth', val: p.other?.cloth ?? false }, { field: 'neck', val: p.other?.neck ?? false }
        ]
        protectionFields.forEach(({ field, val }) => { if (val !== undefined) nodeInfoList.push({ nodeId: '138', fieldName: field, fieldValue: String(val) }) })
        const resolution = settings.upscaleResolution || '4k'
        const smartUpscaleWorkflowId = settings.smartUpscaleWorkflowId || (resolution === '4k' ? settings.smartUpscaleWorkflowId4k : settings.smartUpscaleWorkflowId8k) || process.env.RUNNINGHUB_SKIN_EDITOR_SMART_UPSCALE_WORKFLOW_ID || '2023026925354094594'
        const standardWorkflowId = settings.workflowId || process.env.RUNNINGHUB_SKIN_EDITOR_WORKFLOW_ID || '2023005806844710914'
        const baseWorkflowId = isSmartUpscale ? smartUpscaleWorkflowId : standardWorkflowId
        if (isSmartUpscale) {
          if (resolution === '4k') {
            nodeInfoList.push({ nodeId: '213', fieldName: 'scale_by', fieldValue: '2.000000000000' })
            nodeInfoList.push({ nodeId: '214', fieldName: 'width', fieldValue: '4096' })
            nodeInfoList.push({ nodeId: '214', fieldName: 'height', fieldValue: '4096' })
          } else {
            nodeInfoList.push({ nodeId: '213', fieldName: 'scale_by', fieldValue: '4.000000000000' })
            nodeInfoList.push({ nodeId: '214', fieldName: 'width', fieldValue: '8192' })
            nodeInfoList.push({ nodeId: '214', fieldName: 'height', fieldValue: '8192' })
          }
        }
        const extraNodeInfoList = Array.isArray(settings.nodeInfoListOverride) ? settings.nodeInfoListOverride : []
        const finalNodeInfoList = mergeNodeInfoList(nodeInfoList, extraNodeInfoList)
        const taskResponse = await this.createTask(request.imageUrl, { ...settings, workflowId: baseWorkflowId, nodeInfoListOverride: finalNodeInfoList } as any)
        if (!taskResponse.success) return { success: false, error: taskResponse.error }
        return { success: true, runningHubTaskId: taskResponse.taskId, expectedNodeIds: isSmartUpscale ? ['215', '136'] : ['136'] }
      }

      return { success: false, error: `Unknown model: ${modelId}` }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  public async checkTaskOnce(
    runningHubTaskId: string,
    expectedNodeIds?: string[]
  ): Promise<{ status: 'queued' | 'running' | 'success' | 'failed'; outputUrl?: string; outputUrls?: string[]; error?: string }> {
    try {
      const statusResponse = await fetch(`${this.baseUrl}/task/openapi/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: this.apiKey, taskId: runningHubTaskId })
      })
      if (!statusResponse.ok) return { status: 'running' }
      const statusData = await statusResponse.json()
      if (statusData.code !== 0) return { status: 'running' }
      const taskStatus = statusData.data
      if (taskStatus === 'SUCCESS') {
        await new Promise(resolve => setTimeout(resolve, 1000))
        let outputData: any = null
        for (let i = 0; i < 3; i++) {
          try {
            const outputResponse = await fetch(`${this.baseUrl}/task/openapi/outputs`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ apiKey: this.apiKey, taskId: runningHubTaskId })
            })
            if (outputResponse.ok) {
              outputData = await outputResponse.json()
              if (isRunningHubOutputsResponse(outputData) && outputData.data?.length && outputData.code === 0) break
            }
          } catch { /* ignore, retry */ }
          if (i < 2) await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
        }
        if (!isRunningHubOutputsResponse(outputData) || !outputData.data?.length) return { status: 'success', error: 'No outputs found' }
        const urls: string[] = []
        if (expectedNodeIds?.length) {
          for (const nodeId of expectedNodeIds) {
            const match = outputData.data.find((o: RunningHubOutputItem) => String(o.nodeId) === String(nodeId) && !!o.fileUrl)
            if (match?.fileUrl) urls.push(match.fileUrl)
          }
        }
        for (const item of outputData.data) {
          if (item.fileUrl && !urls.includes(item.fileUrl)) urls.push(item.fileUrl)
        }
        return { status: 'success', outputUrl: urls[0], outputUrls: urls }
      }
      if (taskStatus === 'FAILED') return { status: 'failed', error: 'Task failed on RunningHub' }
      return { status: 'running' }
    } catch {
      return { status: 'running' }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  protected validateRequest(request: EnhancementRequest): void {
    if (!request.imageUrl) {
      throw new Error('Image URL is required')
    }
    if (!request.userId) {
      throw new Error('User ID is required')
    }
    if (!request.imageId) {
      throw new Error('Image ID is required')
    }
  }

  protected getModel(modelId: string): ModelInfo | undefined {
    return this.models.find(model => model.id === modelId)
  }

  private mapSamplerName(samplerName: string | undefined): string {
    if (!samplerName) return 'dpmpp_2m'

    // Map common sampler names to RunningHub valid values
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

  private mapSchedulerName(schedulerName: string | undefined): string {
    if (!schedulerName) return 'sgm_uniform'

    // Map common scheduler names to RunningHub valid values
    const schedulerMap: Record<string, string> = {
      'DPM++ 2M': 'sgm_uniform', // DPM++ 2M is a sampler, not scheduler
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
      'beta': 'beta',
      'linear_quadratic': 'linear_quadratic',
      'kl_optimal': 'kl_optimal',
      'ays': 'ays',
      'ays+': 'ays+',
      'ays_30': 'ays_30',
      'ays_30+': 'ays_30+'
    }

    return schedulerMap[schedulerName] || 'sgm_uniform'
  }

  protected createErrorResponse(error: string, details?: unknown): EnhancementResponse {
    return {
      success: false,
      error,
      message: 'RunningHub enhancement failed',
      metadata: {
        provider: this.getProviderName(),
        timestamp: Date.now(),
        details
      }
    }
  }
}
