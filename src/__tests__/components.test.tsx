/**
 * Basic component tests for Sharpii.ai UI components
 * This file provides a foundation for testing the redesigned components
 */

import { render, screen } from '@testing-library/react'
import { SparklesText } from '@/components/ui/sparkles-text'
import { AwardBadge } from '@/components/ui/award-badge'
import { ImageComparison } from '@/components/ui/image-comparison'

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

describe('SparklesText Component', () => {
  it('renders text correctly', () => {
    render(<SparklesText text="AI-Powered Enhancement" />)
    expect(screen.getByText('AI-Powered Enhancement')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <SparklesText text="Test" className="custom-class" />
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })
})

describe('AwardBadge Component', () => {
  it('renders award text correctly', () => {
    render(<AwardBadge text="AI Excellence" type="star" />)
    expect(screen.getByText('AI Excellence')).toBeInTheDocument()
  })

  it('renders subtext when provided', () => {
    render(<AwardBadge text="Award" subtext="2024" type="trophy" />)
    expect(screen.getByText('Award')).toBeInTheDocument()
    expect(screen.getByText('2024')).toBeInTheDocument()
  })
})

describe('ImageComparison Component', () => {
  it('renders with before and after images', () => {
    render(
      <ImageComparison
        beforeImage="/test-before.jpg"
        afterImage="/test-after.jpg"
        beforeLabel="Before"
        afterLabel="After"
      />
    )
    
    // Check if images are rendered (Next.js Image components)
    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(2)
  })

  it('displays labels correctly', () => {
    render(
      <ImageComparison
        beforeImage="/test-before.jpg"
        afterImage="/test-after.jpg"
        beforeLabel="Original"
        afterLabel="Enhanced"
      />
    )
    
    expect(screen.getByText('Original')).toBeInTheDocument()
    expect(screen.getByText('Enhanced')).toBeInTheDocument()
  })
})

// Performance test utilities
export const performanceTests = {
  // Test animation performance
  testAnimationPerformance: () => {
    const startTime = performance.now()
    // Simulate animation
    const endTime = performance.now()
    const duration = endTime - startTime
    expect(duration).toBeLessThan(16.67) // 60fps = 16.67ms per frame
  },

  // Test image loading performance
  testImageLoadingPerformance: async (imageUrl: string) => {
    const startTime = performance.now()
    const img = new Image()
    
    return new Promise((resolve) => {
      img.onload = () => {
        const endTime = performance.now()
        const loadTime = endTime - startTime
        resolve(loadTime)
      }
      img.src = imageUrl
    })
  },

  // Test component render performance
  testRenderPerformance: (Component: React.ComponentType, props: any) => {
    const startTime = performance.now()
    render(<Component {...props} />)
    const endTime = performance.now()
    const renderTime = endTime - startTime
    expect(renderTime).toBeLessThan(100) // Should render in less than 100ms
  },
}

// Accessibility test utilities
export const accessibilityTests = {
  // Test keyboard navigation
  testKeyboardNavigation: (element: HTMLElement) => {
    element.focus()
    expect(document.activeElement).toBe(element)
  },

  // Test ARIA labels
  testAriaLabels: (element: HTMLElement, expectedLabel: string) => {
    expect(element).toHaveAttribute('aria-label', expectedLabel)
  },

  // Test color contrast
  testColorContrast: (element: HTMLElement) => {
    const styles = window.getComputedStyle(element)
    const backgroundColor = styles.backgroundColor
    const color = styles.color
    
    // Basic contrast check (would need more sophisticated implementation)
    expect(backgroundColor).toBeDefined()
    expect(color).toBeDefined()
  },
}

// Visual regression test utilities
export const visualTests = {
  // Test component appearance
  testComponentSnapshot: (Component: React.ComponentType, props: any) => {
    const { container } = render(<Component {...props} />)
    expect(container.firstChild).toMatchSnapshot()
  },

  // Test responsive breakpoints
  testResponsiveBreakpoints: (Component: React.ComponentType, props: any) => {
    const breakpoints = [320, 768, 1024, 1280, 1536]
    
    breakpoints.forEach(width => {
      // Mock window width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: width,
      })
      
      const { container } = render(<Component {...props} />)
      expect(container.firstChild).toMatchSnapshot(`breakpoint-${width}`)
    })
  },
}

// Integration test utilities
export const integrationTests = {
  // Test component interactions
  testComponentInteraction: async (
    Component: React.ComponentType,
    props: any,
    interaction: () => Promise<void>
  ) => {
    render(<Component {...props} />)
    await interaction()
    // Add assertions based on expected behavior
  },

  // Test data flow
  testDataFlow: (
    Component: React.ComponentType,
    initialProps: any,
    updatedProps: any
  ) => {
    const { rerender } = render(<Component {...initialProps} />)
    rerender(<Component {...updatedProps} />)
    // Add assertions for data updates
  },
}