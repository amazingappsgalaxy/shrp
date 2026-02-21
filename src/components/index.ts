// Component exports for Sharpii.ai

// UI Components
export { Button } from './ui/button'
export { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
export { Navigation } from './ui/navigation'
export { HeroSection } from './ui/hero-section'
export { SparklesText } from './ui/sparkles-text'
export { AwardBadge, AWARD_PRESETS } from './ui/award-badge'
export { StarBorder } from './ui/star-border'
export { ImageComparison } from './ui/image-comparison'
export { ImageComparisonHorizontal } from './ui/image-comparison-horizontal'
export { ImageZoom } from './ui/image-zoom'
export { ScrollXCarousel } from './ui/scroll-x-carousel'
export { InfiniteSliderHorizontal, PARTNER_LOGOS, FEATURED_RESULTS } from './ui/infinite-slider-horizontal'
export { TestimonialsSection } from './ui/testimonials-section'
export { PricingSection } from './ui/pricing-section'
export { CTASection } from './ui/cta-section'
export { FeaturesSection } from './ui/features-section'
export { StatsSection } from './ui/stats-section'
export { Footer } from './ui/footer'
export { AuroraBackground } from './ui/aurora-background'

// Section Components
export { WorkflowSection } from './sections/WorkflowSection'
export { GallerySection } from './sections/GallerySection'
export { ComparisonSection } from './sections/ComparisonSection'
export { ShowcaseSection } from './sections/ShowcaseSection'
export { FAQSection } from './sections/FAQSection'

// Shared Components
export { LazyImage, ProgressiveImage, OptimizedImage, ZoomImage } from './shared/LazyImage'
export { ParallaxContainer, ParallaxImage, ParallaxText, ParallaxSection } from './shared/ParallaxContainer'
export { default as NavigationShared } from './shared/navigation'
export {
  ScrollFadeIn,
  ScrollScaleIn,
  ScrollStagger,
  ScrollStaggerChild,
  ScrollProgress,
  ScrollReveal,
  useScrollTransform,
  useElementScrollProgress
} from './shared/ScrollAnimations'

// Re-export types
export type * from '../lib/types'

// Re-export constants
export * from '../lib/constants'

// Re-export animations
export * from '../lib/animations'