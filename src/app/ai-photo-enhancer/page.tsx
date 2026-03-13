import type { Metadata } from "next"
import Link from "next/link"
import { NavigationHero4 } from "@/components/ui/navigation-hero4"
import { Footer } from "@/components/ui/footer"
import { MyPricingPlans2 } from "@/components/ui/mypricingplans2"

export const metadata: Metadata = {
  title: "AI Photo Enhancer — Upscale, Edit, Generate & Retouch Online",
  description:
    "One AI platform for everything: upscale photos to 4K/8K, retouch skin, generate images with 20+ AI models, and edit with AI masks. No downloads. Professional results in seconds. From $9/month.",
  keywords: [
    "ai photo enhancer",
    "photo enhancer online",
    "enhance photo quality",
    "ai photo editor online",
    "enhance image quality online",
    "ai image enhancer",
    "sharpen photo online",
    "improve photo quality ai",
    "best ai photo enhancer",
    "online photo enhancer",
    "enhance low resolution photo",
    "ai photo enhancement",
  ],
  alternates: {
    canonical: "https://sharpii.ai/ai-photo-enhancer",
  },
  openGraph: {
    title: "AI Photo Enhancer — All-in-One Platform | Sharpii.ai",
    description:
      "Upscale to 4K/8K, fix skin, generate & edit — all in one AI platform. No downloads. From $9/month.",
    url: "https://sharpii.ai/ai-photo-enhancer",
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Sharpii.ai AI Photo Enhancer",
  applicationCategory: "PhotoApplication",
  operatingSystem: "Web Browser",
  url: "https://sharpii.ai/ai-photo-enhancer",
  description:
    "All-in-one AI photo enhancement platform. Upscale to 4K/8K, retouch skin, generate images with 20+ AI models, and edit with AI masks. No downloads required.",
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
    "AI image upscaling to 4K and 8K",
    "AI skin enhancer and portrait retouching",
    "AI image generation with 20+ models",
    "AI image editing with masking and inpainting",
    "Commercial license on all plans",
    "Browser-based, no downloads required",
  ],
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is the best AI photo enhancer online?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sharpii.ai is built specifically for professional photo enhancement. It combines AI upscaling (4K/8K), skin retouching, image generation (20+ models), and AI editing in one browser-based platform. Starting at $9/month, it delivers professional studio quality without any software downloads.",
      },
    },
    {
      "@type": "Question",
      name: "Can Sharpii enhance low-resolution photos to HD?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The Smart Upscaler and Pro Upscaler both synthesize new detail from low-resolution inputs, outputting at 4K (4096×4096px) or 8K (7680×4320px). Unlike simple upscalers that stretch pixels, Sharpii's AI models synthesize real texture, micro-contrast, and edge detail.",
      },
    },
    {
      "@type": "Question",
      name: "What image generation models does Sharpii include?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sharpii's image generation includes 20+ AI models through the Synvow/GPT-Best platform. These include Seedream 5.0, Nano Banana, Gemini-powered models, and others — supporting both text-to-image generation and image-to-image reference-based generation.",
      },
    },
    {
      "@type": "Question",
      name: "What does the AI image editing tool do?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The AI Image Edit tool at /app/edit uses AI-powered masking and inpainting. You can remove objects, change backgrounds, swap elements, or modify specific parts of an image using text prompts and AI masks. It uses the Synvow GPT-Best API for synchronous edits.",
      },
    },
    {
      "@type": "Question",
      name: "Do credits work across all tools?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. All Sharpii credits are universal — they work for upscaling, skin editing, image generation, and image editing. There are no per-tool feature gates. Every plan includes access to all four tools.",
      },
    },
  ],
}

const tools = [
  {
    number: "01",
    name: "Smart Upscaler",
    tag: "4K / 8K",
    desc: "Upscale any photo — landscapes, products, portraits — to 4K (4096×4096px) or 8K (7680×4320px). AI synthesizes new detail rather than stretching pixels.",
    credits: "80–120 credits",
    link: "/app/upscaler",
  },
  {
    number: "02",
    name: "Pro Upscaler",
    tag: "Portrait AI",
    desc: "Portrait-optimized upscaling with 5 skin enhancement presets (Subtle, Clear, Blemish Removal, Freckle Enhancer, Custom), portrait mode, and Max Mode.",
    credits: "Dynamic pricing",
    link: "/app/upscaler",
  },
  {
    number: "03",
    name: "Skin Editor",
    tag: "Retouching",
    desc: "Professional AI skin retouching with 5 modes, 4 LoRA presets, 3 precision sliders, and selective area protection for face, eyes, hair, and background.",
    credits: "Per processing",
    link: "/app/skineditor",
  },
  {
    number: "04",
    name: "Image Generation",
    tag: "20+ Models",
    desc: "Generate images from text with 20+ AI models including Seedream 5.0, Nano Banana, and Gemini-powered models. Supports text-to-image and image-to-image generation.",
    credits: "Per generation",
    link: "/app/image",
  },
  {
    number: "05",
    name: "Image Editing",
    tag: "AI Mask",
    desc: "AI-powered masking and inpainting. Remove objects, change backgrounds, swap elements — guided by text prompts with AI understanding of your image.",
    credits: "Per edit",
    link: "/app/edit",
  },
]

