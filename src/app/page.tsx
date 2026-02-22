import { NavigationHero4 } from "@/components/ui/navigation-hero4"
import { HeroSection } from "@/components/ui/hero-section"
import { GridMotion } from "@/components/ui/grid-motion"
import { InteractiveBentoGallerySecond } from "@/components/ui/interactive-bento-gallery"
import { WorkflowSection } from "@/components/sections/WorkflowSection"
import { ComparisonSection } from "@/components/sections/ComparisonSection"
import { TestimonialsSection } from "@/components/sections/TestimonialsSection"
import { MyPricingPlans2 } from "@/components/ui/mypricingplans2"
import { FAQSection } from "@/components/sections/FAQSection"
import { Footer } from "@/components/ui/footer"
import { SkinRealismSection } from "@/components/sections/SkinRealismSection"
import { IncrediblePowerSection } from "@/components/sections/IncrediblePowerSection"
import { UnifiedEnhancementSection } from "@/components/sections/UnifiedEnhancementSection"
import { AIInfluencerSection } from "@/components/sections/AIInfluencerSection"
import { CostOptimizationSection } from "@/components/sections/CostOptimizationSection"
import { MagicalPortraitSection } from "@/components/sections/MagicalPortraitSection"
import AIImageGenSection from "@/components/sections/AIImageGenSection"
import AIMotionTransferSection from "@/components/sections/AIMotionTransferSection"
import AILipSyncSection from "@/components/sections/AILipSyncSection"
import { VelocityScrollSection } from "@/components/sections/VelocityScrollSection"
import { ShowcaseSection } from "@/components/sections/ShowcaseSection"

export default function Home() {
  return (
    <main className="min-h-screen">
      <NavigationHero4 />
      <HeroSection />
      <InteractiveBentoGallerySecond />
      <ComparisonSection />
      <ShowcaseSection />
      <MagicalPortraitSection />

      {/* New AI Creative Suite Sections */}
      <AIImageGenSection />
      <AIMotionTransferSection />
      <AILipSyncSection />

      <GridMotion />
      <UnifiedEnhancementSection />
      <SkinRealismSection />
      <VelocityScrollSection />
      <IncrediblePowerSection />
      <AIInfluencerSection />
      <CostOptimizationSection />
      <WorkflowSection />
      <TestimonialsSection />
      <section id="pricing-section" className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <MyPricingPlans2 />
        </div>
      </section>
      <section id="faq">
        <FAQSection />
      </section>
      <Footer />
    </main>
  )
}
