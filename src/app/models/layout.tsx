import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AI Models — Sharpii.ai",
  description: "Explore the AI models powering Sharpii.ai — including Google Veo, OpenAI Sora, ByteDance SeedDream, Kling, and proprietary skin enhancement models.",
  openGraph: {
    title: "AI Models — Sharpii.ai",
    description: "50+ cutting-edge AI models for image enhancement, generation, video creation, and skin editing.",
  },
}

export default function ModelsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
