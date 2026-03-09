import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pricing Plans — Sharpii.ai",
  description: "Choose a Sharpii.ai plan. Basic, Creator, Professional, and Enterprise plans with AI credits for image upscaling, skin editing, image generation, and video tools.",
  openGraph: {
    title: "Pricing Plans — Sharpii.ai",
    description: "Flexible AI credit plans starting from $9/month. Upscale to 8K, generate images, edit videos, and more.",
  },
}

export default function PlansLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
