import type { Metadata } from "next"
import Link from "next/link"
import { NavigationHero4 } from "@/components/ui/navigation-hero4"
import { Footer } from "@/components/ui/footer"
import { MyPricingPlans2 } from "@/components/ui/mypricingplans2"

export const metadata: Metadata = {
  title: "AI Image Upscaler — Upscale Photos to 4K & 8K Online",
  description:
    "Upscale any photo to 4K or 8K resolution online in seconds. AI synthesizes real skin texture, hair detail, and micro-contrast — zero artifacts, zero plastic results. No downloads. From $9/month.",
  keywords: [
    "ai image upscaler",
    "upscale photo online",
    "4k image upscaler",
    "8k image upscaler",
    "upscale image without losing quality",
    "ai photo upscaler",
    "increase image resolution online",
    "topaz gigapixel alternative",
    "magnific ai alternative",
    "upscale image to 4k",
    "upscale midjourney images",
    "best ai upscaler 2025",
  ],
  alternates: {
    canonical: "https://sharpii.ai/ai-image-upscaler",
  },
  openGraph: {
    title: "AI Image Upscaler — 4K & 8K Online | Sharpii.ai",
    description:
      "Upscale photos to 4K or 8K in seconds. AI synthesizes real skin texture and micro-detail — no plastic results, no downloads.",
    url: "https://sharpii.ai/ai-image-upscaler",
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Sharpii.ai AI Image Upscaler",
  applicationCategory: "PhotoApplication",
  operatingSystem: "Web Browser",
  url: "https://sharpii.ai/ai-image-upscaler",
  description:
    "Professional AI image upscaler that enhances photos to 4K and 8K resolution with real skin texture synthesis. No downloads required.",
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
    "4K upscaling (4096×4096px)",
    "8K upscaling (7680×4320px)",
    "AI skin texture synthesis",
    "Pro Upscaler with blemish removal presets",
    "Smart Upscaler for any image type",
    "JPEG, PNG, WEBP support",
    "Commercial license included",
  ],
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does the Sharpii.ai AI image upscaler work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sharpii.ai uses two AI upscaling models. The Smart Upscaler processes any photo and synthesizes new detail at 4K (4096×4096px) or 8K (7680×4320px) resolution. The Pro Upscaler adds portrait-specific enhancements including skin texture restoration, blemish removal, and freckle enhancement — all through AI synthesis rather than pixel interpolation.",
      },
    },
    {
      "@type": "Question",
      name: "Is Sharpii.ai a good Topaz Gigapixel AI alternative?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Unlike Topaz Gigapixel AI, Sharpii.ai runs entirely in your browser — no downloads, no powerful GPU required. You get professional 4K/8K upscaling plus skin enhancement, AI image generation, and AI editing tools in one subscription starting at $9/month versus Topaz at $149/year for upscaling alone.",
      },
    },
    {
      "@type": "Question",
      name: "What is the difference between the Pro Upscaler and Smart Upscaler?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Smart Upscaler is designed for any image type — landscapes, products, architecture — and outputs at 4K or 8K. The Pro Upscaler is optimized for portraits and people. It includes skin enhancement presets (Subtle, Clear, Blemish Removal, Freckle Enhancer, Custom), a portrait toggle, and Max Mode for the most aggressive detail synthesis.",
      },
    },
    {
      "@type": "Question",
      name: "Can I upscale Midjourney or AI-generated images?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Upload any Midjourney, DALL-E, Stable Diffusion, or Flux image to Sharpii's upscaler. The AI synthesizes photorealistic detail that makes AI-generated art look natural at 4K or 8K resolution — ideal for printing large format.",
      },
    },
    {
      "@type": "Question",
      name: "How long does AI upscaling take?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Upscaling typically completes in approximately 90 seconds. Results are delivered directly to your browser and saved to your history. You can queue multiple images and process them in sequence.",
      },
    },
  ],
}

