import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductCard } from "@/components/products/ProductCard"
import { getCachedFeaturedProducts } from "@/lib/productCache"
import { ArrowRight } from "lucide-react"

export async function FeaturedProducts() {
  const featuredProducts = await getCachedFeaturedProducts()

  if (featuredProducts.length === 0) return null

  return (
    <section className="py-16">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold mb-2">Featured Peptides</h2>
            <p className="text-muted-foreground">Our most popular research compounds</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/peptides">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProducts.map((product, i) => (
            <ProductCard key={product.id} product={product} priority={i < 3} />
          ))}
        </div>
      </div>
    </section>
  )
}

export function FeaturedProductsSkeleton() {
  return (
    <section className="py-16">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-12">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-square w-full rounded-none" />
              <div className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-5 w-28 mb-4" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
