// Design system constants for Sharpii.ai premium UI

export const COLORS = {
  // Base colors
  background: 'hsl(0 0% 0%)',
  surface: 'hsl(0 0% 6.7%)',
  surfaceElevated: 'hsl(0 0% 10.2%)',
  
  // Text colors
  textPrimary: 'hsl(0 0% 100%)',
  textSecondary: 'hsl(0 0% 66.7%)',
  textMuted: 'hsl(0 0% 44.3%)',
  textDisabled: 'hsl(0 0% 25.1%)',
  
  // Accent colors
  accentBlue: 'hsl(199 100% 50%)',
  accentPurple: 'hsl(258 90% 66%)',
  accentNeon: 'hsl(180 100% 50%)',
  accentPink: 'hsl(330 81% 60%)',
  
  // Status colors
  success: 'hsl(142 76% 36%)',
  warning: 'hsl(38 92% 50%)',
  error: 'hsl(0 84.2% 60.2%)',
} as const;

export const GRADIENTS = {
  primary: 'linear-gradient(135deg, hsl(199 100% 50%), hsl(258 90% 66%))',
  neon: 'linear-gradient(135deg, hsl(180 100% 50%), hsl(199 100% 50%))',
  purple: 'linear-gradient(135deg, hsl(258 90% 66%), hsl(330 81% 60%))',
  text: 'linear-gradient(135deg, hsl(0 0% 100%), hsl(0 0% 66.7%))',
} as const;

export const SHADOWS = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  neon: '0 0 20px hsl(180 100% 50% / 0.3)',
  neonStrong: '0 0 40px hsl(180 100% 50% / 0.5)',
  glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
} as const;

export const BORDER_RADIUS = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  '3xl': '2rem',
  full: '9999px',
} as const;

export const SPACING = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
  '4xl': '6rem',
} as const;

export const TYPOGRAPHY = {
  fontSizes: {
    hero: '4rem',
    display: '3rem',
    heading: '2.25rem',
    subheading: '1.875rem',
    bodyLg: '1.125rem',
    body: '1rem',
    bodySm: '0.875rem',
    caption: '0.75rem',
  },
  lineHeights: {
    hero: '1.1',
    display: '1.2',
    heading: '1.3',
    subheading: '1.4',
    body: '1.6',
    caption: '1.4',
  },
  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
} as const;

export const GLASSMORPHISM = {
  background: 'rgba(255, 255, 255, 0.05)',
  backgroundElevated: 'rgba(255, 255, 255, 0.08)',
  border: 'rgba(255, 255, 255, 0.1)',
  borderElevated: 'rgba(255, 255, 255, 0.15)',
  blur: '20px',
  blurHeavy: '40px',
} as const;

export const ANIMATION_PRESETS = {
  fadeIn: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  slideInLeft: {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  slideInRight: {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.6, ease: [0.68, -0.55, 0.265, 1.55] },
  },
} as const;

