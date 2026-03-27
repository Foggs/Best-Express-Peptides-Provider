import { notFound } from "next/navigation"
import { ProductDetails } from "./ProductDetails"
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd"
import { getCachedProductBySlug, getCachedRelatedProducts } from "@/lib/productCache"

interface PageProps {
  params: Promise<{ slug: string }>
}

export const revalidate = 3600

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params
  const product = await getCachedProductBySlug(slug)
  
  if (!product) {
    notFound()
  }

  const relatedProducts = await getCachedRelatedProducts(
    product.categories?.map(c => c.slug) || [product.category.slug],
    product.slug
  )
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bestexpresspeptides.com"
  const hasVariants = product.variants.length > 0
  const firstVariant = hasVariants ? product.variants[0] : null
  const lowestPrice = firstVariant?.price || 0
  const productSku = firstVariant?.sku || product.slug

  const breadcrumbItems = [
    { name: "Home", url: baseUrl },
    { name: "Peptides", url: `${baseUrl}/peptides` },
    { name: product.category.name, url: `${baseUrl}/peptides?category=${product.category.slug}` },
    { name: product.name, url: `${baseUrl}/peptides/${product.slug}` },
  ]

  return (
    <>
      {hasVariants && (
        <ProductJsonLd
          name={product.name}
          description={product.shortDescription || product.description.substring(0, 160)}
          image=""
          sku={productSku}
          price={lowestPrice}
          category={product.category.name}
          url={`${baseUrl}/peptides/${product.slug}`}
        />
      )}
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <ProductDetails product={product} relatedProducts={relatedProducts} />
    </>
  )
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const product = await getCachedProductBySlug(slug)
  
  if (!product) {
    return { title: 'Product Not Found' }
  }

  return {
    title: `${product.name} | Research Grade Peptide - BestExpressPeptides`,
    description: product.shortDescription || product.description.substring(0, 160),
    openGraph: {
      title: product.name,
      description: product.shortDescription || product.description.substring(0, 160),
      images: [],
      type: 'website',
    },
    keywords: `${product.name}, research peptide, laboratory grade`,
  }
}
