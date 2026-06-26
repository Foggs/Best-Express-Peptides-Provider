# Threat Model

## Project Overview

BestExpressPeptides is a publicly deployed Next.js 15 e-commerce application for research peptides. It exposes public catalog, contact, signup, and provider-intake surfaces; authenticated user account and checkout flows backed by NextAuth and Prisma/PostgreSQL; and admin APIs protected by a separate Bearer JWT. Product and inventory data come from Google Sheets, and operational emails are sent through Resend.

Production assumptions for this scan:
- `NODE_ENV` is `production`.
- The primary deployment is public (`https://provider.bestexpresspeptides.com`), so public routes are internet reachable.
- TLS is provided by the platform.
- Mockup/dev-only areas are out of scope unless production reachability is demonstrated.

## Assets

- **User accounts and sessions** — NextAuth sessions, credential hashes, OAuth-linked identities, and admin JWTs. Compromise would allow unauthorized ordering, access to account history, or admin actions.
- **Provider approval state** — `User.status`, provider applications, setup tokens, and approval/rejection workflow data. This is the core gate separating vetted providers from the public internet.
- **Order data** — order numbers, cart contents, shipping addresses, phone numbers, and associated user identities. This contains personal data and business-sensitive order history.
- **Admin capabilities** — coupon management, provider application review, product sync/write-back, AI content generation, and order management. Abuse would let an attacker manipulate business operations and inventory.
- **Application secrets and third-party access** — JWT/NextAuth secrets, database credentials, Resend access, Replit connector identity, and Google Sheets access tokens.
- **Provider-submitted documents** — uploaded reseller certificates and business-license files stored under `private-uploads/provider-intake`.

## Trust Boundaries

- **Browser to Next.js route handlers** — all client input is untrusted, including public forms, auth requests, checkout data, and admin login attempts.
- **Authenticated user to privileged provider-only actions** — the app intends to allow only approved/vetted users to place orders and access account-linked flows.
- **User to admin boundary** — admin APIs use a separate Bearer JWT and must enforce role checks server-side on every request.
- **Server to PostgreSQL** — route handlers can read/write users, orders, coupons, sessions, and provider applications. Query scoping mistakes expose data broadly.
- **Server to Google Sheets** — product and stock reads/writes cross into an external system authenticated via Replit connectors.
- **Server to Resend / AI integration** — order, contact, and onboarding data is sent to external email/AI services.
- **Public internet to file storage** — provider-intake uploads cross into server-side file storage and must not become web-accessible or path-controllable.

## Scan Anchors

- **Production entry points:** `src/app/api/**`, server actions under `src/app/auth/set-password`, and client auth/account flows under `src/app/auth/**`, `src/app/account/**`, `src/app/checkout/**`, `src/app/admin/**`.
- **Highest-risk code areas:** `src/lib/auth.ts`, `src/app/api/auth/**`, `src/lib/admin-auth.ts`, `src/app/api/admin/**`, `src/app/api/checkout/route.ts`, `src/app/api/provider-intake/**`, `src/app/api/orders/route.ts`, `src/lib/googleSheets.ts`.
- **Surface split:** public = catalog/products/categories/contact/provider-intake/auth/admin login; authenticated = checkout/orders/account; admin = `/api/admin/**` plus `/admin/**` UI.
- **Usually ignore unless proven reachable:** tests, Playwright assets, workflow logs, `.next`, and local planning/task files.

## Threat Categories

### Spoofing

The application uses two auth systems: NextAuth for user accounts and a custom JWT for admin APIs. The system must only issue authenticated user access to identities that have legitimately completed the intended onboarding path, and admin tokens must only be granted after strong server-side verification. Any public route that can mint approved accounts or valid admin access without the intended checks breaks the core trust model.

### Tampering

Customers submit carts, shipping data, coupon codes, and provider-intake forms from an untrusted client. The server must remain authoritative for prices, stock, provider state transitions, coupon rules, and admin-only actions. Uploaded filenames, sheet-bound updates, and AI-assisted content generation must not allow attackers to alter data outside the intended records.

### Information Disclosure

Orders, provider applications, uploaded documents, and account data contain PII. Account and admin APIs must scope reads to the authenticated principal, avoid mixing identity fields that can be user-controlled, and avoid leaking secrets or sensitive operational details in responses or logs. Provider documents must remain non-public.

### Denial of Service

Public routes such as admin login, auth flows, contact, checkout, and provider intake are reachable from the internet and can trigger database work, email sends, and external API calls. These paths require effective rate limiting and bounded inputs so attackers cannot brute-force accounts or exhaust operational resources.

### Elevation of Privilege

This project’s most important security guarantee is that only vetted providers can obtain provider-capable accounts and only admins can reach admin APIs. Public registration, OAuth onboarding behavior, setup-token handling, and admin role verification are the primary places where privilege escalation can occur. Every protected route must enforce authorization server-side, independent of client UI state.
