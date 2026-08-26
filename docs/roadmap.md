# Roadmap Reference

> Phased build plan with task lists, priorities, acceptance criteria, and progress tracking.

---

## Current Status

<!-- Track progress by checking off items as they are completed -->

- [ ] Phase 1: PDF planner + social setup
- [ ] Phase 2: Core SaaS MVP ← **IN PROGRESS** (schema, auth, budget, guests, vendors, RSVP, timeline, seating, settings built; Stripe paywall remaining)
- [ ] Phase 3: AI parsing, cash funds, exports
- [ ] Phase 4: Full funnel integration

---

## Phase 1 — Digital Asset & Social Infrastructure (Weeks 1–2)

| # | Task | Output | Tool | Status |
|---|------|--------|------|--------|
| 1.1 | Design 170+ page hyperlinked PDF planner | Interactive .pdf with GoodNotes navigation | Canva Pro / Adobe Illustrator | - [ ] |
| 1.2 | Set up Etsy + Stan Store storefronts | Live product listings | Etsy, Stan Store | - [ ] |
| 1.3 | Create TikTok creator account | Profile with bio link | TikTok | - [ ] |
| 1.4 | Film 3 launch videos | Published TikToks | iPhone + CapCut | - [ ] |
| 1.5 | Set up email list capture | Waitlist for SaaS launch | ConvertKit / Resend | - [ ] |
| 1.6 | Embed QR codes in PDF → app URLs | PDF updated with live QR codes | QR code generator | - [ ] |

---

## Phase 2 — Core SaaS MVP (Weeks 3–5)

| # | Task | Acceptance Criteria | Priority | Status |
|---|------|---------------------|----------|--------|
| 2.1 | Supabase project setup + all migrations | All tables created with RLS; TypeScript types generated | P0 | [x] |
| 2.2 | Auth: magic link + invite partner flow | Two users can access same wedding; roles enforced | P0 | [x] |
| 2.3 | Budget engine (allocation + tracking) | Auto-allocate on wedding creation; actual vs estimated tracking; variance display | P0 | [x] |
| 2.4 | Stripe paywall ($49 lifetime) | Successful charge → premium role granted; webhook verified | P0 | - [ ] |
| 2.5 | Vendor CRM (CRUD) | RLS-isolated per wedding; zero third-party pixels on vendor pages | P0 | [x] |
| 2.6 | Guest list + CSV import | Import 200 rows in <5s; dedup on email; invalid rows flagged | P0 | [x] |
| 2.7 | Dashboard home | Loads <1.5s on mobile; summary widgets for budget, guests, payments | P1 | [x] |
| 2.8 | RSVP portal (token-based, no login) | Guest submits without account; real-time dashboard update | P1 | [x] |
| 2.9 | Seating chart SVG canvas | Drag-drop guests to tables; capacity enforcement; conflict warnings | P1 | [x] |
| 2.10 | Timeline auto-generator | All 15 blocks generated from 5 anchors; anchor changes shift relative items | P1 | [x] |
| 2.11 | Mobile-first responsive design | All pages tested at 375px, 768px, 1280px; touch targets 44px+ | P0 | [x] |
| 2.12 | Error + loading states | Every async action has loading state; every error handled in UI | P0 | [x] |
| 2.13 | Settings page | Wedding settings; account management; partner invite | P1 | [x] |

---

## Phase 3 — AI, Cash Funds & Exports (Weeks 6–7)

| # | Task | Acceptance Criteria | Priority | Status |
|---|------|---------------------|----------|--------|
| 3.1 | PDF contract upload → AI extraction | Fields populated within 15s; confidence_score < 0.7 flags for manual review | P1 | - [ ] |
| 3.2 | Zero-fee cash fund page | No platform fee on transfers; Stripe integration for direct routing | P1 | - [ ] |
| 3.3 | Payment reminder emails | Resend fires 7d + 1d before due_date; overdue items show red badge | P1 | - [ ] |
| 3.4 | Role-specific timeline PDF export | Photographer view ≠ caterer view; shareable secure URL valid 30 days | P2 | - [ ] |
| 3.5 | Dietary manifest export (PDF/CSV) | Caterer handoff document generated; only includes confirmed RSVPs | P2 | - [ ] |
| 3.6 | PWA manifest + service worker | Installable on iOS home screen; offline support for key pages | P2 | - [ ] |
| 3.7 | Bulk RSVP invite flow | Button triggers Resend email per guest; progress bar; rate limit 10/sec | P1 | - [ ] |
| 3.8 | Partner invite (>1 collaborator) | Premium-gated; third+ collaborator requires paid license | P1 | - [ ] |

---

## Phase 4 — Full Funnel Integration (Week 8+)

| # | Task | Description | Priority | Status |
|---|------|-------------|----------|--------|
| 4.1 | PDF ↔ App deep links live | QR codes in PDF open app to matching section | P1 | - [ ] |
| 4.2 | Referral program | Referred purchase = $5 credit; tracked via referral code | P2 | - [ ] |
| 4.3 | Affiliate TikTok creator program | Creators earn 20% on referred sales; tracked via unique links | P2 | - [ ] |
| 4.4 | Public wedding website builder | Guest-facing wedding site with details, registry link, RSVP portal | P3 | - [ ] |

---

## Priority Legend

| Priority | Meaning |
|----------|---------|
| P0 | Must have for launch; blocks other work |
| P1 | Important; should ship in the same phase |
| P2 | Nice to have; can ship after core features |
| P3 | Future consideration; lowest priority |

---

## Key Milestones

| Milestone | Target | Phase |
|-----------|--------|-------|
| PDF planner live on Etsy/Stan Store | End of Week 2 | 1 |
| Supabase schema + auth + budget engine live | End of Week 3 | 2 |
| Full MVP with all P0 features working | End of Week 5 | 2 |
| AI contract parser + payment reminders live | End of Week 7 | 3 |
| Full funnel integration complete | Week 8+ | 4 |

---

## Non-Functional Requirements Checklist

- [ ] Dashboard LCP < 1.5s on 4G mobile (Vercel Speed Insights)
- [ ] RSVP page load < 2s globally (Vercel Edge Network)
- [ ] 99.9% uptime (Supabase Pro status)
- [ ] All Storage buckets private; signed URLs only
- [ ] No PII logged in Vercel logs
- [ ] Zero third-party ad pixels (browser network audit)
- [ ] PostHog IP anonymization enabled
- [ ] WCAG 2.1 AA for all core flows (Axe DevTools audit)
- [ ] PWA installable on iOS 16+ and Android 12+ (Lighthouse audit)
- [ ] Wedding data deleted 90 days post wedding_date (opt-in extension)
