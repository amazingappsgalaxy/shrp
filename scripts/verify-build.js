#!/usr/bin/env node

/**
 * Build verification script for Sharpii.ai
 * Checks for common issues and ensures all components are properly configured
 */

const fs = require('fs')
const path = require('path')

const REQUIRED_FILES = [
  'src/app/page.tsx',
  'src/app/layout.tsx',
  'src/app/globals.css',
  'src/components/ui/navigation.tsx',
  'src/components/ui/hero-section.tsx',
  'src/components/ui/sparkles-text.tsx',
  'src/components/ui/award-badge.tsx',
  'src/components/ui/star-border.tsx',
  'src/components/ui/image-comparison.tsx',
  'src/components/ui/image-zoom.tsx',
  'src/components/ui/pricing-section.tsx',
  'src/components/ui/testimonials-section.tsx',
  'src/components/ui/cta-section.tsx',
  'src/components/sections/WorkflowSection.tsx',
  'src/components/sections/GallerySection.tsx',
  'src/components/sections/ComparisonSection.tsx',
  'src/components/sections/ShowcaseSection.tsx',
  'src/components/sections/FAQSection.tsx',
  'src/lib/constants.ts',
  'src/lib/animations.ts',
  'src/lib/types.ts',
  'tailwind.config.js',
  'next.config.js',
  'package.json',
]

const REQUIRED_DEPENDENCIES = [
  'next',
  'react',
  'react-dom',
  'framer-motion',
  'lucide-react',
  'tailwindcss',
  'typescript',
]

const REQUIRED_IMAGES = [
  'testpics/herodesktop.jpeg',
  'testpics/imageskintexturebackground.jpg',
  'testpics/Asian+Girl+7+before.jpg',
  'testpics/Asian+Girl+7+after.png',
]

function checkFileExists(filePath) {
  const fullPath = path.join(process.cwd(), filePath)
  return fs.existsSync(fullPath)
}

function checkDependency(packageName) {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    return packageJson.dependencies[packageName] || packageJson.devDependencies[packageName]
  } catch (error) {
    return false
  }
}

function verifyBuild() {
  console.log('🔍 Verifying Sharpii.ai build configuration...\\n')
  
  let hasErrors = false
  
  // Check required files
  console.log('📁 Checking required files:')
  REQUIRED_FILES.forEach(file => {
    if (checkFileExists(file)) {
      console.log(`  ✅ ${file}`)
    } else {
      console.log(`  ❌ ${file} - MISSING`)
      hasErrors = true
    }
  })
  
  console.log('\\n📦 Checking dependencies:')
  REQUIRED_DEPENDENCIES.forEach(dep => {
    const version = checkDependency(dep)
    if (version) {
      console.log(`  ✅ ${dep}@${version}`)
    } else {
      console.log(`  ❌ ${dep} - MISSING`)
      hasErrors = true
    }
  })
  
  console.log('\\n🖼️  Checking image assets:')
  REQUIRED_IMAGES.forEach(image => {
    if (checkFileExists(image)) {
      console.log(`  ✅ ${image}`)
    } else {
      console.log(`  ⚠️  ${image} - MISSING (optional)`)
    }
  })
  
  // Check TypeScript configuration
  console.log('\\n⚙️  Checking configuration:')
  if (checkFileExists('tsconfig.json')) {
    console.log('  ✅ TypeScript configuration')
  } else {
    console.log('  ❌ tsconfig.json - MISSING')
    hasErrors = true
  }
  
  if (checkFileExists('.env.local.example')) {
    console.log('  ✅ Environment template')
  } else {
    console.log('  ⚠️  .env.local.example - MISSING (recommended)')
  }
  
  // Check build output
  console.log('\\n🏗️  Build verification:')
  try {
    const { execSync } = require('child_process')
    execSync('npm run build', { stdio: 'pipe' })
    console.log('  ✅ Build successful')
  } catch (error) {
    console.log('  ❌ Build failed')
    console.log(`     Error: ${error.message}`)
    hasErrors = true
  }
  
  // Final result
  console.log('\\n' + '='.repeat(50))
  if (hasErrors) {
    console.log('❌ Build verification FAILED')
    console.log('Please fix the issues above before deploying.')
    process.exit(1)
  } else {
    console.log('✅ Build verification PASSED')
    console.log('🚀 Ready for deployment!')
    console.log('\\n🎉 Sharpii.ai is ready to transform images with AI!')
  }
}

// Performance check
function checkPerformance() {
  console.log('\\n⚡ Performance recommendations:')
  
  // Check bundle size
  if (checkFileExists('.next/static')) {
    console.log('  ✅ Static assets generated')
  }
  
  // Check image optimization
  const nextConfig = fs.readFileSync('next.config.js', 'utf8')
  if (nextConfig.includes('images:')) {
    console.log('  ✅ Image optimization configured')
  } else {
    console.log('  ⚠️  Consider enabling image optimization')
  }
  
  // Check compression
  if (nextConfig.includes('compress: true')) {
    console.log('  ✅ Compression enabled')
  } else {
    console.log('  ⚠️  Consider enabling compression')
  }
}

// Accessibility check
function checkAccessibility() {
  console.log('\\n♿ Accessibility checklist:')
  
  const globalCSS = fs.readFileSync('src/app/globals.css', 'utf8')
  
  if (globalCSS.includes('prefers-reduced-motion')) {
    console.log('  ✅ Reduced motion support')
  } else {
    console.log('  ⚠️  Consider adding reduced motion support')
  }
  
  if (globalCSS.includes('focus-visible')) {
    console.log('  ✅ Focus indicators')
  } else {
    console.log('  ⚠️  Consider improving focus indicators')
  }
  
  console.log('  ℹ️  Manual testing required:')
  console.log('     - Keyboard navigation')
  console.log('     - Screen reader compatibility')
  console.log('     - Color contrast ratios')
}

if (require.main === module) {
  verifyBuild()
  checkPerformance()
  checkAccessibility()
}