export const IMAGE_ASSETS = {
  hero: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/hero/herodesktop.jpeg',
  heroBackground: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/hero/imageskintexturebackground.jpg',
  beforeAfterPairs: [
    {
      before: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Asian+Girl+7+before.jpg',
      after: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Asian+Girl+7+after.png',
      title: 'Portrait Enhancement',
    },
    {
      before: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Asian+Man+1+Before.jpg',
      after: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Asian+Man+1+After.png',
      title: 'Professional Headshot',
    },
    {
      before: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Black+Man+1+Before.jpg',
      after: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Black+Man+1+After.png',
      title: 'Skin Texture Enhancement',
    },
    {
      before: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Face+1+Before.jpg',
      after: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Face+1+After.png',
      title: 'Facial Detail Enhancement',
    },
    {
      before: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+Before.jpg',
      after: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+After.png',
      title: 'Natural Beauty Enhancement',
    },
    {
      before: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+2+Before (1).jpg',
      after: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+2+After.png',
      title: 'Professional Portrait',
    },
    {
      before: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/White+Girl+6+before.jpg',
      after: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/White+Girl+6+after.jpg',
      title: 'Skin Smoothing',
    },
    {
      before: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/White+Man+1+Before.jpg',
      after: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/White+Man+1+After.png',
      title: 'Professional Enhancement',
    },
    {
      before: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/LilMiquela+before.png',
      after: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/LilMiquela+after.png',
      title: 'Digital Avatar Enhancement',
    },
    {
      before: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Anita+Before.jpg.webp',
      after: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Anita+After.png',
      title: 'Portrait Refinement',
    },
  ],
  aiModels: [
    { name: 'Adobe Firefly', image: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/ai-tools/Adobe Firefly.png' },
    { name: 'DALL-E', image: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/ai-tools/Dalle.png' },
    { name: 'Flux', image: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/ai-tools/Flux.png' },
    { name: 'Midjourney', image: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/ai-tools/Midjourney2.png' },
    { name: 'Stability AI', image: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/ai-tools/stability.png' },
    { name: 'Grok', image: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/ai-tools/grok.png' },
  ],
  featured: [
    'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/portfolio/Tove1.png',
    'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/portfolio/Tove2.png',
    'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/portfolio/Tove3.png',
    'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/portfolio/Tove4.png',
  ],
  backgrounds: [
    'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/demos/4kresolution.png',
    'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/hero/b-roll.jpeg',
    'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/demos/ladypink.png',
    'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/demos/lipme.png',
  ],
} as const;

export const WORKFLOW_STEPS = [
  {
    id: 1,
    title: 'Upload & Analysis',
    description: 'AI analyzes your image structure, lighting, and skin texture',
    icon: '📤',
    details: [
      'Advanced computer vision analysis',
      'Skin tone and texture detection',
      'Lighting condition assessment',
      'Quality optimization planning',
    ],
  },
  {
    id: 2,
    title: 'AI Processing',
    description: 'Multiple AI models work together to enhance your image',
    icon: '🧠',
    details: [
      'Neural network enhancement',
      'Skin smoothing algorithms',
      'Detail preservation',
      'Color correction',
    ],
  },
  {
    id: 3,
    title: 'Enhancement Application',
    description: 'Precise enhancements applied while preserving natural features',
    icon: '✨',
    details: [
      'Natural skin enhancement',
      'Blemish removal',
      'Texture improvement',
      'Feature preservation',
    ],
  },
  {
    id: 4,
    title: 'Quality Optimization',
    description: 'Final optimization for maximum quality and natural appearance',
    icon: '🎯',
    details: [
      'Quality assurance checks',
      'Natural appearance validation',
      'Resolution optimization',
      'Export preparation',
    ],
  },
] as const;

export const TESTIMONIALS = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'Professional Photographer',
    company: 'Chen Studios',
    avatar: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Asian+Girl+7+after.png',
    rating: 5,
    content: 'Sharpii.ai has revolutionized my portrait workflow. The skin enhancement is incredibly natural, and my clients love the results.',
    featured: true,
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    role: 'Creative Director',
    company: 'Digital Arts Agency',
    avatar: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Black+Man+1+After.png',
    rating: 5,
    content: 'The AI enhancement quality is unmatched. It saves hours of manual retouching while delivering professional results.',
    featured: true,
  },
  {
    id: '3',
    name: 'Emma Rodriguez',
    role: 'Fashion Photographer',
    company: 'Rodriguez Photography',
    avatar: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Girl+1+After.png',
    rating: 5,
    content: 'Perfect for fashion shoots. The skin texture enhancement is so natural that you can\'t tell it\'s been processed.',
    featured: false,
  },
  {
    id: '4',
    name: 'David Kim',
    role: 'Portrait Artist',
    company: 'Kim Creative',
    avatar: 'https://s3.tebi.io/sharpiiweb/sharpiiweb/home/before-after/Asian+Man+1+After.png',
    rating: 5,
    content: 'Incredible technology. My portrait clients are amazed by the quality improvements while maintaining authenticity.',
    featured: false,
  },
] as const;

// Credit-based pricing tiers based on image resolution (matching Enhancor.ai structure)
export const PRICING_TIERS = [
  {
    id: 'standard',
    name: 'Standard',
    resolution: '512×512',
    megapixels: '≤ 0.26 MP',
    credits: 100,
    description: 'Testing',
    features: [
      'AI Skin Texture Enhancement',
      'Selective area enhancement',
      'Advanced texture control',
      'Results in seconds',
      'Face Detection & Cropping',
      'Photo Resizer',
    ],
    recommended: false,
    ctaText: 'Get Started',
    badge: undefined,
  },
  {
    id: 'hd',
    name: 'HD',
    resolution: '1024×1024',
    megapixels: '≤ 1.05 MP',
    credits: 130,
    description: 'Budget-friendly',
    features: [
      'AI Skin Texture Enhancement',
      'Selective area enhancement',
      'Advanced texture control',
      'Results in seconds',
      'Face Detection & Cropping',
      'Photo Resizer',
      'Smart Optimization',
    ],
    recommended: true,
    ctaText: 'Most Popular',
    badge: 'Budget-friendly',
  },
  {
    id: 'fullhd',
    name: 'Full HD',
    resolution: '1920×1080',
    megapixels: '≤ 2.07 MP',
    credits: 180,
    description: 'Professional',
    features: [
      'AI Skin Texture Enhancement',
      'Selective area enhancement',
      'Advanced texture control',
      'Results in seconds',
      'Face Detection & Cropping',
      'Photo Resizer',
      'Smart Optimization',
      'Professional Quality',
    ],
    recommended: false,
    ctaText: 'Go Professional',
    badge: undefined,
  },
  {
    id: '4k',
    name: '4K',
    resolution: '2160×2160',
    megapixels: '≤ 4.66 MP',
    credits: 360,
    description: 'Ultra HD',
    features: [
      'AI Skin Texture Enhancement',
      'Selective area enhancement',
      'Advanced texture control',
      'Results in seconds',
      'Face Detection & Cropping',
      'Photo Resizer',
      'Smart Optimization',
      '4K Ultra HD Quality',
      'Stunning Detail & Sharpness',
    ],
    recommended: false,
    ctaText: 'Ultra Quality',
    badge: undefined,
  },
] as const;

// Cost optimization features from Enhancor.ai
export const COST_OPTIMIZATION_FEATURES = [
  {
    id: 'face-detection',
    name: 'Face Detection & Cropping',
    description: 'Automatically detect and crop to the face area',
    steps: [
      'Click "Crop" to detect faces',
      'Select the face to focus on',
      'Apply the optimized crop',
    ],
    savings: 'Up to 60%',
    features: undefined,
    tips: undefined,
  },
  {
    id: 'photo-resizer',
    name: 'Photo Resizer',
    description: 'Optimize image dimensions for better processing',
    features: [
      'Smart Optimization: Reduce processing costs while maintaining quality',
      'Larger images consume more credits - optimize dimensions to save',
      'Quick Resize: Reduce dimensions by percentage to save credits',
    ],
    tips: [
      'Start with smaller dimensions for testing',
      'Use recommended presets for optimal quality/cost ratio',
      'Larger isn\'t always better - match your use case',
    ],
    steps: undefined,
    savings: undefined,
  },
] as const;

export const FAQ_ITEMS = [
  {
    id: '1',
    question: 'How does Sharpii.ai enhance images?',
    answer: 'Sharpii.ai uses advanced AI models trained specifically for skin enhancement and portrait improvement. Our technology analyzes facial features, skin texture, and lighting to apply natural-looking enhancements while preserving the authentic appearance of the subject.',
  },
  {
    id: '2',
    question: 'What image formats are supported?',
    answer: 'We support all major image formats including JPEG, PNG, TIFF, and RAW files. Our system automatically optimizes the output format based on your input and quality requirements.',
  },
  {
    id: '3',
    question: 'How long does processing take?',
    answer: 'Processing times vary by plan: Starter (2-5 minutes), Professional (30 seconds - 2 minutes), Enterprise (instant - 30 seconds). Batch processing is available for Professional and Enterprise plans.',
  },
  {
    id: '4',
    question: 'Can I use Sharpii.ai for commercial projects?',
    answer: 'Yes! All our plans include commercial usage rights. Professional and Enterprise plans are specifically designed for commercial photography, agencies, and studios.',
  },
  {
    id: '5',
    question: 'Is there an API available?',
    answer: 'Yes, we offer API access starting with the Professional plan. Our RESTful API allows seamless integration into your existing workflow and applications.',
  },
  {
    id: '6',
    question: 'What about privacy and data security?',
    answer: 'We take privacy seriously. All images are processed securely, encrypted in transit and at rest. We don\'t store your images longer than necessary for processing, and we never use them for training or other purposes.',
  },
] as const;