export default function AIPhotoEnhancerPage() {
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
            5 Tools · 20+ AI Models · One Subscription · From $9/mo
          </div>
          <h1 className="font-[family-name:var(--font-syne)] text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-[1.05]">
            AI Photo Enhancer
            <br />
            <span className="text-[#FFFF00]">One Platform. Every Tool.</span>
          </h1>
          <p className="text-white/60 text-lg sm:text-xl max-w-2xl mx-auto mb-10 font-[family-name:var(--font-manrope)] leading-relaxed">
            Stop paying for four different tools. Sharpii combines AI upscaling, skin retouching,
            image generation, and AI editing in one subscription. Professional results in your browser — no downloads.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center bg-[#FFFF00] text-black font-bold text-sm px-8 py-4 rounded-xl hover:bg-[#FFFF00]/90 transition-colors font-[family-name:var(--font-manrope)]"
            >
              Start Enhancing Free
            </Link>
            <Link
              href="/app/dashboard"
              className="inline-flex items-center justify-center border border-white/20 text-white text-sm px-8 py-4 rounded-xl hover:border-white/40 transition-colors font-[family-name:var(--font-manrope)]"
            >
              Open App
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/5 bg-white/[0.02] py-8 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "5", label: "AI enhancement tools" },
            { value: "20+", label: "Image generation models" },
            { value: "8K", label: "Max output resolution" },
            { value: "$9/mo", label: "Starting price" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-[#FFFF00] font-[family-name:var(--font-syne)] text-3xl font-black">{s.value}</div>
              <div className="text-white/40 text-xs mt-1 font-[family-name:var(--font-manrope)]">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* All tools */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-[#FFFF00]/60 text-xs uppercase tracking-widest font-[family-name:var(--font-manrope)] mb-3">
              All Tools
            </div>
            <h2 className="font-[family-name:var(--font-syne)] text-4xl sm:text-5xl font-black text-white">
              Everything in One Subscription
            </h2>
            <p className="text-white/50 text-base mt-4 max-w-xl mx-auto font-[family-name:var(--font-manrope)]">
              Credits work across every tool. No feature gates. Upgrade or downgrade anytime.
            </p>
          </div>
          <div className="space-y-4">
            {tools.map((tool) => (
              <div
                key={tool.number}
                className="border border-white/10 rounded-2xl p-6 bg-white/[0.02] hover:border-white/20 transition-colors group"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="shrink-0">
                    <span className="text-[#FFFF00]/30 font-[family-name:var(--font-syne)] text-3xl font-black leading-none">
                      {tool.number}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="font-[family-name:var(--font-syne)] text-xl font-black text-white">{tool.name}</h3>
                      <span className="text-xs bg-[#FFFF00]/10 text-[#FFFF00] rounded-full px-2.5 py-0.5 font-[family-name:var(--font-manrope)]">
                        {tool.tag}
                      </span>
                    </div>
                    <p className="text-white/50 text-sm leading-relaxed font-[family-name:var(--font-manrope)]">{tool.desc}</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <span className="text-xs text-white/30 font-[family-name:var(--font-manrope)]">{tool.credits}</span>
                    <Link
                      href={tool.link}
                      className="text-xs text-[#FFFF00]/70 hover:text-[#FFFF00] font-[family-name:var(--font-manrope)] transition-colors"
                    >
                      Try it →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why all-in-one */}
      <section className="py-16 px-6 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-[family-name:var(--font-syne)] text-3xl sm:text-4xl font-black text-white">
              Why Pay for 4 Tools When You Need One?
            </h2>
            <p className="text-white/50 text-sm mt-3 font-[family-name:var(--font-manrope)]">
              The average professional uses 3–4 separate AI tools for enhancement, generation, editing, and retouching.
              Sharpii eliminates all of them.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                problem: "Topaz Gigapixel for upscaling",
                solution: "Smart Upscaler + Pro Upscaler",
                saving: "$149/yr → included",
              },
              {
                problem: "Remini or separate skin tool",
                solution: "Skin Editor with 5 modes",
                saving: "$360/yr → included",
              },
              {
                problem: "Midjourney for generation",
                solution: "20+ generation models",
                saving: "$120/yr → included",
              },
              {
                problem: "Photoshop for AI editing",
                solution: "AI Edit with masking",
                saving: "$240/yr → included",
              },
              {
                problem: "Desktop apps that require GPU",
                solution: "100% browser-based",
                saving: "No hardware needed",
              },
              {
                problem: "Managing multiple subscriptions",
                solution: "One credit balance, all tools",
                saving: "One bill. All features.",
              },
            ].map((item) => (
              <div key={item.problem} className="border border-white/10 rounded-xl p-5 bg-white/[0.02]">
                <div className="text-white/30 text-xs line-through font-[family-name:var(--font-manrope)] mb-1">
                  {item.problem}
                </div>
                <div className="text-white font-[family-name:var(--font-syne)] text-sm font-bold mb-1">{item.solution}</div>
                <div className="text-[#FFFF00]/70 text-xs font-[family-name:var(--font-manrope)]">{item.saving}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-[#FFFF00]/60 text-xs uppercase tracking-widest font-[family-name:var(--font-manrope)] mb-3">
              Use Cases
            </div>
            <h2 className="font-[family-name:var(--font-syne)] text-3xl sm:text-4xl font-black text-white">
              Built for Professionals & Creators
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                who: "Portrait Photographers",
                what: "Deliver 4K/8K portraits with realistic skin texture — clients think you upgraded your camera.",
                tools: ["Pro Upscaler", "Skin Editor"],
              },
              {
                who: "Content Creators",
                what: "Batch enhance thumbnails, generate AI visuals for videos, and create AI avatar variations.",
                tools: ["Image Generation", "Skin Editor"],
              },
              {
                who: "E-Commerce Sellers",
                what: "Upscale product photos to print quality, remove backgrounds, and generate lifestyle shots.",
                tools: ["Smart Upscaler", "Image Edit"],
              },
              {
                who: "Studios & Agencies",
                what: "Process client batches fast. All tools, commercial license, history, under one team subscription.",
                tools: ["All Tools", "API Access"],
              },
              {
                who: "AI Artists",
                what: "Upscale Midjourney and Stable Diffusion art to 8K print quality. Add photorealistic skin detail.",
                tools: ["Smart Upscaler", "Pro Upscaler"],
              },
              {
                who: "Social Media Managers",
                what: "Generate AI images for campaigns, enhance profile photos, edit with AI masks for branded content.",
                tools: ["Image Generation", "Image Edit"],
              },
            ].map((uc) => (
              <div key={uc.who} className="border border-white/10 rounded-xl p-6 bg-white/[0.02] hover:border-white/20 transition-colors">
                <h3 className="font-[family-name:var(--font-syne)] text-base font-bold text-white mb-2">{uc.who}</h3>
                <p className="text-white/50 text-sm leading-relaxed font-[family-name:var(--font-manrope)] mb-4">{uc.what}</p>
                <div className="flex flex-wrap gap-1.5">
                  {uc.tools.map((t) => (
                    <span
                      key={t}
                      className="text-xs bg-[#FFFF00]/10 text-[#FFFF00]/70 rounded-full px-2.5 py-0.5 font-[family-name:var(--font-manrope)]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto text-center mb-12">
          <div className="text-[#FFFF00]/60 text-xs uppercase tracking-widest font-[family-name:var(--font-manrope)] mb-3">
            Pricing
          </div>
          <h2 className="font-[family-name:var(--font-syne)] text-4xl font-black text-white">
            All Tools. One Price. From $9/Month.
          </h2>
          <p className="text-white/50 text-sm mt-4 max-w-lg mx-auto font-[family-name:var(--font-manrope)]">
            Every plan includes all 5 tools. Credits work across everything. No feature gates.
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
                q: "What is the best AI photo enhancer online?",
                a: "Sharpii.ai is built for professional photo enhancement — combining 4K/8K upscaling, skin retouching, image generation (20+ models), and AI editing in one browser-based platform. Starting at $9/month with commercial licensing on all plans.",
              },
              {
                q: "Can Sharpii enhance low-resolution photos?",
                a: "Yes. The Smart Upscaler and Pro Upscaler both synthesize new detail from low-resolution inputs, outputting at 4K (4096×4096px) or 8K (7680×4320px). The AI synthesizes real texture and micro-contrast — not pixel stretching.",
              },
              {
                q: "What image generation models are included?",
                a: "20+ AI models through the Synvow/GPT-Best platform, including Seedream 5.0, Nano Banana, Gemini-powered models, and more. Supports text-to-image and image-to-image (reference-based) generation.",
              },
              {
                q: "Do credits work across all tools?",
                a: "Yes. All Sharpii credits are universal — they work for upscaling, skin editing, image generation, and image editing. No per-tool feature gates. Every plan includes access to all tools.",
              },
              {
                q: "Is there a free trial?",
                a: "Sign up and explore the platform. New accounts get access to the full tool suite. Check our pricing page for the latest free trial availability.",
              },
              {
                q: "Is commercial use included?",
                a: "Yes. All plans include commercial usage rights. Professional and Enterprise plans are specifically designed for commercial photography studios, agencies, and content businesses.",
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

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-[family-name:var(--font-syne)] text-4xl sm:text-5xl font-black text-white mb-4">
            One platform. Every tool.
          </h2>
          <p className="text-white/50 text-base mb-8 font-[family-name:var(--font-manrope)]">
            Replace 4 subscriptions with one. Professional AI photo enhancement, generation, and editing — all in your browser.
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
