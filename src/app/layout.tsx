import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { AgeVerification } from "@/components/layout/AgeVerification"
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner"
import { Toaster } from "@/components/ui/toaster"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PeptideLabs - Premium Research Peptides",
  description: "Premium quality research peptides for scientific study. Lab-tested, research-grade compounds for laboratory use only.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <AgeVerification />
          <DisclaimerBanner />
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
