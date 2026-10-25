# MASTER SYSTEM PROMPT — AURELIA: Haute Horlogerie 3D Commerce Platform

> Paste this entire prompt as the first message into a fresh AI coding assistant. It is fully standalone: no prior context is required. The assistant must plan, scaffold, and build the project end-to-end, milestone by milestone, and may not skip or de-scope any numbered requirement.

---

## 0. ROLE & MISSION

You are a **senior full-stack product engineer team** acting as architect + developer. Your mission: build **AURELIA**, a production-grade luxury-watch commerce experience with a **procedural real-time 3D watch engine** at its heart, plus a real backend (database, auth, payments, notifications, admin). Deliver complete, runnable code with no TODOs left behind.

**Reference implementation.** A legacy single-file proof-of-concept (`index.html`, vanilla JS + Three.js r128 + GSAP) already exists in this repo. Use it as the authoritative reference for *visual design, motion grammar, and 3D behavior*. Every "REPLICATE" feature below must match its look/feel. You may open/read it freely. Do NOT copy its code blindly — rebuild it modularly on the new stack, and keep the legacy file untouched as a design reference.

**Legal guardrails (hard rules):**
1. AURELIA is a fictional house. Never use real trademarked names (Rolex, Oyster, Submariner, Daytona, Datejust, GMT-Master II, Coca-Cola/"Pepsis" etc.) in production UI, code identifiers, or metadata. Invented names are required. Model names: keep the concept + show a disclaimer: *"Independent concept boutique. Not affiliated with any existing watch brand."*
2. Never collect or store raw card numbers, CVVs, or expiry — payments go through a processor's secure fields (Stripe Elements) in test keys.

---

## 1. PRODUCT BRIEF

- One-page immersive boutique (desktop-first luxury feel, mobile-perfect) in **English + Arabic (RTL)**, with **USD/EGP/AED/SAR** pricing.
- Hero: a fully procedural 3D luxury watch floating in a dark studio, draggable/zoomable.
- Scroll-driven cinematic story: the watch **explodes into its anatomy** (case → crystal → movement → bracelet) across four editorial callouts, then reassembles.
- Collection of **4 references** (fictional): a dive watch, a chronograph, a two-tone dress watch, a GMT. Selecting a card morphs the 3D watch live.
- **Configurator**: metal / dial / bezel / bracelet options patch the 3D materials **live**, with real-time price composition.
- Cart → checkout → real payment intent → order persisted → emails → order tracking in an account area.
- Boutique pages with **real appointment booking**, newsletter with double opt-in, waitlists, reviews.
- Concierge **admin dashboard** for catalog, orders, appointments, analytics.
- PWA, top-tier performance and a11y, JSON-LD rich results.

---

## 2. TECH STACK (authoritative versions)

| Layer | Choice |
|---|---|
| Framework | **Next.js 15 (App Router, React 19, TypeScript 5)** |
| Styling | **Tailwind CSS v4** + CSS custom-property design tokens (theme via `data-theme`) |
| Animation | **GSAP 3.13 + ScrollTrigger** (client components only; disabled/mapped under `prefers-reduced-motion`) |
| 3D | **Three.js ≥ 0.180** (npm, imported dynamically on client; *no* react-three-fiber required — a single vanilla engine class mounted in one client component is preferred for control) |
| DB | **PostgreSQL 16** via **Prisma 6** (local dev: Docker) |
| Auth | **Auth.js v5** — credentials (password bcrypt/argon2) + Google OAuth; JWT session strategy |
| Payments | **Stripe** PaymentIntents + Webhooks; `DEMO_MODE` flag renders a mock payment panel so no keys are needed to run |
| Email | **Resend** + React Email templates (dev: `nodemailer` SMTP catch-all or console-transport) |
| Validation | **Zod** (shared client/server schemas) |
| Forms | React Hook Form + server actions or route handlers |
| i18n | **next-intl** — locales `en`, `ar` with full RTL; `dir` on `<html>`; localized route state |
| State | Zustand for client stores (cart UI, locale locks); server state via fetch + Server Components |
| Tests | Vitest (unit: pricing, config fingerprint, i18n) + Playwright (E2E: scroll story, configurator patch, cart→checkout) |
| Lint/format | ESLint 9 + Prettier; conventional commits; GitHub Actions CI (lint, typecheck, test, build) |
| Hosting | Vercel (web) + Neon/Supabase (Postgres) + Upstash (rate limit); storage for admin uploads: S3-compatible |

