import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Home, Search, FlaskConical, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "404 - Page Not Found | PeptideLabs",
  description: "The page you are looking for does not exist. Browse our research peptide catalog or return to the homepage.",
  robots: {
    index: false,
    follow: true,
  },
}

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center bg-gray-50 py-16" role="main">
      <div className="container-custom">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <FlaskConical className="h-16 w-16 text-primary mx-auto mb-4" aria-hidden="true" />
            <h1 className="text-7xl font-bold text-primary mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Page Not Found
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              The page you are looking for does not exist, has been moved, or is temporarily unavailable.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button asChild size="lg">
              <Link href="/">
                <Home className="h-5 w-5 mr-2" aria-hidden="true" />
                Return to Home
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/peptides">
                <Search className="h-5 w-5 mr-2" aria-hidden="true" />
                Browse Peptides
              </Link>
            </Button>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold mb-2">Recovery Peptides</h3>
                <Link href="/peptides?category=recovery" className="text-primary hover:underline text-sm inline-flex items-center">
                  View Products <ArrowRight className="h-3 w-3 ml-1" aria-hidden="true" />
                </Link>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold mb-2">Longevity Peptides</h3>
                <Link href="/peptides?category=longevity" className="text-primary hover:underline text-sm inline-flex items-center">
                  View Products <ArrowRight className="h-3 w-3 ml-1" aria-hidden="true" />
                </Link>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold mb-2">Weight Loss Peptides</h3>
                <Link href="/peptides?category=weight-loss" className="text-primary hover:underline text-sm inline-flex items-center">
                  View Products <ArrowRight className="h-3 w-3 ml-1" aria-hidden="true" />
                </Link>
              </CardContent>
            </Card>
          </div>

          <p className="mt-8 text-sm text-gray-500">
            Need help? <Link href="/contact" className="text-primary hover:underline">Contact our support team</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
