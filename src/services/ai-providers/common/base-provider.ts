import { EnhancementRequest, EnhancementResponse, ModelInfo, ProviderConfig } from './types'

/**
 * Abstract base class that all AI model providers must implement
 */
export abstract class BaseAIProvider {
  protected config: ProviderConfig
  protected models: ModelInfo[] = []

  constructor(config: ProviderConfig) {
    this.config = config
  }

  /**
   * Get the provider name
   */
  abstract getProviderName(): string

  /**
   * Get the provider display name
   */
  abstract getProviderDisplayName(): string

  /**
   * Get available models for this provider
   */
  abstract getAvailableModels(): ModelInfo[]

  /**
   * Enhance an image using the specified model
   */
  abstract enhanceImage(
    request: EnhancementRequest,
    modelId: string
  ): Promise<EnhancementResponse>

  /**
   * Check if the provider is properly configured
   */
  abstract isConfigured(): boolean

  /**
   * Validate the enhancement request
   */
  protected validateRequest(request: EnhancementRequest): void {
    if (!request.imageUrl) {
      throw new Error('Image URL is required')
    }
    if (!request.settings) {
      throw new Error('Enhancement settings are required')
    }
    // userId and imageId are optional - defaults are provided by the API layer
  }

  /**
   * Get model by ID
   */
  protected getModel(modelId: string): ModelInfo | undefined {
    return this.models.find(model => model.id === modelId)
  }

  /**
   * Create a standardized error response
   */
  protected createErrorResponse(error: string, details?: unknown): EnhancementResponse {
    return {
      success: false,
      error,
      message: 'Image enhancement failed',
      metadata: {
        provider: this.getProviderName(),
        timestamp: Date.now(),
        details
      }
    }
  }

  /**
   * Create a standardized success response
   */
  protected createSuccessResponse(
    enhancedUrl: string,
    request: EnhancementRequest,
    modelId: string,
    additionalMetadata?: Record<string, unknown>
  ): EnhancementResponse {
    return {
      success: true,
      enhancedUrl,
      message: 'Image enhanced successfully',
      metadata: {
        provider: this.getProviderName(),
        model: modelId,
        processingTime: Date.now(),
        settings: request.settings,
        userId: request.userId,
        imageId: request.imageId,
        ...additionalMetadata
      }
    }
  }
}