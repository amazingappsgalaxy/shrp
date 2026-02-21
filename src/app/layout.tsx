import type { Metadata } from "next";
import { Syne, Manrope, Ubuntu } from "next/font/google";
import { Toaster } from "sonner";
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
  title: "Sharpii.ai - AI-Powered Image Enhancement & Skin Upscaler",
  description: "Transform your images with professional-grade AI enhancement. Sharpii.ai delivers cinematic quality skin upscaling and image enhancement in seconds.",
  keywords: ["AI image enhancement", "skin upscaler", "photo editing", "AI photography", "image quality", "portrait enhancement"],
  authors: [{ name: "Sharpii.ai Team" }],
  creator: "Sharpii.ai",
  publisher: "Sharpii.ai",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://sharpii.ai",
    title: "Sharpii.ai - AI-Powered Image Enhancement",
    description: "Professional-grade AI image enhancement and skin upscaling technology. Transform your photos with cinematic quality in seconds.",
    siteName: "Sharpii.ai",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sharpii.ai - AI-Powered Image Enhancement",
    description: "Transform your images with professional-grade AI enhancement technology.",
    creator: "@sharpii_ai",
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
          toastOptions={{
            style: {
              background: '#111111',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#ffffff',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
            },
            classNames: {
              success: 'border-[#FFFF00]/30',
              error: 'border-red-500/30',
              warning: 'border-amber-500/30',
              info: 'border-blue-500/30',
            },
          }}
        />
      </body>
    </html>
  );
}
