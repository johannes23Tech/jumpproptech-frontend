# Jump PropTech marketplace UX

## Product assumptions

- Primary launch market: Cape Town, South Africa; listings show ZAR and South African place names.
- This is a marketplace discovery experience alongside the existing property-management product.
- Sample listings, agents, ratings, verification badges, prices, bookings, and chat are clearly illustrative. They are not live inventory or endorsements.
- Property discovery, favourites, viewing requests, and listing drafts work locally in the prototype. Authentication and registration use the existing API; there is no social-auth provider configured.
- The main marketplace navigation has four destinations: Home, My Properties, Messages, More.

## Research synthesis

| Pain point | Product response |
|---|---|
| Fake or stale listings | Show verification state, last-checked date, agent identity, and a report action. Mark this prototype's sample data as illustrative rather than claiming real verification. |
| Unclear total cost | Put the rent/sale price, rent cadence, deposit note, and key fees in the listing summary before contact. |
| Too many filters | Keep one prominent filter entry point; reveal progressively only the useful fields (intent, location, budget, beds, property type). |
| Slow agent contact | Put message and viewing-request actions on both the listing and the details page. Show response-time context. |
| Re-entering listing details | Save search criteria and favourites locally; preserve them between marketplace tabs. |
| Landlord uncertainty about leads | Use a guided listing flow with draft progress, photo prompts, and lead inbox entry points. |

## Strategy

**Core goal:** help people make a confident next move in South African property, from finding a suitable listing to arranging a viewing or publishing an honest listing.

1. **Seeker:** find the right property quickly and understand price, location, and trust signals before contacting anyone.
2. **Landlord:** publish an accurate listing with minimal effort and manage leads from one place.
3. **Agent:** respond to qualified enquiries and coordinate viewings without losing context.

## Personas

- **Nandi, seeker, 29:** moving closer to work in Cape Town. Needs a two-bedroom rental under R18,000. Frustrated by stale listings and unclear deposits.
- **Thabo, landlord, 46:** owns a small portfolio in the Western Cape. Wants a simple way to advertise vacancies and keep enquiries organised.
- **Lerato, agent, 34:** manages rentals and sales across several suburbs. Needs clear lead intent, fast replies, and a lightweight viewing calendar.

## User stories

1. As a seeker, I want to search by suburb and budget so that I can focus on realistic options.
2. As a seeker, I want to filter by intent, bedrooms, and property type so that irrelevant listings disappear.
3. As a seeker, I want to see total price context and key features so that I can compare homes fairly.
4. As a seeker, I want to see who listed a home and its verification status so that I can judge trust before sharing details.
5. As a seeker, I want to save a property so that I can revisit it later.
6. As a seeker, I want to message an agent or request a viewing from the listing so that I can act while interest is high.
7. As a landlord, I want to create a listing in short steps so that publishing does not feel like a long form.
8. As a landlord, I want to see my listing status and enquiries so that I know what needs attention.
9. As an agent, I want one inbox for enquiries so that I can respond without switching tools.
10. As a lister, I want clear plan comparisons so that I can decide whether a paid plan is worthwhile.

## Information architecture

```text
Jump PropTech
├── Home
│   ├── Search / Filters
│   ├── Search results ↔ Map
│   ├── Featured listings
│   └── Property details
│       ├── Gallery / amenities / location
│       ├── Agent / landlord
│       ├── Message
│       ├── Book viewing
│       └── Report listing
├── My Properties
│   ├── Listings / status
│   ├── Create listing (details → photos → review)
│   └── Subscription
├── Messages
│   ├── Conversation list
│   └── Chat
└── More
    ├── Profile
    ├── Favourites
    ├── Viewing bookings
    ├── Settings
    ├── Help & support
    └── Sign in / sign out
```

Bottom navigation uses four labelled tabs: **Home**, **My Properties**, **Messages**, **More**. Favourites and map are contextual destinations, not extra tabs.

## Key flows

- **Onboarding:** Welcome → three benefit slides (optional skip) → one-second Jump logo reveal → sign-in/sign-up. A valid existing session opens Home; signed-out users must authenticate before entering the marketplace.
- **Sign-up / login:** Introduction → logo reveal → sign-in or create a tenant account → validate name, email, password and confirmation → submit to the tenant-only public registration API. Landlord/agency setup remains a separate post-registration local draft because no public business-registration endpoint is connected. Google and Apple buttons are disabled until identity providers are configured.
- **Search and filter:** Home search or one filter button → location, rent/sale, budget, beds, category → apply → results with count and quiet sort link → optionally map.
- **View listing:** Listing card → details → gallery, price and features, trust/context, agent → message or request viewing; report remains available in the overflow area.
- **Contact / viewing:** Details → message composer or date/time request → confirmation state → conversation or bookings.
- **Post a property:** My Properties → post for free → property details → photos → review → save a local draft / demo publish → listing status and enquiries. The prototype never claims a live listing was published.
- **Landlord / agency setup:** Create a standard Jump account → select “Create landlord / agency account” → choose Landlord or Agency → enter business contact details → save a clearly labelled local draft. Account creation is not implied until the server supports self-service landlord registration.
- **Save favourite:** Heart on a card or detail → local saved state → More → Favourites → open or remove.
- **Upgrade:** My Properties or More → Subscription → monthly/yearly toggle and plan comparison → continue → clear prototype checkout state; no payment is taken.

## Low-fidelity wireframes

Legend: `[grey block]` = image/content placeholder; `(...)` = action; `[ ]` = control. These are structure-first sketches; final visual styling is in the running prototype.

