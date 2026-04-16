import { Suspense } from "react"
import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { OrganizationJsonLd, WebsiteJsonLd } from "@/components/seo/JsonLd"
import { FeaturedProducts, FeaturedProductsSkeleton } from "@/components/home/FeaturedProducts"
import { BrowseByCategory, CategoriesSkeleton } from "@/components/home/BrowseByCategory"
import { 
  FlaskConical, 
  Shield, 
  Truck, 
  Award, 
  Microscope, 
  ArrowRight,
  CheckCircle,
} from "lucide-react"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "BestExpressPeptides | Premium Research-Grade Peptides for Scientific Research",
  description: "Discover our comprehensive collection of laboratory-grade research peptides. 99%+ purity verified, fast shipping, and certificates of analysis. For research use only.",
  openGraph: {
    title: "BestExpressPeptides | Premium Research-Grade Peptides",
    description: "Discover our comprehensive collection of laboratory-grade research peptides. 99%+ purity verified.",
    type: "website",
  },
  keywords: "research peptides, laboratory peptides, peptide research, scientific peptides, USA peptides, HPLC verified peptides",
}

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  return (
    <>
      <OrganizationJsonLd />
      <WebsiteJsonLd />
      <div>
      <section className="relative text-white overflow-hidden">
        <Image
          src="/images/bckgrd.png"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-blue-900/65"></div>
        
        <div className="container-custom relative py-20 md:py-32">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-blue-500/20 text-blue-200 border-blue-400/30">
              Laboratory Grade Peptides
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Premium Research Peptides for Scientific Excellence
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Discover our comprehensive collection of research-grade peptides. 
              Every product is rigorously tested and verified for purity to support your scientific research.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild className="bg-white text-blue-900 hover:bg-blue-50">
                <Link href="/peptides">
                  Browse Peptides
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white border-b">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">99%+ Purity</p>
                <p className="text-sm text-muted-foreground">HPLC Verified</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Fast Shipping</p>
                <p className="text-sm text-muted-foreground">2-3 Day Delivery</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Lab Tested</p>
                <p className="text-sm text-muted-foreground">COA Available</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Microscope className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Research Grade</p>
                <p className="text-sm text-muted-foreground">USA Made</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {session && (
        <>
          <Suspense fallback={<FeaturedProductsSkeleton />}>
            <FeaturedProducts />
          </Suspense>

          <Suspense fallback={<CategoriesSkeleton />}>
            <BrowseByCategory />
          </Suspense>
        </>
      )}

      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose BestExpressPeptides?</h2>
            <p className="text-muted-foreground">
              We are committed to providing the highest quality research peptides for the scientific community.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <FlaskConical className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Research-Grade Purity</h3>
                <p className="text-muted-foreground mb-4">
                  Every peptide undergoes rigorous HPLC testing to ensure 99%+ purity for reliable research results.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Third-party lab verified
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    COA with every order
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Batch-to-batch consistency
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Fast & Secure Shipping</h3>
                <p className="text-muted-foreground mb-4">
                  Temperature-controlled shipping ensures your peptides arrive in perfect condition.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    2-3 day delivery
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Discreet packaging
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Free shipping over $200
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Secure Transactions</h3>
                <p className="text-muted-foreground mb-4">
                  Your privacy and security are our top priorities with encrypted checkout.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    256-bit SSL encryption
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Stripe secure checkout
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Privacy protected
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Research?</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Browse our extensive catalog of research-grade peptides and find the compounds you need for your studies.
          </p>
          <Button size="lg" asChild className="bg-white text-primary hover:bg-blue-50">
            <Link href="/peptides">
              Shop All Peptides
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
    </>
  )
}
