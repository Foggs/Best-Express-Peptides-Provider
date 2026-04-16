import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

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
  console.log('')

  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    console.warn('⚠ ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping admin user seed.')
    console.warn('  Set both environment variables and re-run to create the admin account.')
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        password: hashedPassword,
        isAdmin: true,
      },
      create: {
        email: adminEmail,
        name: 'Admin',
        password: hashedPassword,
        isAdmin: true,
      },
    })

    console.log(`✓ Admin user seeded: ${adminEmail}`)
  }

  const testEmail = process.env.TEST_USER_EMAIL
  const testPassword = process.env.TEST_USER_PASSWORD

  if (!testEmail || !testPassword) {
    console.warn('⚠ TEST_USER_EMAIL or TEST_USER_PASSWORD not set — skipping test user seed.')
    console.warn('  Set both environment variables and re-run to create the test account.')
  } else {
    const hashedTestPassword = await bcrypt.hash(testPassword, 12)

    await prisma.user.upsert({
      where: { email: testEmail },
      update: {
        password: hashedTestPassword,
        isAdmin: false,
      },
      create: {
        email: testEmail,
        name: 'Test User',
        password: hashedTestPassword,
        isAdmin: false,
      },
    })

    console.log(`✓ Test user seeded: ${testEmail}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
