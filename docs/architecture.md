# Architecture Reference

> Master reference for the Wedding Planning Platform tech stack, project structure, environment variables, and coding rules.

---

## 1. Tech Stack

| Layer              | Technology                    | Version / Notes                                  |
|--------------------|-------------------------------|--------------------------------------------------|
| Frontend           | Next.js (App Router)          | 14.x                                             |
| Language           | TypeScript                    | 5.x                                              |
| Styling            | Tailwind CSS                  | 3.x                                              |
| Backend / DB       | Supabase                      | PostgreSQL + Auth + Realtime + Storage            |
| Auth               | Supabase Auth                 | Email magic link + OAuth                         |
| Real-time          | Supabase Realtime             | WebSocket sync for co-planning sessions          |
| File storage       | Supabase Storage              | Private buckets, signed URLs only                |
| AI parsing         | Anthropic Claude API          | `claude-haiku-4-5` via Edge Functions            |
| Payments           | Stripe                        | One-time $49 lifetime license                    |
| Email              | Resend                        | Transactional email, RSVP confirmations          |
| Hosting            | Vercel                        | Zero-config Next.js, Edge Functions for AI       |
| PDF export         | `@react-pdf/renderer`         | Run-of-show and seating exports                  |
| Analytics          | PostHog                       | Self-host, IP anonymization enabled              |
| CSV parsing        | PapaParse                     | Guest list CSV import                            |
| Date utilities     | date-fns                      | Date calculations and formatting                 |
| Concurrency        | p-limit                       | Rate-limiting Resend API calls                   |

---

## 2. Project Folder Structure

```
/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx                      # Email magic link login page
│   │   └── invite/[token]/page.tsx             # Partner invitation accept page
│   ├── (app)/
│   │   ├── layout.tsx                          # Auth guard + sidebar shell
│   │   ├── dashboard/page.tsx                  # Home dashboard with summary widgets
│   │   ├── budget/page.tsx                     # Budget overview + allocation editor
│   │   ├── guests/page.tsx                     # Guest list + CSV import
│   │   ├── seating/page.tsx                    # SVG drag-and-drop seating chart
│   │   ├── timeline/page.tsx                   # Wedding day timeline editor
│   │   ├── vendors/page.tsx                    # Vendor CRM + contract upload
│   │   └── settings/page.tsx                   # Wedding settings + account
│   ├── rsvp/[token]/page.tsx                   # Public RSVP page (no auth)
│   ├── share/timeline/[token]/page.tsx          # Public vendor schedule (read-only)
│   └── api/
│       ├── parse-contract/route.ts              # Anthropic edge function
│       ├── stripe/
│       │   ├── checkout/route.ts                # Create Stripe Checkout session
│       │   └── webhook/route.ts                 # Stripe webhook handler
│       └── rsvp/[token]/route.ts                # RSVP submission API
├── components/
│   ├── budget/
│   │   ├── BudgetRing.tsx                      # Donut chart showing spent vs allocated
│   │   ├── CategoryCard.tsx                    # Expandable category with line items
│   │   ├── LineItemRow.tsx                     # Single budget line item row
│   │   └── PaymentSchedule.tsx                 # Payment due dates table
│   ├── guests/
│   │   ├── GuestTable.tsx                      # Sortable/filterable guest list table
│   │   ├── CsvImport.tsx                       # CSV upload + preview + import
│   │   └── RsvpStats.tsx                       # Attending/declined/pending counters
│   ├── seating/
│   │   └── SeatingCanvas.tsx                   # SVG drag-and-drop seating canvas
│   ├── timeline/
│   │   ├── TimelineEditor.tsx                  # Editable timeline with drag reorder
│   │   └── RoleSchedulePdf.tsx                 # Role-specific PDF export component
│   ├── vendors/
│   │   ├── VendorCard.tsx                      # Single vendor detail card
│   │   └── ContractUploader.tsx                # PDF upload + AI parse trigger
│   ├── paywall/
│   │   └── PaywallModal.tsx                    # $49 lifetime license upsell modal
│   └── ui/                                     # Shared primitives
│       ├── Button.tsx                          # Button component
│       ├── Input.tsx                           # Text input with label + error
│       ├── Select.tsx                          # Dropdown select
│       ├── Modal.tsx                           # Dialog modal
│       ├── Toast.tsx                           # Success/error notification toast
│       ├── Spinner.tsx                         # Loading spinner
│       ├── Skeleton.tsx                        # Skeleton loading placeholder
│       ├── EmptyState.tsx                      # Empty state illustration + CTA
│       └── Badge.tsx                           # Status badge (paid, overdue, etc.)
├── lib/
│   ├── supabase/
│   │   ├── client.ts                           # Supabase browser client
│   │   ├── server.ts                           # Supabase server client (cookies)
│   │   └── types.ts                            # Generated TypeScript types from schema
│   ├── budget/
│   │   └── allocate.ts                         # Budget allocation engine (pure function)
│   ├── timeline/
│   │   └── generate.ts                         # Timeline auto-generator (pure function)
│   ├── stripe/
│   │   └── index.ts                            # Stripe client helper
│   └── email/
│       └── templates.ts                        # Resend email HTML templates
├── hooks/
│   ├── useWedding.ts                           # Fetch current wedding context
│   ├── useIsPremium.ts                         # Check if user has premium license
│   └── useRealtimeRsvp.ts                      # Subscribe to RSVP real-time updates
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql              # All CREATE TABLE statements
│       ├── 002_rls_policies.sql                # All RLS policies
│       └── 003_functions_and_triggers.sql       # Database functions and triggers
└── public/
    └── manifest.json                           # PWA manifest
```

