<div align="center">
  <img src="./docs/readme/nus4stay-hero.svg" alt="NUS4STAY animated glowing title" width="100%" />

  <p>
    <img src="https://img.shields.io/badge/React-19-111827?style=flat-square&logo=react&logoColor=61DAFB&labelColor=020617" alt="React 19" />
    <img src="https://img.shields.io/badge/Vite-8-111827?style=flat-square&logo=vite&logoColor=FFD62E&labelColor=020617" alt="Vite 8" />
    <img src="https://img.shields.io/badge/Supabase-Postgres-111827?style=flat-square&logo=supabase&logoColor=3ECF8E&labelColor=020617" alt="Supabase" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-4-111827?style=flat-square&logo=tailwindcss&logoColor=38BDF8&labelColor=020617" alt="Tailwind CSS 4" />
    <img src="https://img.shields.io/badge/Oxlint-verified-111827?style=flat-square&logo=oxlint&logoColor=white&labelColor=020617" alt="Oxlint verified" />
  </p>

  <p>
    <strong>Modern accommodation discovery, booking, admin operations, and Supabase-backed access control for NUS stays.</strong>
  </p>
</div>

---

## Overview

**NUS4STAY** is a React and Supabase accommodation platform for browsing destinations, comparing properties, reviewing room details, creating bookings, and managing admin-side property workflows. The app combines a fast Vite frontend with Supabase auth, PostgreSQL data, role-aware routing, booking operations, and supporting documentation for security and RBAC.

## Highlights

- **Search-to-book flow:** landing discovery, search results, property detail, room selection, checkout, pending payment, and booking history.
- **Admin workspace:** property management, booking/payment verification, and role-protected admin navigation.
- **Supabase foundation:** auth-aware client, RLS-oriented schema work, booking RPCs, migrations, and SQL contract tests.
- **Frontend structure:** reusable components, context-driven auth state, service-layer data access, and route metadata.
- **Verification stack:** Vite build pipeline plus Oxlint for fast static checks.

## Tech Stack

| Layer | Tools |
| --- | --- |
| Interface | React 19, Vite 8, Tailwind CSS 4 |
| Data and auth | Supabase JS, PostgreSQL, RLS-oriented migrations |
| Routing and state | React components, auth context, protected routes, role guards |
| Quality | Oxlint, SQL contract tests, project documentation |

## Repository Map

```text
NUS4STAY/
|-- docs/                       # Architecture, design, RBAC, RPC, and security notes
|-- public/                     # App icons and brand assets
|-- src/
|   |-- assets/                 # Local app imagery
|   |-- components/             # Navbar, footer, guards, booking modal, ratings
|   |-- contexts/               # Auth context and shared auth hook
|   |-- lib/                    # Supabase client setup
|   |-- pages/                  # User, booking, auth, and admin screens
|   |-- routes/                 # Route metadata helpers
|   |-- services/               # Public and admin data services
|   |-- utils/                  # Pricing helpers
|   `-- main.jsx                # React entry point
|-- supabase/
|   |-- migrations/             # Database schema and booking workflow migrations
|   |-- tests/                  # SQL contract tests
|   `-- config.toml             # Supabase local configuration
|-- package.json
`-- vite.config.js
```

## Local Setup

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm run build
npm run lint
npm run preview
```

## Project Notes

- Supabase environment values are expected through Vite variables such as `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Admin behavior depends on authenticated user roles and matching Supabase policies.
- The `docs/` directory contains the supporting architecture notes for design, development, RBAC, RPC behavior, and security.
