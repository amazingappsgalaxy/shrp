import type { Metadata } from "next"
import Link from "next/link"
import { NavigationHero4 } from "@/components/ui/navigation-hero4"
import { Footer } from "@/components/ui/footer"
import { MyPricingPlans2 } from "@/components/ui/mypricingplans2"

export const metadata: Metadata = {
  title: "AI Skin Enhancer & Portrait Retouching — No Plastic Results",
  description:
    "AI skin retouching that preserves real texture, pores, and natural tone. 5 enhancement modes, LoRA presets, and selective area protection. Professional portrait results without the plastic AI look. From $9/month.",
  keywords: [
    "ai skin enhancer",
    "ai portrait enhancer",
    "skin retouching ai",
    "ai skin retouching",
    "portrait retouching online",
    "ai blemish removal",
    "skin texture ai",
    "ai photo retouching",
    "professional portrait editor online",
    "ai skin editor",
    "no plastic skin ai",
    "remini alternative",
  ],
  alternates: {
    canonical: "https://sharpii.ai/skin-enhancer",
  },
  openGraph: {
    title: "AI Skin Enhancer — Real Texture, No Plastic | Sharpii.ai",
    description:
      "Professional AI portrait retouching with 5 enhancement modes and selective area control. Preserves real skin texture — no plastic, no blur.",
    url: "https://sharpii.ai/skin-enhancer",
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Sharpii.ai AI Skin Enhancer",
  applicationCategory: "PhotoApplication",
  operatingSystem: "Web Browser",
  url: "https://sharpii.ai/skin-enhancer",
  description:
    "Professional AI skin enhancer for portrait retouching. Restores real skin texture without plastic smoothing. 5 enhancement modes, LoRA presets, and selective area protection.",
  offers: {
    "@type": "Offer",
    price: "9.00",
    priceCurrency: "USD",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: "9.00",
      priceCurrency: "USD",
      unitText: "MONTH",
    },
  },
  featureList: [
    "5 skin enhancement modes: Subtle, Clear, Blemish Removal, Freckle Enhancer, Custom",
    "4 AI LoRA presets: Poly, Skin, Freckle, Real",
    "Selective area protection (face zones, eye zones, hair, background)",
    "Skin Texture Size control (2–10)",
    "Detail Level control (0.8–1.2)",
    "Transformation Strength control (0.1–0.38)",
    "Works on any skin type and tone",
  ],
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does the Sharpii.ai AI skin enhancer work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sharpii's skin editor uses a dermatologically-tuned AI model (powered by RunningHub) to restore and refine skin texture. Instead of blurring or smoothing, it synthesizes realistic micro-texture, pores, and natural tone. You choose from 5 enhancement modes, 4 LoRA style presets, and can fine-tune texture density, detail level, and transformation strength with sliders.",
      },
    },
    {
      "@type": "Question",
      name: "What skin enhancement modes are available?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "There are 5 modes: Subtle (preserves natural texture with minimal change), Clear (balanced smoothing for a refined look), Blemish Removal (targets acne and skin imperfections), Freckle Enhancer (enhances natural freckles for a sun-kissed look), and Custom (enter your own text prompt for precise control).",
      },
    },
    {
      "@type": "Question",
      name: "Can I protect specific areas from being retouched?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The selective area protection system lets you toggle protection for individual face zones (skin, mouth, lips, nose), eye zones (right and left eye, right and left brow), and other areas (hair, clothing, background, neck). This ensures AI enhancements only apply where you want them.",
      },
    },
    {
      "@type": "Question",
      name: "Does the skin enhancer work on all skin tones?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The AI model is trained to work across all skin tones and types. The 4 LoRA presets (Poly, Skin, Freckle, Real) each apply different aesthetic qualities optimized for different looks and skin characteristics.",
      },
    },
    {
      "@type": "Question",
      name: "Is Sharpii.ai a good alternative to Remini for professional work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. While Remini is designed for mobile consumers and quick social media enhancement, Sharpii is built for professional photographers and studios. Sharpii gives you granular control over texture density, detail level, and selective area protection — far beyond what Remini offers. It also runs in a browser with full commercial licensing.",
      },
    },
  ],
}