---

## 3. DESIGN SYSTEM

Tokens (dark default, light theme via `html[data-theme="light"]`):
- Colors: `--bg #0a0a0a`, `--bg-2 #0e0e0d`, `--ink #f5f1e8`, `--gold #c9a961`, `--gold-2 #e8d9ae`, `--gold-deep #8f7434`, `--green #006039`, hairlines `rgba(201,169,97,.22)`, glass surfaces with 16px blur. Light theme: warm ivory `#f4f0e6` surfaces, deepened golds.
- Typography: **Cormorant Garamond** (display/serif, EN), **Inter** (UI/sans), **Cairo** (ALL Arabic, incl. headings; disable letter-spacing in Arabic). Eyebrows: 10–11px, +0.26em tracking, uppercase.
- Grammar: 1px gold hairlines, glass cards, `.btn` with wipe-fill hover, staggered line-mask headline reveals, magnetic buttons, custom cursor (dot + lagging ring) on fine pointers only, toast system, gold scroll cue.
- Accessibility: visible `:focus-visible` gold outline, skip-link to collection, dialogs with `aria-modal` + Esc + focus trap, `prefers-reduced-motion` fully respected (no scrub, no transforms, instant states).

---

## 4. INFORMATION ARCHITECTURE (Routes)

- `/` — the full one-page experience (hero, story, collection, configurator, craft, testimonies, boutiques, newsletter, footer).
- `/api/*` — REST route handlers (below).
- `/cart` — standalone cart (drawer on `/` remains too).
- `/checkout` — multi-step checkout (contact → shipping → payment) reading cart server-side.
- `/order/[number]` — confirmation + status timeline (public via number + email token).
- `/account` — profile, addresses, orders, saved builds, wishlist, appointments.
- `/account/order/[number]` — order detail.
- `/config/[fingerprint]` — shareable configuration deep-link (opens configurator pre-applied + OG image via dynamic route).
- `/legal/[slug]` — privacy, terms, cookies (MDX, localized).
- `/boutique/[code]` — boutique detail + booking.
- `/admin` — protected dashboard (see §12).
- `robots.txt`, `sitemap.ts`, `manifest.webmanifest`, `favicon`, OG/PWA images.

---

## 5. DATABASE SCHEMA (PostgreSQL / Prisma models)

Money in **integer cents (USD base)**. Configurations are content-addressed by fingerprint. Orders snapshot the configuration JSON so history is immutable.

