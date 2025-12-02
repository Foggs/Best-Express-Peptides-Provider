import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ProductDetails } from "./ProductDetails"
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd"

interface PageProps {
  params: { slug: string }
}

async function getProduct(slug: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        variants: {
          orderBy: { price: 'asc' }
        },
      },
    })
    return product
  } catch (error) {
    return null
  }
}

async function getRelatedProducts(categoryId: string, currentProductId: string) {
  try {
    const products = await prisma.product.findMany({
      where: {
        categoryId,
        id: { not: currentProductId },
        active: true,
      },
      include: {
        category: true,
        variants: true,
      },
      take: 4,
    })
    return products
  } catch (error) {
    return []
  }
}

export const revalidate = 3600

export default async function ProductPage({ params }: PageProps) {
  const product = await getProduct(params.slug)
  
  if (!product) {
    notFound()
  }

  const relatedProducts = await getRelatedProducts(product.categoryId, product.id)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://peptidelabs.com"
  const lowestPrice = product.variants.length > 0 ? product.variants[0].price : 0

  const breadcrumbItems = [
    { name: "Home", url: baseUrl },
    { name: "Peptides", url: `${baseUrl}/peptides` },
    { name: product.category.name, url: `${baseUrl}/peptides?category=${product.category.slug}` },
    { name: product.name, url: `${baseUrl}/peptides/${product.slug}` },
  ]

  return (
    <>
      <ProductJsonLd
        name={product.name}
        description={product.shortDescription || product.description.substring(0, 160)}
        image={product.images[0]}
        sku={product.sku}
        price={lowestPrice}
        category={product.category.name}
        url={`${baseUrl}/peptides/${product.slug}`}
      />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <ProductDetails product={product} relatedProducts={relatedProducts} />
    </>
  )
}

export async function generateMetadata({ params }: PageProps) {
  const product = await getProduct(params.slug)
  
  if (!product) {
    return { title: 'Product Not Found' }
  }

  return {
    title: `${product.name} | Research Grade Peptide - PeptideLabs`,
    description: product.shortDescription || product.description.substring(0, 160),
    openGraph: {
      title: product.name,
      description: product.shortDescription || product.description.substring(0, 160),
      images: product.images.slice(0, 1),
      type: 'website',
    },
    keywords: `${product.name}, research peptide, laboratory grade`,
  }
}
