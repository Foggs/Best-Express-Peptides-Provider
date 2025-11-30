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