```
User            id PK, email unique, passwordHash?, name, phone?, locale ('en'|'ar') default 'en',
                currency default 'USD', role enum('CUSTOMER','CONCIERGE','ADMIN') default CUSTOMER,
                marketingOptIn bool, createdAt, updatedAt
RefreshToken    id, userId FK→User cascade, tokenHash, expiresAt, ip?, userAgent?, createdAt
Address         id, userId FK, label, line1, line2?, city, region?, postalCode?, countryCode, phone, isDefault
Boutique        id, code unique, city_en/city_ar, address, hours, phone?, lat?, lng?, active, sort
CatalogModel    id, slug unique, name_en/name_ar, tagline_en/tagline_ar, refNumber, basePriceCents,
                bezelType enum('DIVE','TACHY','GMT','FLUTED'), defaultDial/defaultMetal/defaultBracelet,
                attrs Jsonb {size, water, calibre, cyclops, subdials, gmt, guards, mini(readonly css colors)},
                published bool, sort int
Option          id, group enum('METAL','DIAL','BEZEL','BRACELET'), key, name_en/name_ar,
                priceDeltaCents, attrs Jsonb {hex?/ceramic?/a?,b?/fluted?}, appliesToBezel enum-set?, sort
ModelOption     modelId FK, optionId FK   (composite PK)  — restricts option set per model
Configuration   id, fingerprint unique, modelId FK, metalId FK, dialId FK, bezelId FK, braceletId FK,
                priceCents (denormalized, recomputed server-side)
Inventory       id, modelId FK, dialId FK?, qtyAvailable, qtyReserved, trackable bool
Cart            id, userId FK nullable, anonToken unique?, currency, updatedAt
CartItem        id, cartId FK cascade, configurationId FK, qty (1..9), unitPriceCents snapshot
Order           id, number unique ('AUR-XXXXXX'), userId FK?, email, phone, locale, currency,
                subtotalCents, totalCents, status enum('DRAFT','AWAITING_PAYMENT','PAID','CONFIRMED',
                'IN_ATELIER','SHIPPED','DELIVERED','CANCELLED','REFUNDED'),
                paymentIntentId?, shippingData Jsonb {name, city, addr, country, ...}
OrderItem       id, orderId FK cascade, modelId, configurationSnapshot Jsonb, qty, unitPriceCents, lineTotalCents
OrderEvent      id, orderId FK, type enum('CREATED','PAID','CONFIRMED','PRODUCTION','SHIPPED','DELIVERED'
                ,'CANCELLED','NOTE'), payload Jsonb?, createdAt   (business timeline shown to user)
Payment         id, orderId FK, provider, providerRef, amountCents, currency, status, raw Jsonb, createdAt
Waitlist        id, email, modelId FK, fingerprint?, createdAt   unique(email,modelId)
Newsletter      id, email unique, locale, status enum('PENDING','CONFIRMED','UNSUBSCRIBED'),
                token, confirmedAt?, createdAt
Appointment     id, boutiqueId FK, userId FK?, name, email, phone, service enum('VIEWING','SERVICE','VALUATION'),
                slotAt (timestamptz), status enum('REQUESTED','CONFIRMED','FULFILLED','CANCELLED'),
                notes?, tz, createdAt
Review          id, modelId FK, authorName, city, rating 1..5, quote, approved bool, createdAt
CurrencyRate    code pk, symbol, rate numeric(12,6), fetchedAt
IdempotencyKey  key pk, scope, userId?, resultHash, createdAt
```

Indexes: `Order.status+createdAt`, `Cart.anonToken`, `CartItem.cartId`, `Order.paymentIntentId` unique-if-present, `Configuration.fingerprint` unique, `Appointment.boutiqueId+slotAt` (skip taken slots), `Newsletter.email` unique. Migrations via `prisma migrate`; seeds: 4 catalog models, full option catalog, 4 boutiques (Geneva/Dubai/Cairo/Riyadh), demo reviews, currency rates.

---

## 6. API SURFACE (REST route handlers, JSON, Zod-validated)

```
POST /api/auth/register | login | logout | refresh        GET /api/auth/me
GET  /api/catalog/models            — published models (locale from Accept-Language/header)
GET  /api/catalog/models/:slug      — model + allowed options + prices (locale-aware)
GET  /api/catalog/options?model=    — grouped options
POST /api/quote                     — {modelId, metalId, dialId, bezelId, braceletId} → server-recomputed price (never trust client)
GET/POST/PATCH/DELETE /api/cart(/items)  — anon via httpOnly anonToken cookie, or user cart merge on login
POST /api/checkout/session          — create Order(DRAFT)+Stripe PaymentIntent (or DEMO intent); idempotency key header
POST /api/checkout/confirm          — verify status, enqueue emails (idempotent)
POST /api/webhooks/stripe           — signature-verified; drive OrderEvent timeline
GET  /api/orders        /api/orders/:number?emailToken=
POST /api/newsletter                GET /api/newsletter/confirm?token    POST /api/newsletter/unsub
POST /api/appointments              GET /api/appointments/mine           GET /api/boutiques
POST /api/waitlist  POST /api/reviews   GET /api/rates  GET /api/health
Admin (role-gated): /api/admin/models|options|prices CRUD, /api/admin/orders (list/patch status),
/api/admin/appointments, /api/admin/stats (revenue, funnel, config popularity)
```

---

## 7. THE 3D ENGINE (soul of the product — REPLICATE exactly)

Client-only engine in `src/lib/three/` (a `WatchEngine` class ~600 lines, dynamic `import()` inside `useEffect`):

