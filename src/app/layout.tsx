import type { Metadata } from "next";
import {
  Lora,
  Inter,
  Caveat,
  Playfair_Display,
  Great_Vibes,
  Dancing_Script,
  Patrick_Hand,
  Sacramento
} from "next/font/google";
import "./globals.css";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AuthProvider } from "@/contexts/auth-context";
import { ErrorBoundary } from "@/components/error-boundary";
import { Analytics } from '@vercel/analytics/react';
import { PostHogProvider } from '@/components/posthog-provider';

const lora = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

// Handwriting fonts - only loaded when needed (not preloaded for performance)
const caveat = Caveat({
  variable: "--font-handwriting-casual",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const playfair = Playfair_Display({
  variable: "--font-handwriting-professional",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const greatVibes = Great_Vibes({
  weight: "400",
  variable: "--font-handwriting-elegant",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const dancingScript = Dancing_Script({
  variable: "--font-handwriting-warm",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const patrickHand = Patrick_Hand({
  weight: "400",
  variable: "--font-handwriting-bold",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const sacramento = Sacramento({
  weight: "400",
  variable: "--font-handwriting-signature",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "SteadyLetters",
  description: "Send handwritten letters with AI assistance - SteadyLetters",
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png', sizes: 'any' },
      { url: '/logo.png', type: 'image/png', sizes: '32x32' },
      { url: '/logo.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: [
      { url: '/logo.png', type: 'image/png', sizes: '180x180' },
    ],
    shortcut: '/logo.png',
  },
  openGraph: {
    title: "SteadyLetters",
    description: "Send handwritten letters with AI assistance - SteadyLetters",
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'SteadyLetters Logo',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "SteadyLetters",
    description: "Send handwritten letters with AI assistance - SteadyLetters",
    images: ['/logo.png'],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${lora.variable} ${caveat.variable} ${playfair.variable} ${greatVibes.variable} ${dancingScript.variable} ${patrickHand.variable} ${sacramento.variable} antialiased font-sans`}
      >
        <PostHogProvider>
          <ErrorBoundary>
            <AuthProvider>
              <Navbar />
              <main className="container mx-auto py-6 px-4 min-h-[calc(100vh-140px)]">
                {children}
              </main>
              <Footer />
            </AuthProvider>
          </ErrorBoundary>
          <Analytics />
        </PostHogProvider>
      </body>
    </html>
  );
}
