# NUS4STAY Design System

NUS4STAY is a curated accommodation marketplace for discovering hotels and villas, comparing rooms, completing a booking, submitting payment details, and returning to a clear booking history. The interface should feel calm, trustworthy, and considered—more like a guest desk for a well-run stay than a generic travel marketplace.

This document describes the visual language currently implemented in the React app. The primary token source is [`src/index.css`](src/index.css); page-level patterns live in `src/pages/` and shared chrome lives in `src/components/`.

## Design direction

**Calm, curated stay desk.** Use deep olive green to establish trust, warm amber to signal discovery and value, and generous light surfaces to keep booking tasks easy to scan. Photography should carry the sense of place; UI decoration should stay quiet and supportive.

The signature combination is:

- Editorial Playfair Display headlines for a sense of place and hospitality.
- Inter for practical booking information, labels, prices, and actions.
- Full-bleed destination imagery paired with dark olive overlays in hero moments.
- Softly rounded white cards with restrained borders and low, wide shadows.

Avoid introducing a second visual language for new screens. Admin tools can be denser, but they still use the same color, type, shape, and interaction tokens.

## Product and app context

### Primary audiences

| Audience | Need | Core experience |
| --- | --- | --- |
| Guest | Find a suitable stay and book with confidence | Discover → Search → Property → Room → Checkout → Payment → Booking history |
| Admin | Keep properties and rooms accurate | Admin navigation → Property list → Search/filter → Create or edit property → Manage rooms |
| Manager | Monitor performance and reporting | Planned role; use the same system with denser data views |

### Current application areas

- **Discover:** Hero search, featured stays, destinations, and curated property cards.
- **Search:** Search by location or region, filter by price/rating/amenities, and scan result cards.
- **Property detail:** Gallery, location, description, amenities, room options, rating, and booking summary.
- **Room detail:** Room-specific information and a booking hand-off.
- **Checkout:** Guest information, payment method selection, stay summary, and total price.
- **Pending payment:** Payment instructions, booking details, and next-step actions.
- **Booking history:** Status-led list of a guest’s bookings with payment or detail actions.
- **Booking detail:** Booking information, guest information, invoice summary, and PDF invoice action.
- **Login / register:** Secure account access with a split visual panel on larger screens.
- **Admin properties:** Searchable property management, image previews, amenities, room types, and active status.

### Roles and access

The current role model is `guest`, `admin`, and `manager`, loaded through Supabase Auth and the `profiles` table. The frontend guards protected routes, while sensitive data access must also be protected by Supabase RLS.

| Role | Design emphasis |
| --- | --- |
| Guest | Confidence, clarity, reassurance, and a short path to booking. |
| Admin | Operational density, clear hierarchy, explicit destructive actions, and fast scanning. |
| Manager | Reporting and analytics clarity; prioritize comparison and trend visibility when these views are added. |

### Route map

| Route | Surface | Access |
| --- | --- | --- |
| `#/` | Discover landing page | Public |
| `#/search` | Search results | Public |
| `#/detail/:id` | Property detail | Public |
| `#/room/:propertyId/:roomId` | Room detail | Public |
| `#/login` | Login and registration | Public |
| `#/checkout/:propertyId/:roomId` | Checkout | Authenticated guest/admin |
| `#/pending/:bookingId` | Pending payment | Authenticated guest |
| `#/history` | Booking history | Authenticated guest |
| `#/history-detail/:bookingId` | Booking detail and invoice | Authenticated guest |
| `#/admin/properties` | Property management | Authenticated admin |

## Color palette

Use semantic tokens such as `bg-primary`, `text-on-surface`, and `border-outline-variant` in the UI. Avoid adding one-off hex values unless a visual treatment truly needs an overlay or status-specific tint.

### Core palette

| Token | Hex | Name | Use |
| --- | --- | --- | --- |
| `primary` | `#344E2B` | Deep olive | Main actions, headings, links, active states, brand emphasis |
| `primary-container` | `#46693B` | Forest olive | Hover state and stronger green surfaces |
| `primary-fixed` | `#D4E7D0` | Soft leaf | Selected states, tags, reassurance panels, subtle highlights |
| `on-primary` | `#FFFFFF` | White | Text and icons on primary surfaces |
| `tertiary` | `#D97706` | Amber gold | Ratings, discovery accents, eyebrows, and important highlights |
| `tertiary-container` | `#FEF3C7` | Warm cream | Amber status backgrounds and low-emphasis highlights |
| `background` | `#FAFBF9` | Olive-tinted off-white | Page background and overall canvas |
| `surface` | `#FFFFFF` | Clean white | Cards, forms, modals, and elevated content |
| `surface-container-low` | `#FAFBF9` | Quiet surface | Secondary panels and gentle grouping |
| `surface-container` | `#F1F3F0` | Soft gray-green | Navigation wells and neutral control backgrounds |
| `surface-container-high` | `#E5E7E2` | Pale outline | Stronger separators, disabled/neutral surfaces |
| `on-background` / `on-surface` | `#171C15` | Ink | Primary readable text |
| `on-surface-variant` | `#464A43` | Slate olive | Supporting copy, metadata, helper text |
| `outline` | `#727970` | Muted outline | Placeholder text and low-emphasis controls |
| `outline-variant` | `#E5E7E2` | Hairline border | Card borders, dividers, and field borders |

