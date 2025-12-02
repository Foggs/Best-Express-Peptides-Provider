"use client"

import { usePathname } from "next/navigation"
import { Header } from "./Header"
import { Footer } from "./Footer"
import { AgeVerification } from "./AgeVerification"
import { DisclaimerBanner } from "./DisclaimerBanner"
import { ScreenReaderAnnouncer } from "@/components/accessibility/ScreenReaderAnnouncer"
import type React from "react"

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminPage = pathname.startsWith("/admin")

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      {!isAdminPage && <ScreenReaderAnnouncer />}
      {!isAdminPage && <AgeVerification />}
      {!isAdminPage && <DisclaimerBanner />}
      {!isAdminPage && <Header />}
      <main id="main-content" className="min-h-screen" role="main">
        {children}
      </main>
      {!isAdminPage && <Footer />}
    </>
  )
}