export default function AIImageUpscalerPage() {
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,0,0.06)_0%,transparent_60%)]" />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 border border-[#FFFF00]/30 bg-[#FFFF00]/5 rounded-full px-4 py-1.5 text-xs font-medium text-[#FFFF00] mb-8 font-[family-name:var(--font-manrope)]">
            4K & 8K · No Downloads · From $9/mo
          </div>
          <h1 className="font-[family-name:var(--font-syne)] text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-[1.05]">
            AI Image Upscaler
            <br />
            <span className="text-[#FFFF00]">4K & 8K Online</span>
          </h1>
          <p className="text-white/60 text-lg sm:text-xl max-w-2xl mx-auto mb-10 font-[family-name:var(--font-manrope)] leading-relaxed">
            Most upscalers stretch pixels. Sharpii synthesizes new detail from scratch —
            real skin texture, individual hair strands, and micro-contrast. Zero artifacts.
            Zero plastic results. Output at 4K or 8K in ~90 seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center bg-[#FFFF00] text-black font-bold text-sm px-8 py-4 rounded-xl hover:bg-[#FFFF00]/90 transition-colors font-[family-name:var(--font-manrope)]"
            >
              Try the Upscaler Free
            </Link>
            <Link
              href="/app/upscaler"
              className="inline-flex items-center justify-center border border-white/20 text-white text-sm px-8 py-4 rounded-xl hover:border-white/40 transition-colors font-[family-name:var(--font-manrope)]"
            >
              Open Upscaler
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-white/5 bg-white/[0.02] py-8 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "8K", label: "Max output resolution" },
            { value: "~90s", label: "Average processing time" },
            { value: "2", label: "AI upscaling models" },
            { value: "$9/mo", label: "Starting price" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-[#FFFF00] font-[family-name:var(--font-syne)] text-3xl font-black">{s.value}</div>
              <div className="text-white/40 text-xs mt-1 font-[family-name:var(--font-manrope)]">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Two models section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-[#FFFF00]/60 text-xs uppercase tracking-widest font-[family-name:var(--font-manrope)] mb-3">
              Two AI Models
            </div>
            <h2 className="font-[family-name:var(--font-syne)] text-4xl sm:text-5xl font-black text-white">
              Not Scaled. Rebuilt.
            </h2>
            <p className="text-white/50 text-base mt-4 max-w-xl mx-auto font-[family-name:var(--font-manrope)]">
              Choose the right model for your image. Both synthesize detail from AI — not interpolation.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Smart Upscaler */}
            <div className="border border-white/10 rounded-2xl p-8 bg-white/[0.02] hover:border-white/20 transition-colors">
              <div className="inline-flex items-center gap-2 bg-white/5 rounded-full px-3 py-1 text-xs text-white/60 font-[family-name:var(--font-manrope)] mb-6">
                Any Image Type
              </div>
              <h3 className="font-[family-name:var(--font-syne)] text-2xl font-black text-white mb-3">
                Smart Upscaler
              </h3>
              <p className="text-white/50 text-sm leading-relaxed font-[family-name:var(--font-manrope)] mb-6">
                AI-powered upscaling for any photo — landscapes, architecture, products, or portraits.
                Select 4K or 8K output and let the model synthesize fine detail from scratch.
              </p>
              <ul className="space-y-2.5">
                {[
                  "4K output — 4096 × 4096 px (80 credits)",
                  "8K output — 7680 × 4320 px (120 credits)",
                  "Works on any image type",
                  "JPEG, PNG, WEBP accepted",
                  "Results saved to your history",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-white/70 font-[family-name:var(--font-manrope)]">
                    <span className="text-[#FFFF00] mt-0.5 shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro Upscaler */}
            <div className="border border-[#FFFF00]/30 rounded-2xl p-8 bg-[#FFFF00]/[0.03] hover:border-[#FFFF00]/50 transition-colors relative">
              <div className="inline-flex items-center gap-2 bg-[#FFFF00]/10 rounded-full px-3 py-1 text-xs text-[#FFFF00] font-[family-name:var(--font-manrope)] mb-6">
                Portrait Optimized
              </div>
              <h3 className="font-[family-name:var(--font-syne)] text-2xl font-black text-white mb-3">
                Pro Upscaler
              </h3>
              <p className="text-white/50 text-sm leading-relaxed font-[family-name:var(--font-manrope)] mb-6">
                Dermatologically-tuned AI specifically for faces and portraits. Restores skin texture,
                removes blemishes, and synthesizes pore-level micro-detail that looks real — not filtered.
              </p>
              <ul className="space-y-2.5">
                {[
                  "Portrait mode with face-aware synthesis",
                  "5 skin presets: Subtle, Clear, Blemish Removal, Freckle Enhancer, Custom",
                  "Max Mode for maximum detail synthesis",
                  "4K & 8K output resolution",
                  "Custom prompt for precise control",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-white/70 font-[family-name:var(--font-manrope)]">
                    <span className="text-[#FFFF00] mt-0.5 shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Resolution comparison */}
      <section className="py-16 px-6 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-[family-name:var(--font-syne)] text-3xl sm:text-4xl font-black text-white">
              Every Pore. Every Strand.
            </h2>
            <p className="text-white/50 text-sm mt-3 font-[family-name:var(--font-manrope)]">
              Compare output resolutions — AI synthesizes new detail at each tier.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "1080p", mp: "2.1 MP", px: "1920 × 1080", note: "Input quality", dim: false },
              { label: "4K", mp: "8.3 MP", px: "4096 × 4096", note: "4× detail · 80 credits", dim: false },
              { label: "8K", mp: "33.2 MP", px: "7680 × 4320", note: "16× detail · 120 credits", highlight: true },
            ].map((r) => (
              <div
                key={r.label}
                className={`rounded-2xl p-6 border text-center ${
                  r.highlight
                    ? "border-[#FFFF00]/40 bg-[#FFFF00]/[0.04]"
                    : "border-white/10 bg-white/[0.02]"
                }`}
              >
                <div
                  className={`font-[family-name:var(--font-syne)] text-4xl font-black mb-2 ${
                    r.highlight ? "text-[#FFFF00]" : "text-white"
                  }`}
                >
                  {r.label}
                </div>
                <div className="text-white/70 text-lg font-semibold font-[family-name:var(--font-manrope)]">{r.mp}</div>
                <div className="text-white/40 text-xs mt-1 font-[family-name:var(--font-manrope)]">{r.px}</div>
                <div
                  className={`text-xs mt-3 font-[family-name:var(--font-manrope)] ${
                    r.highlight ? "text-[#FFFF00]/70" : "text-white/30"
                  }`}
                >
                  {r.note}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-[#FFFF00]/60 text-xs uppercase tracking-widest font-[family-name:var(--font-manrope)] mb-3">
              How It Works
            </div>
            <h2 className="font-[family-name:var(--font-syne)] text-4xl font-black text-white">
              Three Steps. Professional Results.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Upload Your Photo",
                body: "Drop a JPEG, PNG, or WEBP file. Your image uploads to secure cloud storage in the background — no size limits, no quality loss.",
              },
              {
                step: "02",
                title: "Choose Your Model & Resolution",
                body: "Select Smart Upscaler for any image type, or Pro Upscaler for portraits with skin enhancement presets. Choose 4K or 8K output.",
              },
              {
                step: "03",
                title: "Download in 4K or 8K",
                body: "Your upscaled image is ready in ~90 seconds. Download it directly or find it in your history. Commercial license included on all plans.",
              },
            ].map((s) => (
              <div key={s.step} className="relative">
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

      {/* Comparison table vs competitors */}
      <section className="py-16 px-6 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-[family-name:var(--font-syne)] text-3xl font-black text-white">
              Why Choose Sharpii Over Topaz or Magnific?
            </h2>
            <p className="text-white/50 text-sm mt-3 font-[family-name:var(--font-manrope)]">
              The best Topaz Gigapixel AI alternative — online, affordable, all-in-one.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-[family-name:var(--font-manrope)]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-white/40 font-medium py-3 pr-6">Feature</th>
                  <th className="text-center text-[#FFFF00] font-bold py-3 px-4">Sharpii.ai</th>
                  <th className="text-center text-white/40 font-medium py-3 px-4">Topaz Gigapixel</th>
                  <th className="text-center text-white/40 font-medium py-3 px-4">Magnific AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  ["Runs in browser (no install)", "✓", "✗", "✓"],
                  ["4K & 8K output", "✓", "✓", "✓"],
                  ["AI skin enhancement", "✓", "✗", "✗"],
                  ["AI image generation", "✓", "✗", "✗"],
                  ["AI image editing", "✓", "✗", "✗"],
                  ["Starting price", "$9/mo", "$149/yr", "$39/mo"],
                  ["Free to try", "✓", "Trial only", "✗"],
                  ["Portrait presets", "5 presets", "✗", "✗"],
                  ["Commercial license", "All plans", "All plans", "Pro+"],
                ].map(([feat, sharpii, topaz, magnific]) => (
                  <tr key={feat as string}>
                    <td className="py-3 pr-6 text-white/60">{feat}</td>
                    <td className="py-3 px-4 text-center text-[#FFFF00] font-medium">{sharpii}</td>
                    <td className="py-3 px-4 text-center text-white/40">{topaz}</td>
                    <td className="py-3 px-4 text-center text-white/40">{magnific}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            Start Upscaling From $9/Month
          </h2>
          <p className="text-white/50 text-sm mt-4 max-w-lg mx-auto font-[family-name:var(--font-manrope)]">
            Credits work across all tools — upscaler, skin editor, image generation, and editing.
            No feature gates. Cancel anytime.
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
                q: "How does the Sharpii.ai AI image upscaler work?",
                a: "Sharpii.ai uses two AI upscaling models powered by advanced diffusion networks. The Smart Upscaler synthesizes new detail at 4K (4096×4096px) or 8K (7680×4320px) for any image type. The Pro Upscaler adds portrait-specific AI — restoring skin texture, pores, and micro-contrast with 5 enhancement presets.",
              },
              {
                q: "Is Sharpii.ai a good Topaz Gigapixel AI alternative?",
                a: "Yes. Sharpii runs entirely in your browser — no downloads or powerful GPU needed. You get 4K/8K upscaling plus skin enhancement, image generation, and editing tools in one subscription. Topaz Gigapixel costs $149/year for upscaling alone and requires a desktop install.",
              },
              {
                q: "What is the difference between Pro Upscaler and Smart Upscaler?",
                a: "Smart Upscaler works on any image type at 4K or 8K. Pro Upscaler is optimized for portraits — it includes skin texture restoration, blemish removal, freckle enhancement, and Max Mode for the most aggressive detail synthesis.",
              },
              {
                q: "Can I upscale Midjourney or AI-generated images?",
                a: "Yes. Upload any AI-generated image to Sharpii's upscaler. The AI synthesizes photorealistic detail at 4K or 8K — ideal for printing large format artwork or adding realism to AI-generated portraits.",
              },
              {
                q: "How long does upscaling take?",
                a: "Typically ~90 seconds. Your image uploads in the background, gets processed by the AI, and the result appears in your history. You can queue multiple images and check back when they're done.",
              },
              {
                q: "What image formats does the upscaler accept?",
                a: "JPEG, PNG, and WEBP. Output is delivered in high-quality format matching your input. All plans include commercial usage rights.",
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
            Ready to upscale?
          </h2>
          <p className="text-white/50 text-base mb-8 font-[family-name:var(--font-manrope)]">
            Join photographers, studios, and creators who use Sharpii to deliver 4K and 8K quality.
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
