import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About — Sharpii.ai",
  description: "Sharpii.ai is built by DopeStar Studios LLP, a team from India building accessible, powerful AI image and video enhancement tools for creators worldwide.",
  openGraph: {
    title: "About Sharpii.ai",
    description: "Meet the team behind Sharpii.ai — AI-powered image enhancement, video generation, and skin editing for everyone.",
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