1. **Renderer**: canvas fixed behind content (`z-index:2; pointer-events:none`), alpha, ACES filmic, sRGB, DPR clamp (2.0 desktop / 1.75 mobile), soft shadows desktop-only, `powerPreference:'high-performance'`; rAF loop paused on `visibilitychange` and when canvas fully out of viewport (IntersectionObserver).
2. **Studio environment**: PMREM from a synthetic scene — black sphere + 5 emissive planes (overhead key softbox 7× strength, warm gold strip left, cool strip right, front fill, faint back spill) → `scene.environment`.
3. **Lights**: spotlight key (castShadow), gold rim directional, cool fill, low ambient; `ShadowMaterial` floor desktop-only.
4. **Atmosphere**: additive gold-dust point cloud (radial sprite texture, drift+wrap, ~340/`130` mobile), 3 additive glow sprites (fake bloom), chapter-flash sprite used in model swaps.
5. **ProcWatch construction (story of parts)**: case lathe profile + rehaut; 4 lugs (rounded boxes); crown (cylinder + cap + 20 instanced knurl boxes) + crown guards for dive model; separate caseback; bezel groups — DIVE/TACHY ceramic lathe + **canvas-texture insert** (dive: triangle+lume pip+0–50 numerals; tachy: true tachymeter scale `a=(3600/v)/60·2π` + arc text; GMT: two-half merged arc + 24h scale; FLUTED: lathe displaced by 60-fold radial wave via vertex shader-less CPU displacement) + metal base; dial **canvas texture 1024²**: sunburst 540-stroke brushing, 60-min track, spaced brand text, date window (real today) under cyclops, panda subdial ring sockets; applied indices rotated per hour + lume dots; Mercedes hour hand (stem+ring+3 segments+lume), leaf minute, alternating second with counterweight; GMT arrow hand; **crystal** domed lathe + separate cyclops; **bracelet** from `InstancedMesh` arcs: 3-column Oyster / 5-column Jubilee around wrist axis, tapering + scoping; **movement**: plate + 3 extruded gear shapes (rotating speeds) + ruby jewels + oscillating balance (+sin 9t) + half-disc rotor; everything belongs to one of 11 named explode "parts" (`case, back, bezel, dial, movement, hour, min, sec, gmt, braceTop, braceBot`) with saved offsets.
6. **Interactions**: pointer drag on hero `#dragZone` (round zone covering watch) with velocity/inertia, 2-pointer pinch zoom mapped to camera Z (clamped −1.3..+1.7), mouse parallax applied to rig position + hold rotation, auto-spin target varies per scroll pose.
7. **Scroll choreography (ScrollTrigger)**: hero title parallax-out; `#story` master scrub timeline: rotY -0.55→6.28, explodeKey 0→1→0 with camera Z breathing (6.6→4.45→6.4), rail-dot follows progress; per-section poses (collection wX -1.5 / configurator +1.5 desktop; mobile: wY +1.0 watch above panel, scale 0.6); `.rv` batch reveals; line-mask headline YPercent 115→0; counters (31 jewels / 70 h / ±2 s (display uses ±2) / 300 m) count-up on enter; footer dims global canvas opacity to 0.16; legacy `view` state machine reproduced.
8. **Live configuration patching**: updating dial→rebuild dial texture + flash; bezel→swap insert mesh + tint ceramic; metal→rebuild the 6 metal-role materials and hot-swap by `userData.role`; bracelet→rebuild strap groups; disposal always (traverse, dispose geo/mat/map) — no leaks; model swap = cinematic out (scale 0.6 + drop 2.4) → in (from 0.6/drop -2.4 + bezel spin 2.4 + flash pulse), queue-conflated via `pendingSwap`.
9. **Hands tell real time**: hour/min/sec from `Date`, GMT from UTC, chrono sub hand = seconds; runway update in `useEffect` inside rAF.
10. **Fallbacks**: `!WebGL || !THREE` → static inline SVG watch skeleton (`#fallbackArt`) + `no-webgl` class; no GSAP → `no-anim` (all states visible, css transitions only); no-JS → `noscript` bar.

*Performance budget:* first paint < 1.5 s (3D lazy after first scroll or 2.5 s), interaction < 100 ms, INP < 200, LCP < 2.5 4G mobile. All major pure functions (pricing, texture builders) unit-testable.

---

## 8. UI SHELL & STATIC STRUCTURE

