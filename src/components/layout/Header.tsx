"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { CartIcon, MenuIcon, CloseIcon, UserIcon } from "@/components/icons"
import { Home, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/store/cart"
import { useSession, signIn, signOut } from "next-auth/react"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { items } = useCartStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  const itemCount = mounted ? items.reduce((acc, item) => acc + item.quantity, 0) : 0
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60" role="banner">
      <div className="container-custom">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" aria-label="BestExpressPeptides - Home">
              <Image
                src="/images/besttestexpress_logo.png"
                alt="BestExpressPeptides"
                width={296}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {session ? (
              <div className="hidden md:flex items-center gap-4">
                <Link href="/account">
                  <Button variant="ghost" size="sm">
                    <UserIcon size={16} className="mr-2" />
                    Account
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => signOut()}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            <Link href="/admin/login" aria-label="Admin">
              <Button variant="outline" size="sm">
                <Shield size={16} className="mr-2" />
                Admin
              </Button>
            </Link>
            
            <Link href="/" aria-label="Home">
              <Button variant="outline" size="icon" aria-label="Home">
                <Home size={20} />
              </Button>
            </Link>

           

            <Link href="/cart" className="relative" aria-label={`Shopping cart${itemCount > 0 ? `, ${itemCount} items` : ''}`}>
              <Button variant="outline" size="icon" aria-label="View cart">
                <CartIcon size={20} />
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
              {mobileMenuOpen ? <CloseIcon size={24} /> : <MenuIcon size={24} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div id="mobile-menu" className="md:hidden py-4 border-t">
            <nav className="flex flex-col gap-4" aria-label="Mobile navigation">
              <Link href="/admin/login" className="text-sm font-medium text-gray-600 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                Admin
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
                <>
                  <Link href="/auth/signin" className="text-sm font-medium text-gray-600 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                  <Link href="/auth/signup" className="text-sm font-medium text-gray-600 hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
