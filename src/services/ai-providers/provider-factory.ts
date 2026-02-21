import { ProviderType, type ProviderConfig } from './common/types'
import { RunningHubProvider } from './runninghub/runninghub-provider'
import { config } from '../../lib/config'
import { BaseAIProvider } from './common/base-provider'

/**
 * Factory class for creating AI provider instances
 * Implements singleton pattern for each provider type
 */
export class AIProviderFactory {
  private static providers = new Map<ProviderType, BaseAIProvider>()

  /**
   * Get or create a provider instance
   */
  static getProvider(type: ProviderType, config?: ProviderConfig): BaseAIProvider {
    // Check if provider already exists
    if (this.providers.has(type)) {
      return this.providers.get(type) as BaseAIProvider
    }

    // Create new provider instance
    const provider = this.createProvider(type, config)

    // Cache the provider instance
    this.providers.set(type, provider)

    return provider
  }

  /**
   * Create a new provider instance
   */
  private static createProvider(type: ProviderType, config?: ProviderConfig): BaseAIProvider {
    const providerConfig = config || this.getDefaultConfig(type)

    switch (type) {
      case ProviderType.RUNNINGHUB:
        return new RunningHubProvider(providerConfig)

      default:
        throw new Error(`Unsupported provider type: ${type}`)
    }
  }

  /**
   * Get default configuration for a provider
   */
  private static getDefaultConfig(type: ProviderType): ProviderConfig {
    switch (type) {
      case ProviderType.RUNNINGHUB:
        return {
          apiKey: config.ai.runninghub.apiToken,
          baseUrl: config.ai.runninghub.baseUrl,
          timeout: config.ai.runninghub.timeout,
          retries: config.ai.runninghub.retries
        }

      default:
        throw new Error(`No default config available for provider type: ${type}`)
    }
  }

  /**
   * Get all available providers
   */
  static getAvailableProviders(): ProviderType[] {
    return Object.values(ProviderType)
  }

  /**
   * Check if a provider is configured and available
   */
  static isProviderAvailable(type: ProviderType): boolean {
    try {
      const config = this.getDefaultConfig(type)
      return !!config.apiKey
    } catch {
      return false
    }
  }

  /**
   * Get all configured providers
   */
  static getConfiguredProviders(): ProviderType[] {
    return this.getAvailableProviders().filter(type => this.isProviderAvailable(type))
  }

  /**
   * Clear provider cache (useful for testing or config changes)
   */
  static clearCache(): void {
    this.providers.clear()
  }

  /**
   * Get provider by model ID (useful when model ID contains provider info)
   */
  static getProviderByModelId(modelId: string): ProviderType {
    // Only RunningHub is supported now
    return ProviderType.RUNNINGHUB
  }
}