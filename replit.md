# BestExpressPeptides - Research Peptide E-commerce Store

## Overview
A production-ready e-commerce website for selling research peptides built with Next.js 15 (App Router), TypeScript, and modern web technologies.

## Tech Stack
- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: Zustand (cart persistence)
- **Database**: PostgreSQL with Prisma ORM (orders/users only)
- **Product Data**: Google Sheets (single source of truth) with in-memory TTL cache
- **Authentication**: NextAuth.js (email/password + Google)
- **Order Notifications**: Resend (emails order details to admin)
- **Payments**: Stripe Checkout (currently disabled, kept for future re-enablement)
- **Validation**: Zod, React Hook Form

## Architecture Notes

### Product Data Flow
- Products and variants are managed in a Google Sheet (ID: set via `GOOGLE_SHEET_ID` env var)
- Two tabs: "Products" (slug, name, category, etc.) and "Variants" (productSlug, variantName, price, sku, stock)
- `src/lib/productCache.ts` provides in-memory caching with 5-minute TTL
- Admin can force-refresh cache from the admin dashboard
- Prisma/DB is NOT used for products — only for users, orders, sessions, coupons, categories

### Checkout Flow
- Customer fills out shipping form and clicks "Submit Order"
- Server sends a formatted HTML email to the admin via Resend with full order details
- No payment is collected at checkout — admin contacts customer for payment
- Stripe code has been removed from checkout (webhook route returns 503)

## Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── checkout/      # Email-based order submission
│   │   ├── admin/         # Admin APIs (refresh-products, etc.)
│   │   └── webhook/       # Stripe webhook (disabled)
│   ├── admin/             # Admin dashboard
│   ├── auth/              # Authentication pages
│   ├── cart/              # Shopping cart
│   ├── checkout/          # Checkout flow + success page
│   ├── peptides/          # Product catalog
│   └── [legal pages]      # Terms, Privacy, etc.
├── components/
│   ├── layout/            # Header, Footer, etc.
│   ├── products/          # Product components
│   └── ui/                # shadcn/ui components
├── hooks/                 # Custom React hooks
├── lib/
│   ├── googleSheets.ts    # Google Sheets OAuth client
│   ├── productCache.ts    # In-memory product cache (5-min TTL)
│   ├── resend.ts          # Resend email client
│   ├── orderEmail.ts      # Order notification email template + sender
│   ├── prisma.ts          # Prisma client (orders/users only)
│   └── queries.ts         # DB queries (orders only)
├── store/                 # Zustand stores
└── types/                 # TypeScript types
```

## Environment Variables
Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string (auto-configured by Replit)
- `NEXTAUTH_SECRET` - Secret for NextAuth.js
- `NEXTAUTH_URL` - Base URL for authentication
- `GOOGLE_SHEET_ID` - Google Sheet ID for product data
- `RESEND_API_KEY` - Resend API key for sending order emails
- `ADMIN_EMAIL` - Email address to receive order notifications
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - Replit AI Integration base URL (auto-configured)
- `AI_INTEGRATIONS_OPENAI_API_KEY` - Replit AI Integration API key (auto-configured)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID (optional)
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret (optional)

## Commands
- `npm run dev` - Start development server on port 5000
- `npm run build` - Build for production
- `npm run db:push` - Push Prisma schema to database
- `npm run db:seed` - Seed database with categories
- `npm run test:e2e` - Run Playwright end-to-end tests

## Features
- Age verification gate (21+)
- Product catalog sourced from Google Sheets with in-memory caching
- Multi-category support (comma-separated in sheet, products appear in all relevant category filters)
- Shopping cart with localStorage persistence
- Email-based order submission (admin receives order details via Resend)
- **Inventory management**: Stock validation at checkout, Google Sheets write-back on order, UI quantity caps, low-stock admin email alerts
- User accounts with order history
- Admin dashboard with product cache refresh
- **AI content generation**: Product description, short description, and research summary generation via `/api/admin/generate-product-content` using Replit AI Integration (OpenAI-compatible, gpt-4o-mini, no API key required — billed to Replit credits) with compliance-safe prompting
- **AI image generation**: Product thumbnail generation via `/api/admin/generate-product-image` — uses Replit's built-in AI image generation (no external API key needed) with SVG-based branded placeholder fallback for new products. Saves PNG to `public/product-images/{slug}.png` and writes URL to sheet's `images` column. All 24 products pre-generated with AI images.
- **Slug standardization**: All product slugs normalized to lowercase-hyphenated format (e.g. "dsip 15" → "dsip-15", "2x alpha cjc/ipa" → "2x-alpha-cjc-ipa"). Normalization happens at cache load time via `slugify()` — no sheet edits needed. Image filenames and URLs match the normalized slugs.
- Legal pages (Terms, Privacy, Disclaimer, etc.)

## Inventory Management
- `checkStock()` and `decrementStock()` in `productCache.ts` read/write the Variants sheet directly
- Checkout flow: validate stock → decrement stock → send order email
- 409 response returned if any items have insufficient stock (with details per item)
- UI caps quantity selectors at available stock on both product detail and cart pages
- `CartItem` type includes `stock` field for client-side enforcement
- Low stock threshold: 5 units — triggers separate admin email alert via `sendLowStockAlert()` in `orderEmail.ts`
- Race condition note: Google Sheets lacks atomic transactions; the check-then-decrement window is tight but not locked

## Admin Access
- URL: /admin
- Email: admin@peptidelabs.com
- Password: admin123
- Admin products page has "Refresh from Google Sheets" button and link to edit the sheet

## Google Sheet Structure
- **Products tab**: slug, name, category (comma-separated for multiple), shortDescription, description, research, shippingInfo, faq, featured, active, images
- **Variants tab**: productSlug, variantName, price (in dollars), sku, stock

## Research Use Disclaimer
All products are clearly labeled "For Research Use Only - Not for Human Consumption" as required.

## SEO Features
- Dynamic sitemap.xml with products, categories, and static pages
- JSON-LD structured data (Product, BreadcrumbList, Organization, Website schemas)
- Dynamic metadata with Open Graph and Twitter cards
- SEO-optimized 404 page with contextual links
- All pages have unique titles and descriptions

## Accessibility Features
- ARIA labels on all navigation elements and interactive components
- Skip-to-content link for keyboard navigation
- Visible focus indicators for keyboard users
- ScreenReaderAnnouncer component for cart updates (aria-live regions)
- Semantic HTML structure with proper heading hierarchy
- Descriptive alt text on all images

## Performance Optimizations
- **Google Sheets caching**: In-memory TTL cache (5-min) avoids repeated API calls
- **React cache()**: Applied to product query functions for request deduplication
- **Static SVG icons**: Custom SVG components reduce lucide-react bundle impact
- **Cart store hydration**: _hasHydrated flag prevents SSR/client hydration mismatches

## End-to-End Testing
Playwright tests are configured for QA testing of the purchasing workflow:
- **Location**: `e2e/purchasing-workflow.spec.ts`
- **Run tests**: `npm run test:e2e`
- Note: Tests use system Chromium via `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` environment variable.
