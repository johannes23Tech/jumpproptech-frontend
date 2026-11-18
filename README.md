# Jump PropTech

Jump PropTech is the internal, mobile-first property-management PWA for JUMP Living's company-owned rental portfolio in South Africa. It is built with React, TypeScript, Vite, Tailwind CSS, and Lucide icons, and is deployed to Vercel.

The app opens on a white animated JUMP PROPTECH logo reveal and then routes straight to staff or tenant sign-in. The earlier public marketplace, onboarding, landlord/agency self-registration and subscription-paywall screens have been removed from the app. Their dormant source files are retained but are no longer routed or bundled.

## Run locally

```bash
npm install
npm run dev
npm run build
```

The local Vite server proxies `/api` to the Jump PropTech API. Production uses the configured API host. The default entry point is secure staff/tenant sign-in; signed-in tenants go to the tenant portal and staff go to the management dashboard. Unit QR links open the public application page at `/apply/:token`; these links are created by staff in the Units screen and are unrelated to the retired marketplace.

## App structure

- `src/App.tsx` — route table, including the public `/apply/:token` onboarding page and the protected `/manage` dashboard.
- `src/pages/Onboarding.tsx` — public, unit-scoped QR application form.
- `src/pages/Applications.tsx` — staff review and approval of onboarding applications.
- `src/pages/Units.tsx` — unit register, building selection, prepaid meter, archiving and QR generation/revocation.
- `src/theme.css` — shared luxury black-and-gold design tokens.
- `src/components/AnimatedAuthBackground.tsx` and `animated-auth-background.css` — reusable login/sign-up-only wave backdrop and motion.
- `public/icons/icon-512.png` — supplied Jump JL logo used in the intro, reveal, and account screens.
- `src/marketplace/*` — dormant marketplace source retained for history only; not routed or bundled.

## Design and content

The luxury black-and-gold palette lives in `src/theme.css`; component-specific responsive styles live in `src/marketplace/marketplace.css`. Update sample content in `src/marketplace/data.ts`. The muted text token is slightly lighter than the original brief's value to preserve readable contrast on dark surfaces.

Login and sign-up share `src/components/AnimatedAuthBackground.tsx`. To use the supplied wave artwork, add or replace `public/login-bg.jpg`; until then, the component's CSS gold-wave treatment remains visible. Change `--auth-animation-duration` in `src/components/animated-auth-background.css` to adjust the 8-second drift, shimmer, and particle loop. The background respects `prefers-reduced-motion` and appears only on login/sign-up, not after authentication. Property photography is illustrative Unsplash content; the image host is allowed by `vercel.json` CSP.

The prototype marks sample listings, agents, ratings, messages, booking requests, and plans as illustrative. Favourites, listing drafts, and landlord/agency registration drafts persist locally. No payment is taken and demo chats, reports, and viewing requests are not sent externally. Google and Apple buttons are disabled because no identity providers are configured. Public registration creates tenant accounts only; landlord and agency setup remains a separate local draft until a public business-account endpoint is connected.

## Assumptions

- Initial market: Rustenburg, North West, South Africa.
- Currency: South African rand (ZAR); area: square metres.
- The product is an internal company system, not a public marketplace or landlord SaaS.
- Staff roles are defined in `src/config/roles.ts` and must match the backend permission matrix in `jumpproptech-backend/docs/PERMISSIONS.md`.
