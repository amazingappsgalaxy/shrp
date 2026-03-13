import type { Metadata } from "next";
import { Syne, Manrope, Ubuntu } from "next/font/google";
import { Toaster } from "sonner";
import { GoogleAnalytics } from "@next/third-parties/google";
import { SWRProvider } from "@/lib/providers/swr-provider";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const ubuntu = Ubuntu({
  variable: "--font-ubuntu",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sharpii.ai"),
  title: {
    default: "Sharpii.ai — AI Image Upscaler, Skin Enhancer & Photo Editor Online",
    template: "%s | Sharpii.ai",
  },
  description: "Upscale photos to 4K/8K, fix skin texture with AI, generate images with 20+ models, and edit with AI masks — all in one platform. No downloads. From $9/month.",
  keywords: [
    "ai image upscaler",
    "upscale photo online",
    "ai skin enhancer",
    "ai photo enhancer",
    "4k image upscaler",
    "8k image upscaler",
    "ai portrait enhancer",
    "photo enhancer online",
    "ai image generator",
    "skin retouching ai",
    "upscale image without losing quality",
    "ai photo editor online",
  ],
  authors: [{ name: "Sharpii.ai Team" }],
  creator: "Sharpii.ai",
  publisher: "Sharpii.ai",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://sharpii.ai",
    title: "Sharpii.ai — AI Image Upscaler, Skin Enhancer & Photo Editor",
    description: "Upscale photos to 4K/8K, fix skin texture with AI, generate and edit images — all in one platform. No downloads. From $9/month.",
    siteName: "Sharpii.ai",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Sharpii.ai AI Image Upscaler and Enhancer" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sharpii.ai — AI Image Upscaler & Photo Enhancer",
    description: "Upscale to 4K/8K, fix skin texture, generate & edit images with AI. No downloads. From $9/month.",
    creator: "@sharpii_ai",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://sharpii.ai",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${syne.variable} ${manrope.variable} ${ubuntu.variable} antialiased bg-background text-foreground font-body`}
        suppressHydrationWarning
      >
        <SWRProvider>
        {children}
        </SWRProvider>
        <Toaster
          position="bottom-right"
          offset={16}
          style={{ zIndex: 999999 }}
          toastOptions={{
            style: {
              background: '#111111',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#ffffff',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: '500',
              padding: '8px 12px',
              maxWidth: '280px',
              zIndex: 999999,
            },
            classNames: {
              success: 'border-[#FFFF00]/30',
              error: 'border-white/20',
              warning: 'border-amber-500/30',
              info: 'border-blue-500/30',
            },
          }}
        />
      </body>
      <GoogleAnalytics gaId="G-0SSWVGTG5X" />
    </html>
  );
}
