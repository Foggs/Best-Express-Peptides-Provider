import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { AgeVerification } from "@/components/layout/AgeVerification"
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner"
import { Toaster } from "@/components/ui/toaster"
import { Providers } from "./providers"
import { GoogleAnalytics } from "@/components/GoogleAnalytics"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PeptideLabs - Premium Research Peptides | Laboratory Grade",
  description: "Premium quality research peptides for scientific study. 99%+ purity, lab-tested, research-grade compounds. HPLC verified. For research use only.",
  keywords: "research peptides, laboratory peptides, BPC-157, TB-500, Semaglutide, peptide research",
  authors: [{ name: "PeptideLabs" }],
  openGraph: {
    type: "website",
    url: "https://peptidelabs.com",
    title: "PeptideLabs - Premium Research Peptides",
    description: "Premium quality research peptides for scientific study. Lab-tested, research-grade compounds.",
    siteName: "PeptideLabs",
  },
  twitter: {
    card: "summary_large_image",
    title: "PeptideLabs - Premium Research Peptides",
    description: "Premium quality research peptides for scientific study.",
  },
  robots: "index, follow",
  alternates: {
    canonical: "https://peptidelabs.com",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#1e3a8a" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "PeptideLabs",
              url: "https://peptidelabs.com",
              logo: "https://peptidelabs.com/logo.png",
              description: "Premium quality research peptides for scientific study",
              sameAs: [],
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "[contact-number]",
                contactType: "Customer Support",
              },
            }),
          }}
        />
      </head>
      <body className={inter.className}>
        <Providers>
          <a href="#main-content" className="sr-only focus:not-sr-only">
            Skip to main content
          </a>
          <AgeVerification />
          <DisclaimerBanner />
          <Header />
          <main id="main-content" className="min-h-screen">
            {children}
          </main>
          <Footer />
          <Toaster />
          <GoogleAnalytics />
        </Providers>
      </body>
    </html>
  )
}
