# Features Reference

> Complete list of epics, user stories, free vs premium features, and trial rules.

---

## 1. Epics

| Epic | Description |
|------|-------------|
| **Budget Management** | Auto-allocation engine, actual vs estimated tracking, payment reminders |
| **Guests & RSVP** | Guest list management, CSV import, token-based public RSVP portal |
| **Vendors & AI Parsing** | Private vendor CRM, PDF contract upload, AI-powered term extraction |
| **Timeline & Run-of-Show** | Auto-generated wedding day schedule from anchor times, role-specific exports |
| **Seating Chart** | SVG drag-and-drop seating canvas with conflict detection |
| **Paywall** | 7-day free trial, $49 lifetime license, feature gating |

---

## 2. User Stories

### Epic 1: Budget Management

| ID | Story | Acceptance Criteria | Priority | Phase |
|----|-------|---------------------|----------|-------|
| US-001 | Auto-allocation on wedding creation | Given a $28,000 budget and 80 guests, the system calculates allocations using the documented percentage model; all categories sum to exactly the input budget; allocation table renders within 500ms; no page reload required | P0 | 2 |
| US-002 | Actual vs estimated tracking | Each budget line item shows `estimated / actual / variance`; variance displays in red when `actual > estimated`; budget summary card at top updates in real-time; no page reload required | P0 | 2 |
| US-003 | Payment reminders | System generates `payment_schedule` rows on vendor contract entry; email/push notification fires 7 days and 1 day before each `due_date`; overdue items render with red badge in dashboard | P1 | 3 |

### Epic 2: Guests & RSVP

| ID | Story | Acceptance Criteria | Priority | Phase |
|----|-------|---------------------|----------|-------|
| US-010 | Token-based RSVP (no login) | Guest receives unique tokenized URL; RSVP page loads in <2s on 4G; no login required; guest can select attending/declined, meal preference, and dietary needs; submission updates `rsvps` table in real-time; couple sees count update on dashboard instantly | P0 | 2 |
| US-011 | CSV guest import | CSV import accepts: `first_name, last_name, email, phone, group` columns; system deduplicates on email; invalid rows flagged with reason; import of 200 rows completes in <5s | P0 | 2 |
| US-012 | Dietary manifest export | One-click export generates PDF/CSV of all attending guests grouped by dietary restriction; export reflects only confirmed RSVPs with `status = 'attending'` | P2 | 3 |

### Epic 3: Vendors & AI Parsing

| ID | Story | Acceptance Criteria | Priority | Phase |
|----|-------|---------------------|----------|-------|
| US-020 | AI contract parsing | User uploads PDF ≤20MB; edge function processes within 15s; extracted fields: `total_cost`, `deposit_amount`, `deposit_due_date`, `balance_due_date`, `cancellation_policy`, `overtime_rate`; fields pre-populate matching `budget_items` and `payment_schedules` rows; user reviews and confirms before save | P1 | 3 |
| US-021 | Private vendor CRM | Vendor records are RLS-isolated to `wedding_id`; no vendor data transmitted to third-party ad networks; vendor cannot be discovered by other platform users; zero third-party pixels on vendor CRM pages | P0 | 2 |

### Epic 4: Timeline & Run-of-Show

| ID | Story | Acceptance Criteria | Priority | Phase |
|----|-------|---------------------|----------|-------|
| US-030 | Auto-generate wedding day schedule | User inputs: venue access time, ceremony start, golden hour time, dinner start, venue end time; system generates all intermediate blocks with correct durations; if any anchor changes, all dependent items shift automatically | P1 | 2 |
| US-031 | Role-specific schedule export | System generates filtered PDF views per role (photographer, caterer, bridal party); each view contains only `timeline_items` where `assigned_roles` includes that role; export is a shareable secure URL (no login required) valid for 30 days | P2 | 3 |

### Epic 5: Seating Chart

| ID | Story | Acceptance Criteria | Priority | Phase |
|----|-------|---------------------|----------|-------|
| US-040 | Drag-and-drop seating chart | SVG canvas renders tables at stored `pos_x/pos_y`; guests dragged from unassigned pool to table seats; system blocks drop if `table.capacity` is already met; conflict tags (e.g., `"divorced-parents"`) flagged with yellow indicator; changes auto-save via Supabase Realtime | P1 | 2 |

---

## 3. Free vs Premium Feature Table

| Feature | Free | Premium ($49 Lifetime) |
|---------|------|------------------------|
| Budget tracking (view + edit) | ✅ | ✅ |
| Guest list management | ✅ | ✅ |
| Basic RSVP portal (token-based) | ✅ | ✅ |
| Vendor CRM (add/edit vendors) | ✅ | ✅ |
| Timeline editor | ✅ | ✅ |
| AI contract parsing | ❌ | ✅ |
| Seating chart export (PDF) | ❌ | ✅ |
| Timeline PDF export (role-specific) | ❌ | ✅ |
| Bulk RSVP invites (Resend email) | ❌ | ✅ |
| Partner invite (>1 collaborator) | ❌ | ✅ |
| CSV guest import | ✅ | ✅ |
| Payment reminders | ✅ | ✅ |

---

## 4. 7-Day Free Trial Rule

- Every new user receives a **7-day free trial** with full access to all features (including premium)
- Trial begins on the date the user creates their first wedding workspace
- After 7 days, premium features are locked behind the $49 lifetime paywall
- Free features (budget tracking, guest list, basic RSVP, vendor CRM, timeline editor, CSV import, payment reminders) remain accessible after trial
- The PaywallModal appears when a user attempts to access a locked premium feature after trial expiry
- Trial status is tracked via `wedding_members.trial_started_at` timestamp (add to schema)
- If the user has not created a wedding workspace, trial does not start
- Trial cannot be extended or reset

```sql
-- Add trial tracking column to wedding_members
alter table wedding_members
  add column trial_started_at timestamptz default now();
```
