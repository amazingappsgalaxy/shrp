// Global type declarations for third-party browser globals

interface Window {
  // Google Analytics gtag
  gtag: (
    command: "event" | "config" | "set" | "get" | "consent",
    targetId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params?: Record<string, any>
  ) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataLayer: any[]
}
