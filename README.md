# 🚀 Sharpii.ai - AI-Powered Image Enhancement Platform

> **Ultra-premium, iOS-inspired, dark mode interface for professional AI image enhancement and skin upscaling.**

![Sharpii.ai Hero](./public/hero-preview.png)

## ✨ Features

### 🎨 **Premium Design System**
- **Ultra-premium dark mode** with glassmorphism effects
- **Neon accent colors** (blue, purple, cyan) with glow effects
- **iOS-inspired animations** with 60fps performance
- **Comprehensive design tokens** and constants

### 🖼️ **Image Enhancement Showcase**
- **Interactive before/after comparisons** with smooth drag sliders
- **Advanced zoom functionality** with pan, rotate, and keyboard controls
- **Bento gallery layout** for enhanced image showcases
- **Touch-optimized mobile interactions**

### 🧩 **21st.dev Components Integration**
- ✅ **Hero Section 1** - Main landing hero
- ✅ **Grid Motion** - Animated workflow grid
- ✅ **Interactive Bento Gallery** - Image showcase
- ✅ **Image Comparison** - Before/after sliders
- ✅ **Sparkles Text** - Animated text highlights
- ✅ **Star Border** - Premium card styling
- ✅ **Pricing** - Modern pricing cards
- ✅ **Testimonials Columns** - Customer reviews
- ✅ **FAQ Chat Accordion** - Interactive FAQ
- ✅ **Scroll X Carousel** - Case studies
- ✅ **Infinite Slider Horizontal** - Partner logos
- ✅ **Award Badge** - Achievement highlights
- ✅ **Hero 2.1** - Secondary CTA section

### ⚡ **Performance & Optimization**
- **60fps animations** with GPU acceleration
- **Lazy loading** and progressive image enhancement
- **Code splitting** and dynamic imports
- **Intersection Observer** for scroll animations
- **Core Web Vitals** optimization

### ♿ **Accessibility & Standards**
- **WCAG AA compliance** with high contrast ratios
- **Keyboard navigation** for all interactive elements
- **Screen reader support** with proper ARIA labels
- **Reduced motion** preferences support

## 🛠️ Tech Stack

- **Framework**: Next.js 15+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom dark theme
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Components**: Custom + 21st.dev integration
- **Image Optimization**: Next.js Image with WebP/AVIF support

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/sharpii-ai.git
   cd sharpii-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles & dark theme
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/
│   ├── ui/                # Core UI components
│   │   ├── navigation.tsx
│   │   ├── hero-section.tsx
│   │   ├── sparkles-text.tsx
│   │   ├── award-badge.tsx
│   │   ├── star-border.tsx
│   │   ├── image-comparison.tsx
│   │   ├── image-zoom.tsx
│   │   ├── pricing-section.tsx
│   │   └── ...
│   ├── sections/          # Page sections
│   │   ├── WorkflowSection.tsx
│   │   ├── GallerySection.tsx
│   │   ├── ComparisonSection.tsx
│   │   ├── ShowcaseSection.tsx
│   │   └── FAQSection.tsx
│   └── shared/            # Shared utilities
│       ├── LazyImage.tsx
│       ├── ScrollAnimations.tsx
│       └── ParallaxContainer.tsx
├── lib/
│   ├── constants.ts       # Design system constants
│   ├── animations.ts      # Animation configurations
│   ├── types.ts          # TypeScript definitions
│   └── utils.ts          # Utility functions
└── __tests__/            # Test files
    └── components.test.tsx
```

## 🎨 Design System

### Color Palette

```css
/* Base Colors */
--background: #000000
--surface: #111111
--surface-elevated: #1a1a1a

/* Text Colors */
--text-primary: #ffffff
--text-secondary: #a1a1aa
--text-muted: #71717a

/* Accent Colors */
--accent-blue: #3b82f6
--accent-purple: #8b5cf6
--accent-neon: #00d4ff
```

### Typography Scale

```css
.text-hero: 4rem / 1.1 / 700
.text-display: 3rem / 1.2 / 600
.text-heading: 2.25rem / 1.3 / 600
.text-body: 1rem / 1.6 / 400
```

### Animation Principles

- **Easing**: iOS-inspired cubic-bezier curves
- **Duration**: 200-800ms for most transitions
- **Performance**: 60fps with GPU acceleration
- **Accessibility**: Respects `prefers-reduced-motion`

## 🧪 Testing

### Run Tests

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Test Categories

- **Component Tests**: Individual component functionality
- **Integration Tests**: Component interaction testing
- **Visual Tests**: Screenshot comparisons
- **Performance Tests**: Animation and loading performance
- **Accessibility Tests**: WCAG compliance verification

## 📦 Build & Deploy

### Production Build

```bash
npm run build
npm run start
```

### Static Export

```bash
npm run build
npm run export
```

### Deploy to Vercel

```bash
npm i -g vercel
vercel
```

## 🔧 Configuration

### Environment Variables

See `.env.local.example` for all available configuration options.

### Tailwind Configuration

Custom theme configuration in `tailwind.config.js`:

- Dark mode colors
- Custom animations
- Glassmorphism utilities
- Premium component styles

### Next.js Configuration

Optimized configuration in `next.config.js`:

- Image optimization
- Performance headers
- Bundle splitting
- Security headers

## 🎯 Performance Metrics

### Core Web Vitals Targets

- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1
- **FCP**: < 1.8s
- **TTI**: < 3.8s

### Optimization Features

- ✅ Image lazy loading
- ✅ Code splitting
- ✅ Tree shaking
- ✅ Bundle optimization
- ✅ Caching strategies
- ✅ Progressive loading

## ♿ Accessibility

### WCAG Compliance

- **Level AA** color contrast ratios
- **Keyboard navigation** for all interactive elements
- **Screen reader** support with ARIA labels
- **Focus management** with visible indicators
- **Motion preferences** respect for reduced motion

### Testing Tools

- axe-core for automated testing
- Manual keyboard navigation testing
- Screen reader testing (NVDA, JAWS, VoiceOver)
- Color contrast verification

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Use semantic commit messages
- Write tests for new components
- Ensure accessibility compliance
- Maintain 60fps animation performance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **21st.dev** for premium component inspiration
- **Framer Motion** for smooth animations
- **Tailwind CSS** for utility-first styling
- **Next.js** for the amazing framework
- **Lucide** for beautiful icons

## 📞 Support

- **Email**: support@sharpii.ai
- **Documentation**: [docs.sharpii.ai](https://docs.sharpii.ai)
- **Discord**: [Join our community](https://discord.gg/sharpii)
- **Twitter**: [@sharpii_ai](https://twitter.com/sharpii_ai)

---

<div align="center">
  <p><strong>Built with ❤️ by the Sharpii.ai Team</strong></p>
  <p>Transform your images with AI • Professional quality • Instant results</p>
</div>