### Semantic status colors

Use status colors as compact badges or message containers; do not use them as large decorative blocks.

| Status | Background | Text | Meaning |
| --- | --- | --- | --- |
| Success / confirmed | `#EAF2E8` | `#34662B` | Booking or payment is complete |
| Pending / waiting | `#FDF6E2` | `#B2700D` | A guest or admin action is still needed |
| Error / cancelled | `#FDF0EE` | `#C53F3F` | A booking or action needs attention |
| Error container | `#FFDAD6` | `#93000A` | Form errors and destructive feedback |

### Contrast and usage rules

- Keep body text on `background`, `surface`, or `surface-container-low`; use `on-surface-variant` for secondary text only.
- Use `primary` with `on-primary` for the strongest call to action.
- Amber is an accent, not a second primary. Reserve it for ratings, discovery labels, and moments that need warmth.
- Do not place long text over photography without a dark olive overlay.
- Pair every color-only status with a text label or icon.

## Typography

### Font families

| Role | Font | Fallback | Use |
| --- | --- | --- | --- |
| Display / headlines | `Playfair Display` | `Georgia, serif` | Page titles, section headings, property names, invoice title, price emphasis |
| Body / interface | `Inter` | `system-ui, sans-serif` | Paragraphs, labels, form fields, navigation, buttons, metadata |
| Icons | `Material Symbols Outlined` | — | Navigation, actions, status, amenity, and payment icons |
| IDs / codes | `font-mono` | System monospace | Booking IDs and machine-readable references only |

### Type scale

The class names below are available in `src/index.css` and should be preferred over arbitrary text sizes.

| Style | Size / line height | Weight | Typical use |
| --- | --- | --- | --- |
| `font-headline-xl` | `48 / 56px` | `700` | Hero and primary page titles |
| `font-headline-xl-mobile` | `32 / 40px` | `700` | Mobile primary titles |
| `font-headline-lg` | `32 / 40px` | `600` | Major section headings |
| `font-headline-md` | `24 / 32px` | `600` | Card and subsection headings |
| `font-body-lg` | `18 / 28px` | `400` | Introductory or descriptive copy |
| `font-body-md` | `16 / 24px` | `400` | Default body copy and navigation content |
| `font-label-md` | `14 / 20px` | `600` | Buttons, labels, tabs, and compact metadata; `0.05em` tracking |
| `font-price-display` | `20 / 24px` | `700` | Nightly rates and booking totals |

Typography rules:

- Use sentence case for headings and actions. Reserve uppercase for small eyebrows, metadata, and category labels.
- Keep headings in Playfair Display, but do not use it for long paragraphs or dense data.
- Use bold weight to establish hierarchy before increasing font size.
- Prices should be easy to find, but never visually overpower the property name and stay details.
- Keep interface copy direct and guest-facing: “Book now”, “View booking”, “Upload payment proof”, and “Manage properties”.

## Layout and spacing

| Token | Value | Use |
| --- | --- | --- |
| `container-max` | `1280px` | Maximum content width |
| `margin-desktop` | `64px` | Desktop page-shell side space |
| `margin-mobile` | `20px` | Mobile page-shell side space |
| `gutter` | `24px` | Grid and footer column gutter |
| `card-gap` | `24px` | Gap between cards or primary columns |
| `section-gap` | `80px` | Major landing-page section rhythm |

Layout principles:

- Use `.page-shell` for page-level alignment. It resolves to `calc(100% - 40px)` on small screens and `calc(100% - 80px)` from the `md` breakpoint upward, capped at `1280px`.
- Build pages around one clear primary action. Search and checkout should feel task-oriented; discovery and detail pages can breathe more.
- Use responsive stacking before shrinking content. Property cards, checkout columns, and admin records should become single-column flows on narrow screens.
- Keep important content above the fold where practical: property name, location, primary image, price, and next action.

## Shape, borders, and elevation

### Radius scale

| Token | Value | Use |
| --- | --- | --- |
| `DEFAULT` | `4px` | Small controls and compact elements |
| `lg` | `8px` | Inputs, small cards, secondary buttons |
| `xl` | `12px` | Primary cards, image frames, navigation controls |
| `2xl` | `16px` | Booking panels, summary cards, form groups |
| `3xl` | `24px` | Admin surfaces, auth shell, large feature containers |
| `full` | `9999px` | Pills, status badges, segmented navigation |

Use larger radii for larger containers and meaningful grouping. Avoid mixing several radii inside a single small component unless the nested control clearly needs its own affordance.

