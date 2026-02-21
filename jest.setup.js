import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

const React = require('react')

function createMockMotionComponent(tag = 'div') {
  return React.forwardRef(({ children, ...props }, ref) => {
    const {
      initial,
      animate,
      exit,
      whileHover,
      whileTap,
      transition,
      variants,
      layout,
      layoutId,
      ...rest
    } = props
    return React.createElement(tag, { ...rest, ref }, children)
  })
}

function createMockMotionProxy(tag = 'div') {
  const Comp = createMockMotionComponent(tag)
  return new Proxy(
    {},
    {
      get: () => Comp,
    }
  )
}

function createMotionValue(initial) {
  let v = initial
  return {
    get: () => v,
    set: (next) => {
      v = next
    },
    on: () => () => {},
    destroy: () => {},
  }
}

jest.mock('framer-motion', () => ({
  motion: createMockMotionProxy('div'),
  AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
}))

jest.mock('motion/react', () => ({
  motion: createMockMotionProxy('div'),
  useMotionValue: (initial) => createMotionValue(initial),
  useSpring: (value) => value,
  useTransform: () => createMotionValue(0),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3003'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'

// Global test setup
global.fetch = jest.fn()
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Setup cleanup after each test
afterEach(() => {
  jest.clearAllMocks()
})
