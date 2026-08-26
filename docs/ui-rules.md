# UI Rules Reference

> Color palette, typography, component conventions, mobile rules, and UX patterns.

---

## 0. Official Brand System (v2 — Bordeaux/Ivory/Ink)

> Source: VOWLY Final Logo System PRD + taste-skill discipline. This supersedes the v1 rose/slate/gold palette.

| Token | Hex | Usage |
|-------|-----|-------|
| Bordeaux | `#6E2F3A` | Primary accent: CTAs, active nav, links, focus rings, premium badges |
| Ivory (Paper) | `#FAF8F5` | Page background (`bg-paper`), light surfaces |
| Ink | `#1C1B1A` | Text (`ink-700/800/900`), dark sidebar bg (`ink-900`), REVERSE logo tone |
| Success Green | `#3a7a4b` family (`success-*`) | Success toasts, attending, paid |
| Error Red | `#a83a32` family (`error-*`) | Errors, over-budget, overdue |
| Warning Yellow | `#8a6420` family (`warning-*`) | Warnings, conflict indicators |

### Rules (non-negotiable)

- **One accent**: Bordeaux is the ONLY brand accent. No gold, no second accent color.
- **Warm neutrals only**: use `ink-*` / `stone-*` ramps. Never mix cool grays (slate/gray) into the UI.
- **Logo system**: `VowlySymbol` / `VowlyLogo` components in `src/components/brand/`. Never draw hearts, rings, or wedding icons. Never stretch, gradient, or shadow the logo. Clear space = 2x dot width. Min sizes: symbol 20px, wordmark 72px wide.
- **Logo variants**: brand (bordeaux+ink), ivory tone for dark surfaces (REVERSE), bordeaux tile for app icon.
- **Signature animation**: dots appear → arms draw → converge (600-900ms), gated behind `prefers-reduced-motion`. Used on auth/invite surfaces only.
- **"Two paths" motif**: `ConvergingPaths` component for auth backgrounds at ≤10% opacity.
- **No em-dashes in UI copy.** No pure black (#000) or pure white backgrounds.
- **Shape lock**: soft radius family (rounded-lg / rounded-xl, cards 14px). No mixed sharp/pill systems.
- **Tactile feedback**: buttons use `active:scale-[0.98]`-style push states where interactive.

---

## 1. Legacy Palette Reference (pre-rebrand, do not use in new code)

| Token | Hex | Status |
|-------|-----|--------|
| ~~Primary (Rose)~~ | ~~`#C0474C`~~ | Replaced by Bordeaux `#6E2F3A` |
| ~~Slate~~ | ~~`#2D3748`~~ | Replaced by Ink ramp |
| ~~Light Gray~~ | ~~`#F3F4F6`~~ | Replaced by Ivory `#FAF8F5` |
| ~~Gold Accent~~ | ~~`#B7893F`~~ | Removed; premium = Bordeaux |

### Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        rose: {
          DEFAULT: '#C0474C',
          50: '#FEF2F2',
          100: '#FDE8E8',
          500: '#C0474C',
          600: '#A33B40',
          700: '#8A3136',
        },
        slate: {
          DEFAULT: '#2D3748',
          700: '#2D3748',
          800: '#1A202C',
          900: '#171923',
        },
        gold: {
          DEFAULT: '#B7893F',
          50: '#FDF8ED',
          100: '#F9EDCF',
          500: '#B7893F',
          600: '#9A7235',
        },
      },
      fontFamily: {
        heading: ['Georgia', 'serif'],
        body: ['Calibri', 'system-ui', 'sans-serif'],
      },
    },
  },
};
```

---

## 2. Typography

| Element | Font | Size (Mobile) | Size (Desktop) | Weight |
|---------|------|---------------|----------------|--------|
| H1 (Page title) | Georgia | 24px | 36px | 700 |
| H2 (Section title) | Georgia | 20px | 28px | 700 |
| H3 (Card title) | Georgia | 18px | 22px | 600 |
| Body text | Calibri/system-ui | 14px | 16px | 400 |
| Small text / labels | Calibri/system-ui | 12px | 14px | 500 |
| Button text | Calibri/system-ui | 14px | 16px | 600 |
| Table header | Calibri/system-ui | 12px | 14px | 600 |

### Tailwind Classes

```html
<!-- H1 -->
<h1 className="font-heading text-2xl lg:text-4xl font-bold text-slate-700">