### Borders and shadows

- Default borders use `outline-variant` at low opacity (`/30`–`/60`) to separate surfaces without making the UI feel boxed in.
- `shadow-level-1` is the default card elevation: `0 8px 28px rgba(23, 28, 21, 0.055)`.
- `shadow-level-2` is reserved for hover or stronger emphasis: `0 18px 50px rgba(23, 28, 21, 0.11)`.
- Use glass treatment only for persistent chrome such as the sticky navbar or a deliberate overlay: translucent white, `12px` blur, and a subtle white border.

## Component patterns

### Navigation

- The navbar is sticky, translucent, and lightly elevated.
- Desktop navigation uses a rounded segmented container with a white active pill.
- Mobile navigation becomes a three-column secondary row below the header.
- Primary account actions stay on the right. Admin access is visible only to admins and uses a low-emphasis green-tint button.

### Hero and discovery

- Use a strong destination image with a dark olive gradient for legibility.
- Place a short eyebrow above the headline, then one clear value proposition and the search module.
- Search controls should read as one unit, even when they contain location, dates, guests, and a submit action.
- Featured property cards should combine image, property identity, location, rating, price, and a clear detail/book action.

### Property and room cards

- Let photography lead. Use `object-cover`, consistent aspect ratios, and a restrained hover scale.
- Keep location and amenities secondary to the property name and price.
- Use amber for rating indicators; use primary green for actions and positive affordances.
- A card should have one dominant action. Secondary actions use an outlined treatment.

### Forms and checkout

- Labels sit above fields and use `font-label-md` or a compact Inter equivalent.
- Inputs use white surfaces, `outline-variant` borders, rounded corners, and a primary focus ring.
- Group checkout into clear sections: guest details, payment method, and booking summary.
- Payment choices are selectable cards; selected state is a primary border with a light primary-fixed background.
- Always show the total, currency, and relevant stay dates near the final action.

### Status and feedback

- Use rounded pill badges for booking status in history and detail views.
- Loading states are centered, quiet, and use `on-surface-variant` rather than a loud spinner treatment.
- Empty states should explain what is missing and provide the next action, such as “Start exploring properties”.
- Errors use the error container palette and state what happened in plain language.

### Admin surfaces

- Admin pages may use denser grids and larger information surfaces, but preserve the same 1280px page shell and semantic colors.
- Use a small uppercase “Admin Console” eyebrow, a Playfair Display page title, and a prominent create action.
- Destructive actions use the error container treatment and should be visually distinct from edit or view actions.
- Property records should prioritize image, name, location, active state, room count, and edit/delete actions.

## Interaction and accessibility

- Use visible `:focus-visible` outlines: `2px` primary outline with a `3px` offset.
- Preserve keyboard access for links, buttons, inputs, tabs, modal controls, and image-based actions.
- Every meaningful image needs useful alt text. Decorative logos and icons should use an empty alt or `aria-hidden`.
- Respect `prefers-reduced-motion: reduce`; the existing stylesheet removes animation and transition duration for users who request it.
- Hover motion is subtle: card lift is about `3px`, image zoom is slow and restrained, and buttons should not shift layout.
- Never communicate a booking or payment state by color alone.
- Keep touch targets around `40px` or larger; the main submit and booking actions should be at least `44px` tall.

## Content and language

The current product uses a mix of English and Indonesian. Keep terminology stable within each flow and prefer the language already used by neighboring controls. If a screen is localized, localize the complete task—not only the heading.

Preferred tone:

- Warm, concise, and practical.
- Guest-facing rather than technical.
- Active verbs: “Search stays”, “Choose room”, “Continue to payment”, “View booking”.
- Clear states: “Waiting for payment”, “Booking confirmed”, “No bookings found”.
- Avoid vague system language such as “Submit”, “Process”, or “Something went wrong” without context.

## Assets and implementation notes

- Brand assets are in `public/`: `logo_nus4stay.svg`, `favicon_nus4stay.svg`, and `icons.svg`.
- The login page uses `src/assets/hero.png` as its supporting visual.
- Icons use Google Material Symbols Outlined via the `.material-symbols-outlined` and `.icon-pro` classes.
- The app currently uses hash-based routing and Supabase Auth/profile data. Property management is wired to Supabase; booking persistence currently includes local storage behavior in `src/services/db.js`, so payment and booking status UI should be treated as a frontend flow until backend payment verification is complete.
- When adding a new token, define it in `src/index.css` under `@theme` and use its semantic class throughout the app.

## Quick checklist for new screens

- Does the screen have one obvious primary task?
- Are Playfair Display, Inter, and Material Symbols assigned to the right roles?
- Are colors semantic and drawn from the palette above?
- Does spacing align to the page shell and 24px card rhythm?
- Are states present for loading, empty, error, and success where relevant?
- Is the mobile layout a deliberate stacked flow rather than a compressed desktop layout?
- Are focus, reduced motion, contrast, and non-color status cues handled?
