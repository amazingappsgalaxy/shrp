import type { Metadata } from "next"
import { MyPricingPlans2 } from "@/components/ui/mypricingplans2"
import { PricingPageTracker } from "./_tracker"

export const metadata: Metadata = {
  title: "Pricing — AI Image Upscaler & Photo Enhancer Plans",
  description:
    "Transparent AI photo enhancement pricing from $9/month. All plans include 4K/8K upscaling, skin retouching, image generation, and AI editing. No feature gates. Cancel anytime.",
  keywords: [
    "ai photo enhancer pricing",
    "ai image upscaler price",
    "sharpii pricing",
    "ai photo editing subscription",
    "image enhancement plans",
  ],
  alternates: {
    canonical: "https://sharpii.ai/plans",
  },
}

export default function PlansPage() {
  return (
    <div className="min-h-screen">
      <PricingPageTracker />
      <div className="pt-20">
        <MyPricingPlans2
          title="Start Your Journey."
          subtitle="Transparent pricing for everyone. All tools included on every plan. Cancel anytime."
        />
      </div>
    </div>
  )
}