<!-- H2 -->
<h2 className="font-heading text-xl lg:text-3xl font-bold text-slate-700">

<!-- H3 -->
<h3 className="font-heading text-lg lg:text-2xl font-semibold text-slate-700">

<!-- Body -->
<p className="font-body text-sm lg:text-base text-slate-700">

<!-- Small / Label -->
<span className="font-body text-xs lg:text-sm font-medium text-slate-500">
```

---

## 3. Component Conventions

### 3.1 Page Layout

```tsx
// Standard page pattern
export default function BudgetPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="font-heading text-2xl lg:text-4xl font-bold text-slate-700 mb-6">
          Budget
        </h1>
        {/* Page content */}
      </div>
    </div>
  );
}
```

### 3.2 Card

```tsx
// Standard card pattern
<div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
  <h3 className="font-heading text-lg font-semibold text-slate-700 mb-4">
    Card Title
  </h3>
  <p className="font-body text-sm text-slate-500">
    Card content goes here.
  </p>
</div>
```

### 3.3 Modal

```tsx
// Standard modal pattern
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
  <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
    <h3 className="font-heading text-lg font-semibold text-slate-700 mb-4">
      Modal Title
    </h3>
    {/* Modal content */}
    <div className="flex justify-end gap-3 mt-6">
      <button className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700">
        Cancel
      </button>
      <button className="px-4 py-2 text-sm font-medium text-white bg-rose-500 rounded-lg hover:bg-rose-600">
        Confirm
      </button>
    </div>
  </div>
</div>
```

### 3.4 Form

```tsx
// Standard form pattern with React Hook Form + Zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
});

type FormData = z.infer<typeof schema>;

