import { AIProviderFactory } from './provider-factory'
import {
  EnhancementRequest,
  EnhancementResponse,
  ModelInfo,
  ProviderType,
  EnhancementJob,
} from './common/types'
import { generateJobId, estimateProcessingTime } from './common/utils'

/**
 * High-level service for image enhancement
 * Provides a unified interface across all AI providers
 */
export class EnhancementService {
  private static instance: EnhancementService
  private jobs: Map<string, EnhancementJob> = new Map()
  private lastDbUpdateProgress: Map<string, number> = new Map()
  
  // Define milestone percentages for database updates
  private readonly DB_UPDATE_MILESTONES = [20, 50, 80, 95, 100]
  
  private shouldUpdateDatabase(jobId: string, currentProgress: number): boolean {
    const lastProgress = this.lastDbUpdateProgress.get(jobId) || 0
    
    // Always update on completion (100%)
    if (currentProgress >= 100) {
      return true
    }
    
    // Check if we've crossed any milestone
    for (const milestone of this.DB_UPDATE_MILESTONES) {
      if (currentProgress >= milestone && lastProgress < milestone) {
        return true
      }
    }
    
    return false
  }

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): EnhancementService {
    if (!this.instance) {
      this.instance = new EnhancementService()
    }
    return this.instance
  }

  /**
   * Enhance an image using the specified model
   */
  async enhanceImage(
    request: EnhancementRequest,
    modelId: string = 'skin-editor',
    progressCallback?: (progress: number, status: string) => Promise<void>
  ): Promise<EnhancementResponse> {
    let jobId: string = ''
    try {
      // Determine provider from model ID
      const providerType = AIProviderFactory.getProviderByModelId(modelId)
      
      // Get provider instance
      const provider = AIProviderFactory.getProvider(providerType)
      
      // Check if provider is configured
      if (!provider.isConfigured()) {
        return {
          success: false,
          error: `Provider ${providerType} is not properly configured`,
          message: 'Provider configuration missing'
        }
      }

      // Create job for tracking with enhanced metadata
      jobId = generateJobId()
      const startTime = Date.now()
      const job: EnhancementJob = {
        id: jobId,
        userId: request.userId,
        imageId: request.imageId,
        provider: providerType,
        model: modelId,
        status: {
          status: 'processing',
          estimatedTime: estimateProcessingTime(request.imageUrl, request.settings),
          progress: 0
        },
        request,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      this.jobs.set(jobId, job)

      console.log('🚀 EnhancementService: Starting enhancement', {
        jobId,
        provider: providerType,
        modelId,
        userId: request.userId,
        imageId: request.imageId
      })

      // Update progress: Starting with enhanced metadata
      job.status.progress = 10
      job.status.message = 'Initializing enhancement process'
      job.updatedAt = new Date()
      this.jobs.set(jobId, job)
      
      // Only update database at milestones
      if (progressCallback && this.shouldUpdateDatabase(jobId, 10)) {
        await progressCallback(10, 'initializing')
        this.lastDbUpdateProgress.set(jobId, 10)
      }

      // Update progress: Processing with detailed status
      job.status.progress = 30
      job.status.message = `Processing with ${providerType} using ${modelId}`
      job.updatedAt = new Date()
      this.jobs.set(jobId, job)
      
      // Only update database at milestones
      if (progressCallback && this.shouldUpdateDatabase(jobId, 30)) {
        await progressCallback(30, 'processing')
        this.lastDbUpdateProgress.set(jobId, 30)
      }

      // Perform enhancement with timing
      const enhancementStartTime = Date.now()
      const result = await provider.enhanceImage(request, modelId)
      const enhancementEndTime = Date.now()
      const enhancementDuration = enhancementEndTime - enhancementStartTime
      
      // Update progress: Finalizing with performance data
      job.status.progress = 90
      job.status.message = 'Finalizing and preparing results'
      job.updatedAt = new Date()
      this.jobs.set(jobId, job)
      
      // Only update database at milestones
      if (progressCallback && this.shouldUpdateDatabase(jobId, 90)) {
        await progressCallback(90, 'finalizing')
        this.lastDbUpdateProgress.set(jobId, 90)
      }
      
      // Calculate total processing time
      const totalProcessingTime = Date.now() - startTime
      
      // Update job status with comprehensive metadata
      job.status = {
        status: result.success ? 'completed' : 'failed',
        progress: result.success ? 100 : job.status.progress,
        message: result.message || (result.success ? 'Enhancement completed successfully' : 'Enhancement failed')
      }
      job.response = result
      job.updatedAt = new Date()
      if (result.success) {
        job.completedAt = new Date()
      }
      
      this.jobs.set(jobId, job)

      // Add comprehensive metadata to response
      const enhancedMetadata = {
        jobId,
        provider: providerType,
        model: modelId,
        processingTime: totalProcessingTime,
        enhancementDuration,
        userId: request.userId,
        imageId: request.imageId,
        timestamp: Date.now(),
        settings: request.settings,
        outputFormat: 'png',
        modelVersion: result.metadata?.modelVersion,
        performance: {
          totalTime: totalProcessingTime,
          enhancementTime: enhancementDuration,
          queueTime: enhancementStartTime - startTime,
          efficiency: enhancementDuration / totalProcessingTime
        },
        quality: {
          inputResolution: 'detected',
          outputResolution: request.settings.resolution || 'original',
          enhancementType: 'ai-powered',
          algorithmUsed: modelId
        },
        session: {
          startedAt: new Date(startTime).toISOString(),
          completedAt: new Date().toISOString(),
          status: result.success ? 'success' : 'failed'
        }
      }
      
      if (result.metadata) {
        result.metadata = { ...result.metadata, ...enhancedMetadata }
      } else {
        result.metadata = enhancedMetadata
      }

      // Final progress callback for completion
      const finalProgress = result.success ? 100 : (job.status.progress || 0)
      if (progressCallback && this.shouldUpdateDatabase(jobId, finalProgress)) {
        await progressCallback(finalProgress, result.success ? 'completed' : 'failed')
        this.lastDbUpdateProgress.set(jobId, finalProgress)
      }
      
      // Cleanup tracking data for completed jobs
      this.lastDbUpdateProgress.delete(jobId)

      console.log('✅ EnhancementService: Enhancement completed', {
        jobId,
        success: result.success,
        hasUrl: !!result.enhancedUrl
      })

      return result

    } catch (error) {
      console.error('❌ EnhancementService: Enhancement failed', error)
      
      // Cleanup tracking data for failed jobs
      this.lastDbUpdateProgress.delete(jobId)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Enhancement failed'
      }
    }
  }

  /**
   * Get all available models across all providers
   */
  getAvailableModels(): ModelInfo[] {
    const allModels: ModelInfo[] = []
    
    const configuredProviders = AIProviderFactory.getConfiguredProviders()
    
    for (const providerType of configuredProviders) {
      try {
        const provider = AIProviderFactory.getProvider(providerType)
        const models = provider.getAvailableModels()
        allModels.push(...models)
      } catch (error) {
        console.warn(`Failed to get models from provider ${providerType}:`, error)
      }
    }
    
    return allModels
  }

  /**
   * Get models for a specific provider
   */
  getModelsForProvider(providerType: ProviderType): ModelInfo[] {
    try {
      const provider = AIProviderFactory.getProvider(providerType)
      return provider.getAvailableModels()
    } catch (error) {
      console.warn(`Failed to get models for provider ${providerType}:`, error)
      return []
    }
  }

  /**
   * Get job status by ID
   */
  getJobStatus(jobId: string): EnhancementJob | null {
    return this.jobs.get(jobId) || null
  }

  /**
   * Get all jobs for a user
   */
  getUserJobs(userId: string): EnhancementJob[] {
    return Array.from(this.jobs.values()).filter(job => job.userId === userId)
  }

  /**
   * Get provider status and availability
   */
  getProviderStatus(): Record<ProviderType, { available: boolean; configured: boolean }> {
    const status: Record<string, { available: boolean; configured: boolean }> = {}
    
    for (const providerType of AIProviderFactory.getAvailableProviders()) {
      const configured = AIProviderFactory.isProviderAvailable(providerType)
      let available = false
      
      if (configured) {
        try {
          const provider = AIProviderFactory.getProvider(providerType)
          available = provider.isConfigured()
        } catch {
          available = false
        }
      }
      
      status[providerType] = { available, configured }
    }
    
    return status as Record<ProviderType, { available: boolean; configured: boolean }>
  }

  /**
   * Clear old jobs (cleanup)
   */
  clearOldJobs(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000)
    
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.createdAt < cutoffTime) {
        this.jobs.delete(jobId)
      }
    }
  }
}