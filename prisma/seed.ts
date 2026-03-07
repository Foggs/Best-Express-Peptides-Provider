import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Database seed script.')
  console.log('Product data is now managed via Google Sheets.')
  console.log('Use the admin dashboard to refresh products from the Google Sheet.')
  console.log('')
  console.log('Ensuring base categories exist for order references...')

  const categories = [
    { name: 'Recovery', slug: 'recovery', description: 'Peptides for tissue repair and recovery research' },
    { name: 'Longevity', slug: 'longevity', description: 'Anti-aging and longevity research peptides' },
    { name: 'Weight Loss', slug: 'weight-loss', description: 'Metabolic and weight management research peptides' },
    { name: 'Cognitive', slug: 'cognitive', description: 'Nootropic and cognitive enhancement research peptides' },
    { name: 'Strength', slug: 'strength', description: 'Muscle and performance research peptides' },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
  }

  console.log('Categories seeded. Product data lives in Google Sheets.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
