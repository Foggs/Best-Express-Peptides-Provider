import { execSync } from 'child_process'

async function globalSetup() {
  if (process.env.TEST_USER_EMAIL && process.env.TEST_USER_PASSWORD) {
    console.log('[global-setup] Seeding test user...')
    execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' })
    console.log('[global-setup] Seed complete.')
  } else {
    console.warn('[global-setup] TEST_USER_EMAIL / TEST_USER_PASSWORD not set — skipping seed.')
  }
}

export default globalSetup
