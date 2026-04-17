# Audit Fix Checklist

Generated from the final code audit. Work through tasks in order — one per session, stop for review after each commit.

---

- [x] **Task 1 · #27** — Fix hardcoded JWT fallback secret (`admin-auth.ts`, `login/route.ts`, `verify/route.ts`)
- [x] **Task 2 · #28** — Re-validate coupon discount server-side at checkout (`checkout/route.ts`)
- [ ] **Task 3 · #29** — Remove dead row-parsing code in `fetchFromSheet()` (`productCache.ts`)
- [ ] **Task 4 · #30** — Deduplicate `variantHeaderMap` constant (`productCache.ts`)
- [ ] **Task 5 · #31** — Extract `toListItem()` helper to eliminate copy-pasted mapping (`productCache.ts`)
- [ ] **Task 6 · #32** — Replace `any` types with `Record<string, string>` in row-mapping loops (`productCache.ts`)
- [ ] **Task 7 · #33** — Remove unnecessary `async` from `verifyAdminAuth` (`admin-auth.ts`)
- [ ] **Task 8 · #34** — Use `Prisma.PrismaClientKnownRequestError` instead of manual type inspection (`checkout/route.ts`)
- [ ] **Task 9 · #35** — Replace hand-rolled rate-limit store with `rate-limiter-flexible` (`rate-limit.ts`)
- [ ] **Task 10 · #36** — Remove redundant "what" comments from admin login route (`admin/login/route.ts`)
