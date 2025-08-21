import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sharpii.ai - AI-Powered Image Enhancement & Skin Upscaler",
  description: "Transform your images with professional-grade AI enhancement. Sharpii.ai delivers cinematic quality skin upscaling and image enhancement in seconds. Trusted by 50K+ photographers and studios.",
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
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