```text
01 Splash                    02 Welcome
┌────────────────────┐      ┌────────────────────┐
│                    │      │ Jump               │
│       [JUMP]       │      │ Find your place    │
│    Find. Rent. Own.│      │ [home illustration]│
│      [loading]     │      │    • ○ ○           │
│                    │      │ (Get Started)      │
└────────────────────┘      └────────────────────┘

03 Login / Sign-up            04 Onboarding
┌────────────────────┐       ┌────────────────────┐
│ Welcome back       │       │ [benefit artwork]  │
│ [Email]            │       │ Verified homes     │
│ [Password] [show]  │       │ Supporting copy    │
│ Forgot password    │       │ ○ • ○       Skip   │
│ (Continue)         │       │         (Next)     │
│ Sign up / role     │       └────────────────────┘
└────────────────────┘

05 Home                       06 Profile
┌────────────────────┐       ┌────────────────────┐
│ Hi, Nandi   (bell) │       │ [avatar]           │
│ [Search]      [⚙]  │       │ Name / email       │
│ ○ Residential ...  │       │ Edit profile       │
│ [soft post banner] │       │ My properties      │
│ [Rent] [Sale] Sort │       │ Saved / bookings   │
│ [listing image]    │       │ Payment / help     │
│ R18,500 · 2 bed    │       │ Log out            │
│ Home Properties ...│       └────────────────────┘
└────────────────────┘

07 Settings                   08 Subscription
┌────────────────────┐       ┌────────────────────┐
│ Settings           │       │ Upgrade to Premium │
│ Account            │       │ [Monthly] [Yearly]  │
│ Notifications      │       │ [Free plan]         │
│ Privacy / display  │       │ [Premium Lister]    │
│ Language / units   │       │ [Agent Pro]         │
│ Help / About       │       │ (Continue) Restore  │
│ Log out            │       └────────────────────┘
└────────────────────┘

09 Property details            10 Search results / map
┌────────────────────┐       ┌────────────────────┐
│ [gallery]          │       │ [Search] [Filters]  │
│ Price · location   │       │ Results · Sort     │
│ beds / baths / m²  │       │ [listing] [listing] │
│ amenities / map    │       │ [Map view]         │
│ Agent / verified   │       │ or [map + pins]    │
│ (Book) (Message)   │       │ Home Properties ...│
└────────────────────┘       └────────────────────┘

11 Post property              12 Messages / chat
┌────────────────────┐       ┌────────────────────┐
│ Step 1 of 3        │       │ Inbox              │
│ [intent] [type]    │       │ [agent] message    │
│ [location] [price] │       │ [agent] message    │
│ [Next]             │       │ Chat: bubbles      │
│ Step 2 photos      │       │ [write message]    │
│ Step 3 review      │       │ Home Properties ...│
└────────────────────┘       └────────────────────┘

13 Favourites
┌────────────────────┐
│ Saved properties   │
│ [listing] [heart]  │
│ [listing] [heart]  │
│ Empty: Save a home │
│ Home Properties ...│
└────────────────────┘
```

## Visual system

- **Grid:** 8px base; spacing scale 4, 8, 12, 16, 24, 32, 48.
- **Colour:** luxury black surfaces (`#0A0A0A`, `#141414`, `#1C1C1C`), gold `#D4AF37` (`#F0D77A` highlight, `#8F6B1F` pressed), warm white text, and semantic green/orange/red. Design tokens live in `src/theme.css`; the muted text token is lightened slightly to preserve WCAG AA contrast on dark surfaces.
- **Elevation and icons:** dark-first screens use restrained shadows and reserve icons for wayfinding and meaningful actions rather than decorating every menu row.
- **Responsive account screens:** CSS viewport breakpoints and safe-area insets adapt the intro, login, signup, and landlord forms to phones, tablets, laptops, and desktop displays. Password inputs use mobile-friendly 16px text to avoid automatic iOS zoom.
- **Type:** Inter; 3 weights (400/500/700); body text at least 14px.
- **Shape:** 16px cards, pill chips, soft elevation, 44px minimum interactive controls.
- **Authentication:** Login and sign-up use a shared glass card and `AnimatedAuthBackground`; only those screens display the background animation. Add the provided art at `public/login-bg.jpg`; the CSS gold-wave treatment remains as a fallback. Motion is 8 seconds and is disabled by `prefers-reduced-motion`.
- **Imagery:** bright, natural property photography with consistent crops; every image has alt text. Sample images and their listing metadata are illustrative.
- **Voice:** clear, warm, locally grounded; never imply verification or availability without a real data source.

Reusable UI: buttons, search/filter controls, category chips, segmented intent, listing cards, agent cards, badges, bottom tabs, modal sheets, toasts, skeletons, and empty/error states are implemented in `src/marketplace/`.

## User testing

### Checklist

- Can the participant identify rent/sale intent without guidance?
- Can they find price, suburb, beds, and verification/context on a card?
- Do all controls have labels, visible focus, and comfortable mobile tap targets?
- Can a screen reader distinguish the four navigation destinations and saved state?
- Do error, empty, loading, and confirmation states explain the next action?
- Does any sample-data label accidentally imply a real listing, agent rating, or verification?
- Can the participant back out of filters, a draft, or checkout without losing unrelated work?

### Five moderated tasks

1. Find a two-bedroom rental under **R8,000** in Cape Town and message the agent.
2. Open a listing, check its trust/context details, then request a viewing.
3. Save two homes, open Favourites, and remove one.
4. As a landlord, create a draft listing with photos and inspect it before publishing.
5. Compare monthly and yearly lister plans and explain the cost before continuing.

Record task completion, time to first useful result, wrong turns, trust comprehension, and post-task confidence. Do not collect real identity documents or payment details in prototype testing.
