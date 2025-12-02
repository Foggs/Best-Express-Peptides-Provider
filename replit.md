# PeptideLabs - Research Peptide E-commerce Store

## Overview
A production-ready e-commerce website for selling research peptides built with Next.js 15 (App Router), TypeScript, and modern web technologies.

## Tech Stack
- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: Zustand (cart persistence)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (email/password + Google)
- **Payments**: Stripe Checkout
- **Validation**: Zod, React Hook Form

## Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard
│   ├── auth/              # Authentication pages
│   ├── cart/              # Shopping cart
│   ├── checkout/          # Checkout flow
│   ├── peptides/          # Product catalog
│   └── [legal pages]      # Terms, Privacy, etc.
├── components/
│   ├── layout/            # Header, Footer, etc.
│   ├── products/          # Product components
│   └── ui/                # shadcn/ui components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities, Prisma client
├── store/                 # Zustand stores
└── types/                 # TypeScript types
```

## Environment Variables
Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string (auto-configured by Replit)
- `NEXTAUTH_SECRET` - Secret for NextAuth.js
- `NEXTAUTH_URL` - Base URL for authentication
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `GOOGLE_CLIENT_ID` - Google OAuth client ID (optional)
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret (optional)

## Commands
- `npm run dev` - Start development server on port 5000
- `npm run build` - Build for production
- `npm run db:push` - Push Prisma schema to database
- `npm run db:seed` - Seed database with sample products

## Features
- Age verification gate (21+)
- Product catalog with filtering and search
- Shopping cart with localStorage persistence
- Stripe Checkout integration
- User accounts with order history
- Admin dashboard for product management
- Legal pages (Terms, Privacy, Disclaimer, etc.)

## Admin Access
- URL: /admin
- Email: admin@peptidelabs.com
- Password: admin123

## Stripe Test Cards
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002

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
- **Optimized Prisma queries**: Product listings use select clauses to fetch only necessary fields (excludes large text blobs like description, research, coa, faq)
- **React cache()**: Applied to getFeaturedProducts, getCategoriesWithCount, getProductBySlug, getRelatedProducts for request deduplication
- **Removed unused dependencies**: Pruned 5 unused Radix UI packages (accordion, avatar, checkbox, dropdown-menu, navigation-menu)
- **Centralized data access**: All product queries go through src/lib/queries.ts for consistent optimization
- **Static SVG icons**: Created src/components/icons/index.tsx with static SVG components for frequently used icons (FlaskIcon, CartIcon, MenuIcon, CloseIcon, UserIcon, WarningIcon, MailIcon, PhoneIcon) - reduces lucide-react bundle impact
- **Cart store hydration**: Implemented _hasHydrated flag with onRehydrateStorage callback to prevent SSR/client hydration mismatches

## Recent Changes (December 2024)
- Fixed sitemap.xml to only include existing pages (removed /about, /contact, /faq)
- Corrected /refund-policy to /refund in sitemap
- Updated Footer navigation to match existing pages
- Comprehensive SEO and accessibility audit completed
- Performance optimizations: query optimization, caching, dependency cleanup
- Added static SVG icons to reduce bundle size
- Implemented cart store lazy hydration pattern
