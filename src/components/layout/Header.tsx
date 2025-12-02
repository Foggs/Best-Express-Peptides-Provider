"use client"

import Link from "next/link"
import { useState } from "react"
import { ShoppingCart, Menu, X, User, FlaskConical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/store/cart"
import { useSession, signIn, signOut } from "next-auth/react"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { items } = useCartStore()
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0)
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60" role="banner">
      <div className="container-custom">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2" aria-label="PeptideLabs - Home">
              <FlaskConical className="h-8 w-8 text-primary" aria-hidden="true" />
              <span className="text-xl font-bold text-primary">PeptideLabs</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
              <Link href="/peptides" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                All Peptides
              </Link>
              <Link href="/peptides?category=recovery" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                Recovery
              </Link>
              <Link href="/peptides?category=longevity" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                Longevity
              </Link>
              <Link href="/peptides?category=weight-loss" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                Weight Loss
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {session ? (
              <div className="hidden md:flex items-center gap-4">
                <Link href="/account">
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Account
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => signOut()}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" className="hidden md:flex" onClick={() => signIn()}>
                Sign In
              </Button>
            )}

            <Link href="/cart" className="relative" aria-label={`Shopping cart${itemCount > 0 ? `, ${itemCount} items` : ''}`}>
              <Button variant="outline" size="icon" aria-label="View cart">
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-xs text-white flex items-center justify-center" aria-hidden="true">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>

            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div id="mobile-menu" className="md:hidden py-4 border-t">
            <nav className="flex flex-col gap-4" aria-label="Mobile navigation">
              <Link href="/peptides" className="text-sm font-medium text-gray-600 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                All Peptides
              </Link>
              <Link href="/peptides?category=recovery" className="text-sm font-medium text-gray-600 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                Recovery
              </Link>
              <Link href="/peptides?category=longevity" className="text-sm font-medium text-gray-600 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                Longevity
              </Link>
              <Link href="/peptides?category=weight-loss" className="text-sm font-medium text-gray-600 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                Weight Loss
              </Link>
              {session ? (
                <>
                  <Link href="/account" className="text-sm font-medium text-gray-600 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                    Account
                  </Link>
                  <button onClick={() => signOut()} className="text-sm font-medium text-gray-600 hover:text-primary text-left">
                    Sign Out
                  </button>
                </>
              ) : (
                <button onClick={() => signIn()} className="text-sm font-medium text-gray-600 hover:text-primary text-left">
                  Sign In
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
