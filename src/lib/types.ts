// Type definitions for Sharpii.ai components

export interface ImageAsset {
  before: string
  after: string
  title: string
}

export interface WorkflowStep {
  id: number
  title: string
  description: string
  icon: string
  details: string[]
}

export interface TestimonialData {
  id: string
  name: string
  role: string
  company: string
  avatar: string
  rating: number
  content: string
  featured: boolean
}

export interface PricingTier {
  id: string
  name: string
  resolution: string
  megapixels: string
  credits: number
  description: string
  features: string[]
  recommended: boolean
  ctaText: string
  badge?: string
}

export interface FAQItem {
  id: string
  question: string
  answer: string
}

export interface CarouselItem {
  id: string
  title: string
  description: string
  image: string
  category?: string
  stats?: {
    label: string
    value: string
  }[]
}

export interface SliderItem {
  id: string
  name: string
  image: string
  url?: string
}

export interface AnimationVariants {
  hidden: {
    opacity?: number
    x?: number
    y?: number
    scale?: number
  }
  visible: {
    opacity?: number
    x?: number
    y?: number
    scale?: number
    transition?: {
      duration?: number
      delay?: number
      ease?: string | number[]
      staggerChildren?: number
      delayChildren?: number
    }
  }
}

export interface GalleryItem {
  id: string
  before: string
  after: string
  title: string
  category: string
  featured?: boolean
}

export interface AwardPreset {
  type: 'award' | 'star' | 'trophy' | 'medal' | 'crown'
  text: string
  subtext?: string
  glowColor: string
}

export interface ScrollAnimationConfig {
  threshold?: number
  rootMargin?: string
}

export interface ParallaxConfig {
  speed: number
  direction: 'up' | 'down'
}

export interface ImageZoomConfig {
  scale: number
  duration: number
  ease: string
}

// Component prop types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface AnimatedComponentProps extends BaseComponentProps {
  animated?: boolean
  delay?: number
}

export interface ResponsiveComponentProps extends BaseComponentProps {
  mobile?: boolean
  tablet?: boolean
  desktop?: boolean
}

// Navigation types
export interface NavigationItem {
  name: string
  href: string
  children?: NavigationItem[]
}

// Form types
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'textarea' | 'select'
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
}

// API types
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ImageUploadResponse {
  id: string
  url: string
  enhanced_url?: string
  processing_time?: number
  quality_score?: number
}

export interface Job {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  originalImage: string
  enhancedImage?: string
  settings: EnhancementSettings
  createdAt: Date
  completedAt?: Date
  progress: number
  error?: string
}

export interface EnhancementSettings {
  preset: string
  intensity: number
  skinSmoothing: number
  detailEnhancement: number
  colorCorrection: number
  noiseReduction: number
  sharpening: number
}

export interface Preset {
  id: string
  name: string
  description: string
  settings: EnhancementSettings
  thumbnail: string
  category: 'portrait' | 'landscape' | 'product' | 'artistic'
  premium: boolean
}

// Theme types
export interface ThemeColors {
  background: string
  foreground: string
  primary: string
  secondary: string
  accent: string
  muted: string
  border: string
}

export interface ThemeConfig {
  colors: ThemeColors
  fonts: {
    sans: string[]
    mono: string[]
  }
  spacing: Record<string, string>
  borderRadius: Record<string, string>
  shadows: Record<string, string>
}

// Utility types
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type Variant = 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'premium'
export type Direction = 'up' | 'down' | 'left' | 'right'
export type Orientation = 'horizontal' | 'vertical'

// Event types
export interface CustomEvent<T = any> {
  type: string
  data: T
  timestamp: number
}

export interface ImageEvent extends CustomEvent {
  data: {
    src: string
    alt: string
    loaded: boolean
    error?: string
  }
}

export interface AnimationEvent extends CustomEvent {
  data: {
    element: HTMLElement
    animation: string
    progress: number
  }
}

// Performance types
export interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  animationFPS: number
  memoryUsage: number
}

export interface OptimizationConfig {
  lazyLoading: boolean
  imageOptimization: boolean
  codesplitting: boolean
  prefetching: boolean
}

// Accessibility types
export interface AccessibilityConfig {
  reducedMotion: boolean
  highContrast: boolean
  screenReader: boolean
  keyboardNavigation: boolean
}

export interface ARIAProps {
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
  'aria-expanded'?: boolean
  'aria-hidden'?: boolean
  'aria-live'?: 'polite' | 'assertive' | 'off'
  role?: string
}

// Export all types as a namespace
export namespace SharpiiTypes {
  export type Image = ImageAsset
  export type Workflow = WorkflowStep
  export type Testimonial = TestimonialData
  export type Pricing = PricingTier
  export type FAQ = FAQItem
  export type Carousel = CarouselItem
  export type Slider = SliderItem
  export type Gallery = GalleryItem
  export type Award = AwardPreset
  export type Navigation = NavigationItem
  export type Form = FormField
  export type API = APIResponse
  export type Theme = ThemeConfig
  export type Performance = PerformanceMetrics
  export type Accessibility = AccessibilityConfig
}