- Skip link → `#collection`. Preloader: crown SVG + progress ring (0→caption 88 % ramp, driver `fonts.ready` race 2.5 s cap → reveal), reveal animates watch intro (scale 0.001→1 + y -0.55→0, headline line-masks stagger).
- Header: brand (crown SVG + wordmark), links [Collection, Configurator, Craft, Boutiques], tools: theme toggle, language toggle (`العربية`/`EN`), currency select, cart (badge), burger; `scrolled` glass condensation at 40 px. Mobile menu overlay with index numbers `01…04` + tools.
- Sections: hero (eyebrow, sub, model chip name + from price, scroll cue, drag zone), story (4 callouts alternating sides with numbered eyebrows `01 —`, vertical rail w/ dot), collection (`Grid 2×2 max-width 56 % beside watch on desktop, stacked mobile` cards: mini CSS watch (pure CSS sweep hands via CSS variables updated 1 Hz), REF, name, spec line, price, [Discover] + [+ add]), configurator (glass panel w/ big CSS mini watch, 4 chip groups w/ swatches, total price, [Add to bag], meta REF/name; stage right where the 3D watch floats), craft (counter row + 3 editorial rows), testimonies (3 glass cards ★★★★★ + quote + name-city), boutiques (4 grid cards + [Book an appointment]), newsletter (split, underline input + subscribe), footer (4 cols, disclaimer, © 2026 AURELIA · Made with three & GSAP), cart drawer (rows: mini watch + name + options + price + qty stepper ±, remove; footer total + note + [Proceed to checkout]), checkout modal (NO raw card fields — see §10), toast.
- All t-values via `next-intl` message catalog `en.json`/`ar.json` seeded from the legacy dictionary and extended for every new element (no hardcoded strings anywhere).

---

## 9. FEATURES — EXHAUSTIVE MASTER LIST

### Tier A — REPLICATE 1:1 from legacy POC (functional parity)
A1 Procedural 3D watch (§7) with 4 fictional references and model morphing
A2 Drag / pinch / parallax, auto-spin, clipping-safe transparency layering
A3 Scroll story with exploded anatomy (4 chapter callouts + rail)
A4 Collection cards w/ live CSS mini watches and active state; click → 3D swap
A5 Configurator (metal/dial/bezel/bracelet) live patching + composition pricing
A6 Cart (dedup by config key, qty 1–9, remove, persist, badge, drawer, RTL mirror)
A7 Demo mode checkout modal (see §10 for the real pipeline & demo UX)
A8 i18n EN/AR incl. RTL parity everywhere
A9 Currency switch USD/EGP/AED/SAR (server-authoritative formatting & rates)
A10 Dark/light theme incl. atmosphere dimming
A11 Preloader/intro reveal; no-JS/no-webgl/no-gsap graceful degradation
A12 Elegant editorial sections: craft (counters + 3 rows), testimonies, boutiques, newsletter, footer (incl. trademark disclaimer)
A13 Custom cursor, magnetic buttons, toasts, smooth inertia scroll (desktop only; maps native scroll under reduced motion / touch)
A14 Skip-link, focus-visible, dialog semantics, Esc handling, `aria-expanded`/`aria-hidden`
A15 Global error surface: `window.AURELIA = {state, three(), watch(), errors()}` for QA

### Tier B — existed as placeholders → make REAL
B1 Newsletter: persist e-mail (Zod-validated), double opt-in emails, unsub page + rate-limit
B2 Boutique booking: slot picker → `Appointment` + confirmation email(s) + admin visibility
B3 Legal pages (privacy/terms/cookies MDX, locale-aware), footer links stop being toasts
B4 Services pages: servicing/restoration, engraving atelier (with C5), valuation landing
B5 Live FX rates: nightly job → `CurrencyRate` (fallback static table)
B6 SEO pack: metadata API (OG/Twitter per route, canonical), JSON-LD (Organization, Product w/ offers, FAQ, BreadcrumbList), dynamic OG images, favicon set, `manifest`, robots, sitemap
B7 Real payments pipeline (Stripe elements + webhook + demo mode)
B8 Accounts: register/login/profile/change password/addresses (auth guard routes)