export default function SkinEnhancerPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <NavigationHero4 />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,0,0.05)_0%,transparent_60%)]" />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 border border-[#FFFF00]/30 bg-[#FFFF00]/5 rounded-full px-4 py-1.5 text-xs font-medium text-[#FFFF00] mb-8 font-[family-name:var(--font-manrope)]">
            5 Enhancement Modes · Selective Area Control · No Plastic Results
          </div>
          <h1 className="font-[family-name:var(--font-syne)] text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-[1.05]">
            AI Skin Enhancer
            <br />
            <span className="text-[#FFFF00]">Real Texture. No Plastic.</span>
          </h1>
          <p className="text-white/60 text-lg sm:text-xl max-w-2xl mx-auto mb-10 font-[family-name:var(--font-manrope)] leading-relaxed">
            Most AI retouching destroys what makes a face authentic — pores, texture, natural tone.
            Sharpii&apos;s skin editor restores it. Dermatologically-tuned AI with 5 modes,
            4 LoRA presets, and selective area protection.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center bg-[#FFFF00] text-black font-bold text-sm px-8 py-4 rounded-xl hover:bg-[#FFFF00]/90 transition-colors font-[family-name:var(--font-manrope)]"
            >
              Try Skin Enhancer Free
            </Link>
            <Link
              href="/app/skineditor"
              className="inline-flex items-center justify-center border border-white/20 text-white text-sm px-8 py-4 rounded-xl hover:border-white/40 transition-colors font-[family-name:var(--font-manrope)]"
            >
              Open Skin Editor
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-white/5 bg-white/[0.02] py-8 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "5", label: "Enhancement modes" },
            { value: "4", label: "AI LoRA presets" },
            { value: "10+", label: "Area protection zones" },
            { value: "3", label: "Precision control sliders" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-[#FFFF00] font-[family-name:var(--font-syne)] text-3xl font-black">{s.value}</div>
              <div className="text-white/40 text-xs mt-1 font-[family-name:var(--font-manrope)]">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Enhancement modes */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-[#FFFF00]/60 text-xs uppercase tracking-widest font-[family-name:var(--font-manrope)] mb-3">
              5 Enhancement Modes
            </div>
            <h2 className="font-[family-name:var(--font-syne)] text-4xl sm:text-5xl font-black text-white">
              The Right Mode for Every Portrait
            </h2>
            <p className="text-white/50 text-base mt-4 max-w-xl mx-auto font-[family-name:var(--font-manrope)]">
              Each mode applies a different AI enhancement profile — from subtle refinement to targeted blemish removal.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                mode: "Subtle",
                desc: "Preserves natural texture with the lightest touch. Ideal for professional headshots where authenticity is key.",
                tag: "Natural Look",
              },
              {
                mode: "Clear",
                desc: "Balanced smoothing for a refined, polished result. Even skin tone without losing facial character.",
                tag: "Balanced",
              },
              {
                mode: "Blemish Removal",
                desc: "AI targets acne, redness, and skin imperfections while preserving the surrounding texture. No blurring.",
                tag: "Acne & Spots",
              },
              {
                mode: "Freckle Enhancer",
                desc: "Enhances and clarifies natural freckles for a sun-kissed, editorial look. Rare in any AI tool.",
                tag: "Editorial",
              },
              {
                mode: "Custom",
                desc: "Enter your own text prompt to guide the AI with precise instructions for any specific enhancement requirement.",
                tag: "Full Control",
              },
            ].map((m) => (
              <div
                key={m.mode}
                className="border border-white/10 rounded-xl p-6 bg-white/[0.02] hover:border-white/20 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-[family-name:var(--font-syne)] text-base font-bold text-white">{m.mode}</span>
                  <span className="text-xs bg-white/5 text-white/40 rounded-full px-2.5 py-0.5 font-[family-name:var(--font-manrope)]">
                    {m.tag}
                  </span>
                </div>
                <p className="text-white/50 text-sm leading-relaxed font-[family-name:var(--font-manrope)]">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Precision controls */}
      <section className="py-16 px-6 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-[#FFFF00]/60 text-xs uppercase tracking-widest font-[family-name:var(--font-manrope)] mb-3">
                Precision Controls
              </div>
              <h2 className="font-[family-name:var(--font-syne)] text-3xl sm:text-4xl font-black text-white mb-5">
                Granular Control Over Every Detail
              </h2>
              <p className="text-white/50 text-sm leading-relaxed font-[family-name:var(--font-manrope)] mb-8">
                Three precision sliders give you full control over how the AI applies enhancement.
                Dial in exactly the result you need — from barely-there refinement to deep texture restoration.
              </p>
              <div className="space-y-6">
                {[
                  {
                    label: "Skin Texture Size",
                    range: "2 – 10",
                    desc: "Controls the density of synthesized skin texture. Lower values = finer, dispersed texture. Higher = denser, more prominent pores.",
                    from: "Dispersed",
                    to: "Dense",
                  },
                  {
                    label: "Detail Level",
                    range: "0.8 – 1.2",
                    desc: "Adjusts how aggressively the AI restores micro-detail and edge contrast. Increase for maximum sharpness.",
                    from: "Low",
                    to: "High",
                  },
                  {
                    label: "Transformation Strength",
                    range: "0.1 – 0.38",
                    desc: "Controls how much the AI transforms the original image. Lower = subtle refinement. Higher = stronger enhancement.",
                    from: "Subtle",
                    to: "Strong",
                  },
                ].map((ctrl) => (
                  <div key={ctrl.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-[family-name:var(--font-syne)] text-sm font-bold text-white">{ctrl.label}</span>
                      <span className="text-xs text-white/30 font-[family-name:var(--font-manrope)]">{ctrl.range}</span>
                    </div>
                    <p className="text-white/40 text-xs leading-relaxed font-[family-name:var(--font-manrope)] mb-2">{ctrl.desc}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-white/30 font-[family-name:var(--font-manrope)]">{ctrl.from}</span>
                      <div className="flex-1 h-1 bg-white/10 rounded-full relative">
                        <div className="absolute left-0 top-0 h-full w-[45%] bg-gradient-to-r from-white/20 to-[#FFFF00]/60 rounded-full" />
                      </div>
                      <span className="text-xs text-white/30 font-[family-name:var(--font-manrope)]">{ctrl.to}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[#FFFF00]/60 text-xs uppercase tracking-widest font-[family-name:var(--font-manrope)] mb-3">
                Selective Area Protection
              </div>
              <h2 className="font-[family-name:var(--font-syne)] text-3xl font-black text-white mb-5">
                Protect What Matters
              </h2>
              <p className="text-white/50 text-sm leading-relaxed font-[family-name:var(--font-manrope)] mb-6">
                Toggle protection for specific face zones so enhancement only applies where you want it.
                No other AI skin tool gives you this level of control.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { zone: "Face Zones", items: ["Skin", "Mouth", "Lips", "Nose"] },
                  { zone: "Eye Zones", items: ["Right Eye", "Left Eye", "Right Brow", "Left Brow"] },
                  { zone: "Other Areas", items: ["Hair", "Clothing", "Background", "Neck"] },
                ].map((group) => (
                  <div key={group.zone} className="border border-white/10 rounded-xl p-4">
                    <div className="text-xs text-white/40 font-[family-name:var(--font-manrope)] mb-3">{group.zone}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {group.items.map((item) => (
                        <span
                          key={item}
                          className="text-xs bg-white/5 text-white/60 rounded-full px-2.5 py-0.5 font-[family-name:var(--font-manrope)]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LoRA presets */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-[#FFFF00]/60 text-xs uppercase tracking-widest font-[family-name:var(--font-manrope)] mb-3">
              4 AI Style Presets
            </div>
            <h2 className="font-[family-name:var(--font-syne)] text-3xl sm:text-4xl font-black text-white">
              LoRA Presets for Every Aesthetic
            </h2>
            <p className="text-white/50 text-sm mt-3 max-w-lg mx-auto font-[family-name:var(--font-manrope)]">
              Each preset applies a different AI model aesthetic on top of your enhancement mode —
              from hyper-realistic to editorial.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                name: "Poly",
                full: "Polyhedron",
                desc: "Sharp geometric texture rendering. Clean and structured skin detail.",
              },
              {
                name: "Skin",
                full: "FLUX-Optimized",
                desc: "Fine-tuned on the FLUX model for the most natural, photorealistic skin output.",
              },
              {
                name: "Freckle",
                full: "Freckles FLUX",
                desc: "Enhances and defines natural freckles while keeping the overall skin natural.",
              },
              {
                name: "Real",
                full: "Realism LoRA BSY IL V1",
                desc: "Maximum photorealism — the closest to an unedited studio photograph.",
              },
            ].map((lora) => (
              <div
                key={lora.name}
                className="border border-white/10 rounded-xl p-6 bg-white/[0.02] hover:border-[#FFFF00]/30 transition-colors"
              >
                <div className="font-[family-name:var(--font-syne)] text-2xl font-black text-[#FFFF00] mb-1">
                  {lora.name}
                </div>
                <div className="text-white/30 text-xs font-[family-name:var(--font-manrope)] mb-4">{lora.full}</div>
                <p className="text-white/50 text-sm leading-relaxed font-[family-name:var(--font-manrope)]">{lora.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-[family-name:var(--font-syne)] text-3xl sm:text-4xl font-black text-white">
              How It Works
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Upload Your Portrait",
                body: "Drop a JPEG, PNG, or WEBP photo. Your image uploads securely to cloud storage in the background.",
              },
              {
                step: "02",
                title: "Configure Your Enhancement",
                body: "Select an enhancement mode, pick a LoRA preset, toggle area protection, and adjust the three precision sliders to your preference.",
              },
              {
                step: "03",
                title: "Download Studio-Quality Results",
                body: "The AI processes your image and returns a professionally retouched portrait. Download it or access it in your history. Commercial license included.",
              },
            ].map((s) => (
              <div key={s.step}>
                <div className="text-[#FFFF00]/20 font-[family-name:var(--font-syne)] text-6xl font-black mb-4 leading-none">
                  {s.step}
                </div>
                <h3 className="font-[family-name:var(--font-syne)] text-lg font-bold text-white mb-3">{s.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed font-[family-name:var(--font-manrope)]">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto text-center mb-12">
          <div className="text-[#FFFF00]/60 text-xs uppercase tracking-widest font-[family-name:var(--font-manrope)] mb-3">
            Pricing
          </div>
          <h2 className="font-[family-name:var(--font-syne)] text-4xl font-black text-white">
            Professional Skin Retouching From $9/Month
          </h2>
          <p className="text-white/50 text-sm mt-4 max-w-lg mx-auto font-[family-name:var(--font-manrope)]">
            Credits work across all tools — skin editor, upscaler, image generation, and editing.
            Cancel anytime.
          </p>
        </div>
        <MyPricingPlans2 showHeader={false} />
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-[family-name:var(--font-syne)] text-3xl font-black text-white">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-6">
            {[
              {
                q: "How does the Sharpii.ai AI skin enhancer work?",
                a: "Sharpii's skin editor uses a dermatologically-tuned AI model to restore and refine skin texture. Instead of blurring, it synthesizes realistic micro-texture and natural tone. You choose from 5 modes, 4 LoRA style presets, and can fine-tune with three precision sliders.",
              },
              {
                q: "What enhancement modes are available?",
                a: "5 modes: Subtle (natural texture preservation), Clear (balanced smoothing), Blemish Removal (targets acne and imperfections), Freckle Enhancer (enhances natural freckles), and Custom (enter your own text prompt for precise control).",
              },
              {
                q: "Can I protect specific face areas from enhancement?",
                a: "Yes. Toggle protection for individual face zones (skin, mouth, lips, nose), eye zones (right/left eye, right/left brow), and other areas (hair, clothing, background, neck). Enhancement only applies where you want it.",
              },
              {
                q: "Does it work on all skin tones and types?",
                a: "Yes. The model is trained to work across all skin tones. The 4 LoRA presets each offer different aesthetic qualities. The Skin preset (FLUX-optimized) and Real preset (Realism LoRA) are specifically tuned for photorealistic results on any complexion.",
              },
              {
                q: "Is this better than Remini for professional photography?",
                a: "Yes. Remini is a mobile consumer app with minimal controls. Sharpii gives professional photographers granular control over texture density, detail level, transformation strength, and selective area protection — all in a browser-based workflow with commercial licensing.",
              },
            ].map((item) => (
              <div key={item.q} className="border-b border-white/5 pb-6">
                <h3 className="font-[family-name:var(--font-syne)] text-base font-bold text-white mb-2">{item.q}</h3>
                <p className="text-white/50 text-sm leading-relaxed font-[family-name:var(--font-manrope)]">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-[family-name:var(--font-syne)] text-4xl sm:text-5xl font-black text-white mb-4">
            Real skin. Real results.
          </h2>
          <p className="text-white/50 text-base mb-8 font-[family-name:var(--font-manrope)]">
            Join photographers and studios who use Sharpii to deliver portrait retouching that looks authentic — not filtered.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center bg-[#FFFF00] text-black font-bold text-sm px-10 py-4 rounded-xl hover:bg-[#FFFF00]/90 transition-colors font-[family-name:var(--font-manrope)]"
          >
            Get Started Free →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