---

## 3. Environment Variables

```env
# ─── Supabase ────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.anon-key-here
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service-role-key-here

# ─── Anthropic (contract parsing) ────────────────────────────
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxx

# ─── Stripe ──────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxx
NEXT_PUBLIC_LIFETIME_PRICE_ID=price_xxxxxxxxxxxxxxxx

# ─── Resend (email) ──────────────────────────────────────────
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx

# ─── PostHog (analytics) ─────────────────────────────────────
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://your-posthog-instance.com

# ─── App ─────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## 4. Coding Rules

These rules are **mandatory** for every coding session.

### 4.1 Component Architecture

- **Server components** for data fetching, page loads, and any operation that reads from Supabase
- **Client components** for interactivity only (forms, modals, drag-and-drop, real-time subscriptions)
- Mark client components with `"use client"` at the top of the file
- Keep server components as the default; only add `"use client"` when necessary

### 4.2 Forms

- **All forms** must use React Hook Form + Zod validation
- Never use uncontrolled inputs without validation
- Every form must display field-level error messages
- Every form must have a loading/disabled state during submission
- Every form must handle submission errors with a visible toast

### 4.3 Monetary Values

- All monetary values stored in the database as `NUMERIC(12,2)`
- Display monetary values with:
  ```typescript
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  ```
- Never display raw numbers without formatting
- Variance (actual - estimated) displayed in **red** when positive (over budget)

### 4.4 File Uploads

- All file uploads go to **Supabase Storage** bucket `wedding-documents`
- Never store file content or binary data in the database
- Store only the Storage path/URL in the database column
- All Storage buckets must be private; use signed URLs for access

### 4.5 Styling

- **Tailwind CSS only** — no custom CSS files, no inline `style={}` attributes
- Follow the color palette defined in `ui-rules.md`
- Use Tailwind utility classes for all layout, spacing, typography, and color

### 4.6 Mobile-First Design

- Every page must be designed at **375px base** (mobile-first)
- Test breakpoints: **375px** (mobile), **768px** (tablet), **1280px** (desktop)
- Touch targets must be minimum **44px** x **44px**
- No hover-only interactions — all functionality must work on touch
- Responsive classes: `sm:`, `md:`, `lg:` prefixes

### 4.7 Error Handling

- **No silent error failures** — every async operation must handle errors in the UI
- Every API call must have a `try/catch` with user-visible error feedback
- Use toast notifications for transient errors (success = green, error = red, warning = yellow)
- Use inline error messages for form validation errors
- Every page must have a loading state (spinner or skeleton)

### 4.8 Privacy Rules

- **Zero third-party ad pixels** — no Google Ads, no Meta Pixel, no TikTok Pixel
- **No vendor lead selling** — vendor contact info never exposed outside the couple's workspace
- Analytics via **PostHog only**, with IP anonymization enabled
- No PII logged in Vercel logs — filter sensitive data from log output

---

## 5. Privacy Rules (Non-Negotiable)

| Rule | Detail |
|------|--------|
| Zero ad pixels | No Google Ads, Meta Pixel, TikTok Pixel, or any advertising tracker |
| No data brokering | Never sell, share, or expose couple/vendor data to third parties |
| No vendor discovery | Vendor records are private to each wedding; no public directory |
| RLS enforced | Every table has Row Level Security; queries scoped to `wedding_id` |
| PostHog only | Analytics via PostHog with IP anonymization; no Google Analytics |
| Signed URLs only | All file downloads use time-limited signed URLs |
| No PII in logs | Filter sensitive data from Vercel/server logs |
| 90-day retention | Wedding data auto-deleted 90 days post `wedding_date` (opt-in extension) |
