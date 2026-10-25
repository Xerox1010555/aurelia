# AURELIA — Next.js Rebuild (M0–M3)

The 3D luxury-watch boutique, rebuilt from the legacy single-file POC (`../legacy/index.html`)
into a typed, componentised Next.js App Router project. This is milestones **M0–M3**: scaffold,
design tokens, shell + i18n, data-driven sections, and the **full procedural 3D engine port**.

## Quick start

```bash
npm install        # already vendored in node_modules
npm run dev        # http://localhost:3000 → redirects to /en
```

| Script               | Purpose                          |
| -------------------- | -------------------------------- |
| `npm run dev`        | Dev server (Turbopack default)   |
| `npm run build`      | Production build (SSG for /en, /ar) |
| `npm start`          | Serve the production build       |
| `npm run typecheck`  | `tsc --noEmit` strict check      |
| `npm run test`       | Vitest unit tests (pricing)      |

## What shipped in M0–M3

- **M0** — Next 15 + React 19 + TypeScript strict scaffold, vitest, Prisma schema scaffolded
  (not installed — activates at M5 with `npm i -D prisma && npm i @prisma/client`,
  set `DATABASE_URL`, then `npx prisma migrate dev`), `.env.example`, `.gitignore`.
- **M1** — Full token design system in `src/app/globals.css` (dark/light themes, RTL,
  reduced-motion), next/font self-hosted Cormorant Garamond + Inter + Cairo,
  custom lightweight i18n (EN/AR dictionaries, route-seeded for perfect hydration).
- **M2** — All sections as components: Hero, Story (560vh anatomy rail), Collection
  (data-driven cards), Configurator (live price animation), Craft (counters), Testimonials,
  Boutiques, Newsletter, Footer; Cart drawer + **simulated** checkout (no card data,
  ever) + toast system; zustand store with `persist` + URL-hash shareable configs
  (`#model=&dial=&bezel=&metal=&bracelet=`).
- **M3** — Complete procedural watch engine port to **three ≥ 0.180**:
  - `src/lib/three/s3.ts` — shared scene singleton (legacy `S3`).
  - `viewState.ts` — scroll pose + shared motion/intro state.
  - `assets.ts` — dial/tachy/dive/GMT canvas textures + PBR material factory.
  - `builder.ts` — geometry helpers, Mercedes hands, instanced bracelets,
    full assembly, explode, cinematic swap, **live config patching** (dial texture /
    bezel insert / metal roles / bracelet rebuild, each with GPU dispose).
  - `engine.ts` — PMREM soft-box studio, key/rim/fill lights, gold-dust points,
    fake-bloom glow sprites, drA rectangle two-pointer input (drag/pinch), ACES tone
    mapping, visibility-aware loop, WebGL context-lost degradation.
  - `choreography.ts` — GSAP ScrollTrigger poses, exploded-view scrub, reveals,
    masked headlines, counters, nav Active state; `disposeChoreography()` for React
    StrictMode safety.
  - `smoothScroll.ts` — inertia wheel scroller (fine-pointer + full-motion only).

## Catalog note (legal guardrail)

All references are **fictional** (Abyss, Corsa, Éclat, Meridian). No real-world
trademarked watch names are used anywhere in this rebuild. The house disclaimer is
rendered in the site footer.

## Intentional deviations from the master blueprint

| Blueprint item                | Status here                                    | Why                                              |
| ----------------------------- | ---------------------------------------------- | ------------------------------------------------ |
| next-intl                     | replaced by `src/lib/i18n/*` (custom, typed)   | zero-risk hydration + smaller dependency surface  |
| Tailwind v4                   | deferred (port-style CSS tokens shipped)       | design parity preserved; adoption is M12 polish   |
| Auth/Stripe/APIs/DB           | absent (M4+)                                   | scope: M0–M3 only; Prisma schema ready            |
| PostHog / PWA / CI            | deferred                                       | Tier-B/C milestones                              |

## Structure

```
aurelia/
  prisma/schema.prisma        # full commerce schema (activates at M5)
  src/
    app/                      # layout, /en /ar pages, globals.css, icon
    components/               # WatchStage, Nav, sections.tsx, overlays.tsx, MiniWatch…
    lib/
      catalog.ts  pricing.ts  store.ts  runtime.ts  smoothScroll.ts
      i18n/ (dictionaries.ts, context.tsx)
      three/ (s3, viewState, assets, builder, engine, choreography)
  tests/unit/pricing.test.ts
```

## Verification status

- `npm run typecheck` — pass (strict).
- `npm run build` — pass (SSG `/en` + `/ar`).
- `npm run test` — pass.
- 3D port renders end-to-end in the browser (studio, swap, explode scrub,
  live configurator patching, RTL).