### Tier C — strategic enhancements (make it stand out)
C1 Saved builds: persist any configuration to account; share via `Configuration.fingerprint` URL + share-sheet with OG preview
C2 Wishlist + low-stock/availability waitlist ("Notify me when allocated")
C3 AR try-on: WebXR / `model-viewer` quick-view on mobile case (low-poly export path of same data model); QR deep link from boutique cards
C4 AI concierge chat: LLM assistant (keyed to catalog API) that recommends model/config by wrist-size, budget, style, occasion and deep-links into configurator; streaming, localized EN/AR
C5 Engraving atelier: optional caseback engraving text (≤ 20 chars, Zod-validated) → **3D caseback canvas-texture preview** in configurator + surcharge line item
C6 Live availability: badge per model ("Ships in 2 weeks" / "Allocate list only") fed from `Inventory`
C7 Order timeline: PAID → CONFIRMED → IN_ATELIER → SHIPPED → DELIVERED, emails per step + account tracking UI; demo clock to simulate progression
C8 Admin dashboard (role CUSTOMER/CONCIERGE/ADMIN): KPI cards (revenue, conversion, top configs), order table + status editor, catalog CRUD incl. price-delta editor + live preview (reuses engine in a small canvas), appointments calendar, newsletter export CSV, reviews moderation
C9 Analytics: PostHog (or Plausible-style first-party) — events: story_complete, config_change(option), add_to_bag, begin_checkout, purchase; funnel + retention; cookie-consent-gated
C10 PWA: offline shell (service worker precache + stale-while-revalidate for catalog), installable, `theme-color` per locale
C11 Rotation-safe mobile engine (`matchMedia` re-evaluated on resize, not freeze-frame), plus WebGL context-lost handler → recover or throw to fallback art
C12 Currency/locale auto-detect on first visit (`Intl.DateTimeFormat().resolvedOptions()` + `Accept-Language`) then user overridable and persisted
C13 Anti-fraud & abuse hygiene: Stripe webhook signature mandatory, Zod on everything, Upstash-style sliding-window rate limits on auth/checkout/appointments/newsletter, admin audit log

---

## 10. CHECKOUT & PAYMENTS SPEC

- Cart persists as `Cart` for user OR anon token cookie; converting to `Order(DRAFT)` at `/api/checkout/session` with **idempotency key**; Stripe PaymentIntent in server-side currency, `payment_status` reconciled exclusively via webhook; server recomputes every price (client shows estimate only).
- UX: `/checkout` steps summary (items with config chips) → contact/shipping (address book autofill) → payment (Stripe Payment Element) → `/order/[number]` success with confetti-free elegant reveal, order number, expected allocation note.
- **DEMO_MODE=1 default in sandbox:** payment step renders a "Simulated payment" panel (Test card button + make-believe 3-2-1 processing), fields accept only syntactic card-mock placeholders and are never stored or sent anywhere besides the intent stub; a banner states clearly "Simulation mode — no money is moved". Legacy raw-card-input UX is explicitly **forbidden**.
- Post-purchase: order confirmation email (React Email: order summary, timeline link), shipping confirmation template; `OrderEvent` row per transition.

---

## 11. REPO LAYOUT

```
aurelia/
  app/                       # Next.js App Router
    [locale]/ ... routes (dir, layout), api/* handlers, og/, sitemap.ts, robots.ts, manifest.ts
  src/
    components/  shell/ (Header, MobileMenu, Footer, CartDrawer, Toast, Cursor)
              sections/ (Hero, Story, Collection, Configurator, Craft, Testimonies, Boutiques, Newsletter)
              ui/ (Btn, Chip, Glass, Counter, MiniWatch, Dialog, Price, LineMask, Rating)
    lib/three/   engine.ts, materials.ts, textures.ts, geometry.ts, poses.ts, choreography.ts, dispose.ts
    lib/  money.ts (server-only rates), fingerprint.ts, validation/*.zod.ts, auth.ts, email.tsx, rates.ts
    stores/      cart.ts, prefs.ts (zustand; hydration-safe)
    i18n/        en.json, ar.json, request.ts
    server/      db/ (prisma schema+seed), services/ (catalog, pricing, orders, appointments)
    styles/      tokens.css, base.css, components.css
  messages/ en.json ar.json
  public/ (icons, og/, sw.js)
  tests/ unit/ e2e/
  legacy/index.html   ← original single-file POC preserved as design reference
```

