// Export main service and factory
export { EnhancementService } from './enhancement-service'
export { AIProviderFactory } from './provider-factory'

// Export common types and interfaces
export * from './common'

// Export specific providers
export { RunningHubProvider } from './runninghub'

// Re-export commonly used types for convenience
export type {
  EnhancementRequest,
  EnhancementResponse,
  ModelInfo,
  ProviderType,
  EnhancementSettings
} from './common/types'