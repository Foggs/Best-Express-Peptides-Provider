import { Metadata } from "next"
import { ProductCard } from "@/components/products/ProductCard"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd"
import { getCachedProducts, getCachedCategories } from "@/lib/productCache"
import Link from "next/link"
import { Search, Filter } from "lucide-react"

interface PageProps {
  searchParams: Promise<{ category?: string; search?: string; sort?: string }>
}

export const metadata: Metadata = {
  title: "Research Peptides | Laboratory Grade Peptides - BestExpressPeptides",
  description: "Browse our comprehensive collection of premium research-grade peptides for scientific research. All products are rigorously tested for purity. For research use only.",
  openGraph: {
    title: "Research Peptides | BestExpressPeptides",
    description: "Browse our comprehensive collection of premium research-grade peptides for scientific research.",
    type: "website",
  },
  keywords: "research peptides, laboratory peptides, scientific peptides, peptide research, research chemicals",
}

export default async function PeptidesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { category, search, sort } = params
  
  const [products, categories] = await Promise.all([
    getCachedProducts({ category, search, sort }),
    getCachedCategories(),
  ])
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bestexpresspeptides.com"

  const breadcrumbItems = [
    { name: "Home", url: baseUrl },
    { name: "Peptides", url: `${baseUrl}/peptides` },
    ...(category ? [{
      name: categories.find(c => c.slug === category)?.name || category,
      url: `${baseUrl}/peptides?category=${category}`
    }] : [])
  ]

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <div className="py-8">
      <div className="container-custom">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Research Peptides</h1>
          <p className="text-muted-foreground">
            Browse our comprehensive collection of laboratory-grade peptides for research purposes.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className={`lg:w-64 shrink-0 ${category ? 'order-2 lg:order-1' : ''}`}>
            <div className="sticky top-24 space-y-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Categories
                </h3>
                <div className="space-y-2">
                  <Link
                    href="/peptides"
                    className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                      !category ? 'bg-primary text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    All Peptides
                  </Link>
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/peptides?category=${cat.slug}`}
                      className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                        category === cat.slug ? 'bg-primary text-white' : 'hover:bg-gray-100'
                      }`}
                    >
                      {cat.name}
                      <span className="text-xs ml-2 opacity-70">({cat._count.products})</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Research Use Only</strong><br />
                  All products are intended for laboratory research only. Not for human consumption.
                </p>
              </div>
            </div>
          </aside>

          <div className={`flex-1 ${category ? 'order-1 lg:order-2' : ''}`}>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <form className="relative flex-1" action="/peptides" method="GET">
                {category && <input type="hidden" name="category" value={category} />}
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  name="search"
                  placeholder="Search peptides..."
                  defaultValue={search}
                  className="pl-10"
                />
              </form>
              <form action="/peptides" method="GET" className="flex gap-2">
                {category && <input type="hidden" name="category" value={category} />}
                {search && <input type="hidden" name="search" value={search} />}
                <select
                  name="sort"
                  defaultValue={sort || ''}
                  className="h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Newest First</option>
                  <option value="name">Name A-Z</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
                <button type="submit" className="h-10 px-4 rounded-md bg-primary text-white text-sm hover:bg-primary/90">
                  Apply
                </button>
              </form>
            </div>

            {category && (
              <div className="mb-6">
                <Badge variant="secondary" className="text-sm">
                  Category: {categories.find(c => c.slug === category)?.name || category}
                  <Link href="/peptides" className="ml-2 hover:text-primary">×</Link>
                </Badge>
              </div>
            )}

            {products.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-lg">
                <p className="text-muted-foreground mb-4">No peptides found matching your criteria.</p>
                <Link href="/peptides" className="text-primary hover:underline">
                  View all peptides
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
