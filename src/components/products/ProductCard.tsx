"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { ShoppingCart } from "lucide-react"

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    shortDescription?: string | null
    images: string[]
    category: {
      name: string
      slug: string
    }
    variants: {
      id: string
      name: string
      price: number
    }[]
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const lowestPrice = Math.min(...product.variants.map(v => v.price))

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <Link href={`/peptides/${product.slug}`}>
        <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl font-bold text-gray-200">
                {product.name.charAt(0)}
              </div>
            </div>
          )}
          <Badge className="absolute top-3 left-3" variant="secondary">
            {product.category.name}
          </Badge>
        </div>
      </Link>

      <CardContent className="p-4">
        <Link href={`/peptides/${product.slug}`}>
          <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        {product.shortDescription && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {product.shortDescription}
          </p>
        )}
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-primary">
            {product.variants.length > 1 ? 'From ' : ''}{formatPrice(lowestPrice)}
          </span>
        </div>
        <Badge variant="warning" className="mt-2 text-xs">
          Research Use Only
        </Badge>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full" variant="outline">
          <Link href={`/peptides/${product.slug}`}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            View Options
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