export function ExampleForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      // API call
    } catch (error) {
      // Show error toast
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Name
        </label>
        <input
          {...register('name')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Email
        </label>
        <input
          {...register('email')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-4 py-2 text-sm font-medium text-white bg-rose-500 rounded-lg hover:bg-rose-600 disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

### 3.5 Table

```tsx
// Standard table pattern
<div className="overflow-x-auto">
  <table className="w-full text-sm">
    <thead>
      <tr className="border-b border-gray-200">
        <th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th>
        <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
        <th className="text-right py-3 px-4 font-semibold text-slate-700">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b border-gray-100 hover:bg-gray-50">
        <td className="py-3 px-4 font-body text-slate-700">Venue Deposit</td>
        <td className="py-3 px-4">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            Paid
          </span>
        </td>
        <td className="py-3 px-4 text-right font-body text-slate-700">$5,000.00</td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 4. Mobile Rules

| Rule | Detail |
|------|--------|
| Base width | 375px (iPhone SE / iPhone 12 mini) |
| Test breakpoints | 375px, 768px, 1280px |
| Touch targets | Minimum **44px x 44px** for all interactive elements |
| No hover-only | All functionality must work on touch; hover states are enhancement only |
| Padding | Minimum 16px (p-4) on mobile for all content areas |
| Stacking | Cards stack vertically on mobile, grid on desktop |
| Tables | Scroll horizontally on mobile; never let content overflow hidden |
| Modals | Full-screen on mobile (`inset-0`), centered on desktop |
| FABs | Use floating action buttons on mobile for primary actions |
| Bottom nav | Consider bottom tab navigation on mobile for key sections |

### Breakpoint Classes

```html
<!-- Mobile-first defaults, then override -->
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

<!-- Show/hide at breakpoints -->
<div className="block lg:hidden">Mobile only</div>
<div className="hidden lg:block">Desktop only</div>
```

---

## 5. Toast / Notification Patterns

| Type | Color | Icon | Use Case |
|------|-------|------|----------|
| Success | Green (`#16A34A`) | Checkmark | Form submitted, payment saved, RSVP received |
| Error | Red (`#DC2626`) | X circle | API failure, validation error, upload failed |
| Warning | Yellow (`#EAB308`) | Alert triangle | Low confidence AI parse, over budget, capacity warning |

### Toast Component Pattern

```tsx
// Standard toast
<div className="fixed bottom-4 right-4 z-50 max-w-sm">
  <div className="flex items-center gap-3 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg">
    <CheckCircle className="w-5 h-5 flex-shrink-0" />
    <p className="text-sm font-medium">Budget saved successfully</p>
  </div>
</div>

// Error toast
<div className="flex items-center gap-3 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg">
  <XCircle className="w-5 h-5 flex-shrink-0" />
  <p className="text-sm font-medium">Failed to save. Please try again.</p>
</div>

// Warning toast
<div className="flex items-center gap-3 bg-yellow-500 text-white px-4 py-3 rounded-lg shadow-lg">
  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
  <p className="text-sm font-medium">AI confidence is below 70%. Review before saving.</p>
</div>
```

---

## 6. Loading State Rules

Every async action **must** have a visible loading state. No exceptions.

| Scenario | Loading Pattern |
|----------|----------------|
| Page load | Skeleton placeholders (gray animated blocks) |
| Form submission | Button shows spinner + "Submitting..." text |
| Table data loading | Skeleton rows (3-5 rows with animated shimmer) |
| Card data loading | Skeleton card with animated shimmer |
| File upload | Progress bar or spinner |
| Real-time data | Subtle pulse animation on updating values |

### Skeleton Pattern

```tsx
// Skeleton loading state
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
</div>

// Skeleton card
<div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
</div>

// Button with spinner
<button disabled className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg disabled:opacity-50">
  <Spinner className="w-4 h-4 animate-spin" />
  Saving...
</button>
```

---

## 7. Empty State Rules

Every list, table, or data view **must** have an empty state with an illustration and a call-to-action.

### Empty State Pattern

```tsx
// Standard empty state
<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
  {/* Illustration or icon */}
  <div className="w-16 h-16 mb-4 text-gray-300">
    <Users className="w-full h-full" />
  </div>
  <h3 className="font-heading text-lg font-semibold text-slate-700 mb-2">
    No guests yet
  </h3>
  <p className="font-body text-sm text-slate-500 mb-6 max-w-sm">
    Start building your guest list by adding guests manually or importing from a CSV file.
  </p>
  <button className="px-4 py-2 text-sm font-medium text-white bg-rose-500 rounded-lg hover:bg-600">
    Add Guests
  </button>
</div>
```

### Empty States per Section

| Section | Illustration | Message | CTA |
|---------|-------------|---------|-----|
| Budget | Dollar sign icon | "No budget categories yet" | "Create Budget" |
| Guests | Users icon | "No guests yet" | "Add Guests" |
| Vendors | Building icon | "No vendors added" | "Add Vendor" |
| Timeline | Clock icon | "No timeline created" | "Generate Timeline" |
| Seating | Table icon | "No tables configured" | "Add Tables" |
| RSVP | Mail icon | "No RSVPs received yet" | "Send Invitations" |
| Payments | Credit card icon | "No upcoming payments" | "Add Payment" |

---

## 8. Badge / Status Patterns

```tsx
// Paid badge
<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
  Paid
</span>

// Pending badge
<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
  Pending
</span>

// Overdue badge
<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
  Overdue
</span>

// Premium badge
<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gold-500 text-white">
  Premium
</span>

// Conflict warning indicator
<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
  ⚠ Conflict
</span>
```
