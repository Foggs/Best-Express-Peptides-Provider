import { execSync } from 'child_process'
import { request } from '@playwright/test'

const BASE_URL = 'http://localhost:5000'

const WARMUP_PATHS = [
  '/',
  '/peptides',
  '/cart',
  '/auth/signin',
  '/checkout/success?session_id=warmup',
  '/api/auth/session',
  '/api/products',
  '/api/categories',
  '/api/coupon',
  '/api/checkout',
]

async function waitForServerReady(ctx: Awaited<ReturnType<typeof request.newContext>>) {
  const deadline = Date.now() + 30_000
  let lastErr: unknown = null
  while (Date.now() < deadline) {
    try {
      const res = await ctx.get('/', { timeout: 5_000, failOnStatusCode: false })
      if (res.status() < 500) return
      lastErr = new Error(`status ${res.status()}`)
    } catch (err) {
      lastErr = err
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  const message = lastErr instanceof Error ? lastErr.message : String(lastErr)
  throw new Error(
    `[global-setup] Dev server at ${BASE_URL} did not become reachable within 30s. ` +
      `Last error: ${message}. Start the Next.js dev server (npm run dev) before running e2e tests.`,
  )
}

async function warmupRoutes() {
  console.log('[global-setup] Warming up Next.js dev-server routes...')
  const ctx = await request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: { 'cache-control': 'no-cache' },
  })

  await waitForServerReady(ctx)

  for (const path of WARMUP_PATHS) {
    const start = Date.now()
    try {
      const isPost = path === '/api/coupon' || path === '/api/checkout'
      const res = isPost
        ? await ctx.post(path, { data: {}, timeout: 120000, failOnStatusCode: false })
        : await ctx.get(path, { timeout: 120000, failOnStatusCode: false })
      const ms = Date.now() - start
      console.log(`[global-setup]   ${path} → ${res.status()} in ${ms}ms`)
    } catch (err) {
      const ms = Date.now() - start
      const message = err instanceof Error ? err.message : String(err)
      console.warn(`[global-setup]   ${path} → ERROR after ${ms}ms: ${message}`)
    }
  }

  await ctx.dispose()
  console.log('[global-setup] Warmup complete.')
}

async function globalSetup() {
  if (process.env.TEST_USER_EMAIL && process.env.TEST_USER_PASSWORD) {
    console.log('[global-setup] Seeding test user...')
    execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' })
    console.log('[global-setup] Seed complete.')
  } else {
    console.warn('[global-setup] TEST_USER_EMAIL / TEST_USER_PASSWORD not set — skipping seed.')
  }

  await warmupRoutes()
}

export default globalSetup