---

## 12. ADMIN DASHBOARD

`/admin` guarded by Next middleware + server-side role check (ADMIN/CONCIERGE). Tailwind admin theme on same tokens. Pages: Overview (7-day revenue, AOV, session→add-to-cart→checkout funnel, top configs, live waitlist counts), Orders (filter by status, detail drawer w/ timeline, status editor → creates `OrderEvent` + enqueues email), Catalog (model CRUD + option CRUD + per-model deltas + drag sort + `published` toggle), Boutiques & Appointments (calendar list + status), Marketing (newsletter list, CSV export, waitlist), Reviews (approve/deny). All mutations server-validated; audit `console.info('[admin]', actor, action, id)`.

---

## 13. BUILD ROADMAP (execute in order; each milestone must leave `npm run build` green)

- **M0** Scaffold (Next 15 + TS + Tailwind v4 + Prisma + Docker Postgres + ESLint + CI). Env: `DATABASE_URL, AUTH_SECRET, STRIPE_SECRET_KEY?, STRIPE_WEBHOOK_SECRET?, RESEND_API_KEY?, DEMO_MODE=1, NEXT_PUBLIC_SITE_URL` (+ `.env.example`).
- **M1** Design tokens + shell (header, footer, cursor, toast, drawers frame) + design-system components + i18n skeleton (EN/AR dictionaries + locale routing + RTL direction logic + lang button).
- **M2** Static sections port (collection cards, configurator panel, craft counters, testimonies, boutiques, newsletter visual) with mini-watch CSS component.
- **M3** **3D engine port** (§7) — this is the critical path; port module-by-module from `legacy/index.html` behaviors; wire story ScrollTrigger + poses; verify drag/pinch/parallax and swap flash; establish dispose tests (no leaks after 50 swaps/patches).
- **M4** Cart + prefs stores, currency formatting pipeline, theme, drawer flows; A/A16 checklist pass.
- **M5** Database + seed models/options/boutiques/rates + `/api/catalog/*` + quote endpoint with server-side recomputation (unit tests).
- **M6** Auth (register/login/logout/refresh/me, OAuth optional, session cookie, middleware guards) + account shell + addresses.
- **M7** Checkout: cart → order draft → Stripe (or demo) → webhook → confirm → order detail; emails via Resend templates (test recipient smoke).
- **M8** Newsletter (double opt-in flow + trap page) + Boutiques (booking slots + tz math + mailbox confirmations) + Waitlist + Reviews (submit → moderate).
- **M9** Admin dashboard (§12) incl. catalog CRUD wired to the real DB.
- **M10** Tier C wave in order: C5 engraving, C1 share links + OG image, C2 wishlist/waitlist UI, C6 inventory signals, C4 AI concierge (OpenAI/Anthropic-keyed behind an env flag, streaming, 3-tool abstractions to catalog/quote), C3 AR quick view, C9 analytics events, C10 PWA.
- **M11** Hardening: CSP (nonce + strict-dynamic; `frame-ancestors 'none'`), HSTS, X-Content-Type-Options, SRI-free by design (npm-bundled deps), CSRF strategy (SameSite + origin check for mutations), rate-limits, zod everywhere, helmet-style headers; error boundaries + retry-able fetch + skeleton states; Playwright suite (scroll story, mirroring when switching to `ar`, config patch persistence, guest cart → checkout happy path in demo mode, admin auth guard).
- **M12** Perf/SEO sweep: bundle analysis (three in a single async chunk < 350 kB gzip), LazyWatch based on `IntersectionObserver`, image strategy (SVG-first, `next/font` subsetting), Lighthouse mobile ≥ 90 / a11y ≥ 95, JSON-LD validation, `sitemap`, print stylesheet.

**Definition of Done (whole build):** every Tier A feature pixel- and motion-equivalent to legacy (can be side-by-side compared), B and C features functional at their stated level, `npm run dev/postgres seed/build/test` all green, zero console errors on full journey (including GTM-free), README with architecture diagram + setup + demo credentials (concierge@aurelia.test / admin@aurelia.test, seeded), `.env.example`, and legacy file untouched at `legacy/index.html`.
