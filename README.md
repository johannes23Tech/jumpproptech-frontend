# Jump PropTech

Jump PropTech is a mobile-first South African property marketplace and property-management frontend built with React, TypeScript, Vite, Tailwind CSS, and Lucide icons.

## Run locally

```bash
npm install
npm run dev
npm run build
```

The local Vite server proxies `/api` to the Jump PropTech API. Production uses the configured API host. New installs see the introduction, a brief Jump logo reveal, then sign-in or tenant account registration; marketplace access requires an account. Tenant registration uses the existing authentication API. After signup, users can open a separate landlord/agency registration form; it currently saves a local draft because no self-service landlord application endpoint is connected.

## App structure

- `src/marketplace/Marketplace.tsx` — marketplace screens, navigation, local demo actions, and auth entry points.
- `src/marketplace/data.ts` — illustrative Cape Town and Stellenbosch listings and ZAR formatting.
- `src/marketplace/marketplace.css` — reusable marketplace components and responsive layouts for the dark luxury theme.
- `src/theme.css` — shared luxury black-and-gold design tokens.
- `src/components/AnimatedAuthBackground.tsx` and `animated-auth-background.css` — reusable login/sign-up-only wave backdrop and motion.
- `public/icons/icon-512.png` — supplied Jump JL logo used in the intro, reveal, and account screens.
- `src/App.tsx` — public marketplace routes and existing protected management routes. The legacy dashboard is at `/manage`.
- `docs/marketplace-ux.md` — research assumptions, personas, stories, sitemap, flows, low-fidelity wireframes, and user-testing plan.

## Design and content

The luxury black-and-gold palette lives in `src/theme.css`; component-specific responsive styles live in `src/marketplace/marketplace.css`. Update sample content in `src/marketplace/data.ts`. The muted text token is slightly lighter than the original brief's value to preserve readable contrast on dark surfaces.

Login and sign-up share `src/components/AnimatedAuthBackground.tsx`. To use the supplied wave artwork, add or replace `public/login-bg.jpg`; until then, the component's CSS gold-wave treatment remains visible. Change `--auth-animation-duration` in `src/components/animated-auth-background.css` to adjust the 8-second drift, shimmer, and particle loop. The background respects `prefers-reduced-motion` and appears only on login/sign-up, not after authentication. Property photography is illustrative Unsplash content; the image host is allowed by `vercel.json` CSP.

The prototype marks sample listings, agents, ratings, messages, booking requests, and plans as illustrative. Favourites, listing drafts, and landlord/agency registration drafts persist locally. No payment is taken and demo chats, reports, and viewing requests are not sent externally. Google and Apple buttons are disabled because no identity providers are configured. Public registration creates tenant accounts only; landlord and agency setup remains a separate local draft until a public business-account endpoint is connected.

## Assumptions

- Initial market: Cape Town and the Western Cape, South Africa.
- Currency: South African rand (ZAR); area: square metres.
- The marketplace is a public discovery experience alongside the existing authenticated management product.
