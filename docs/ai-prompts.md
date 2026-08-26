# AI Prompts & Logic Reference

> Anthropic contract parser prompts, error handling rules, budget allocation formula, and timeline auto-generator logic.

---

## 1. Anthropic Contract Parser

### 1.1 System Prompt

```typescript
const systemPrompt = `
You are a contract analyst for a wedding planning application.
A user has uploaded a vendor contract PDF. Extract key financial and logistical
terms and return them as structured JSON only. No explanation. No markdown.
`;
```

### 1.2 User Prompt

```typescript
const userPrompt = `
Extract the following fields from this vendor contract.
Return ONLY valid JSON with this exact shape:

{
  "vendor_type": "string (e.g. Photographer, Caterer, Florist)",
  "business_name": "string",
  "total_cost": number,
  "deposit_amount": number,
  "deposit_due_date": "YYYY-MM-DD or null",
  "balance_due_date": "YYYY-MM-DD or null",
  "event_date": "YYYY-MM-DD or null",
  "arrival_time": "HH:MM or null",
  "hours_included": number or null,
  "overtime_rate_per_hour": number or null,
  "cancellation_policy": "1-2 sentence summary",
  "key_deliverables": ["array of strings"],
  "non_refundable_deposit": boolean,
  "confidence_score": number between 0 and 1
}

If a field cannot be found, set it to null.

CONTRACT TEXT:
${contractText}
`;
```

### 1.3 JSON Output Shape

```typescript
interface ParsedContract {
  vendor_type: string;
  business_name: string;
  total_cost: number;
  deposit_amount: number;
  deposit_due_date: string | null;       // YYYY-MM-DD
  balance_due_date: string | null;       // YYYY-MM-DD
  event_date: string | null;             // YYYY-MM-DD
  arrival_time: string | null;           // HH:MM
  hours_included: number | null;
  overtime_rate_per_hour: number | null;
  cancellation_policy: string;
  key_deliverables: string[];
  non_refundable_deposit: boolean;
  confidence_score: number;              // 0 to 1
}
```

### 1.4 Edge Function Implementation

```typescript
// /app/api/parse-contract/route.ts

import { Anthropic } from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { contractText } = await request.json();

    if (!contractText || typeof contractText !== 'string') {
      return NextResponse.json(
        { error: 'contractText is required' },
        { status: 400 }
      );
    }

    const systemPrompt = `
You are a contract analyst for a wedding planning application.
A user has uploaded a vendor contract PDF. Extract key financial and logistical
terms and return them as structured JSON only. No explanation. No markdown.
`;

    const userPrompt = `
Extract the following fields from this vendor contract.
Return ONLY valid JSON with this exact shape:

{
  "vendor_type": "string (e.g. Photographer, Caterer, Florist)",
  "business_name": "string",
  "total_cost": number,
  "deposit_amount": number,
  "deposit_due_date": "YYYY-MM-DD or null",
  "balance_due_date": "YYYY-MM-DD or null",
  "event_date": "YYYY-MM-DD or null",
  "arrival_time": "HH:MM or null",
  "hours_included": number or null,
  "overtime_rate_per_hour": number or null,
  "cancellation_policy": "1-2 sentence summary",
  "key_deliverables": ["array of strings"],
  "non_refundable_deposit": boolean,
  "confidence_score": number between 0 and 1
}

If a field cannot be found, set it to null.

CONTRACT TEXT:
${contractText}
`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20250301',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      return NextResponse.json(
        { error: 'Unexpected response type from AI' },
        { status: 500 }
      );
    }

    // Parse JSON from response
    const parsed = JSON.parse(content.text);

    return NextResponse.json({ data: parsed });
  } catch (error) {
    console.error('Contract parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to parse contract' },
      { status: 500 }
    );
  }
}
```

---

## 2. Error Handling Rules

### 2.1 Confidence Score Threshold

```typescript
const CONFIDENCE_THRESHOLD = 0.7;

function handleParsedContract(parsed: ParsedContract): {
  autoPopulate: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  let autoPopulate = true;

  if (parsed.confidence_score < CONFIDENCE_THRESHOLD) {
    autoPopulate = false;
    warnings.push(
      'AI confidence is below 70%. Key fields require manual review before saving.'
    );
  }

  // Flag missing critical fields
  if (parsed.total_cost === null) {
    warnings.push('Total cost could not be extracted. Please enter manually.');
  }
  if (parsed.deposit_amount === null) {
    warnings.push('Deposit amount could not be extracted. Please enter manually.');
  }
  if (parsed.deposit_due_date === null) {
    warnings.push('Deposit due date could not be extracted. Please enter manually.');
  }

  return { autoPopulate, warnings };
}
```

### 2.2 Rules

| Condition | Action |
|-----------|--------|
| `confidence_score < 0.7` | Do **not** auto-populate budget fields; show warning to user for manual review |
| `confidence_score >= 0.7` | Auto-populate `budget_items` and `payment_schedules` with extracted values |
| `total_cost` is null | Show warning: "Total cost could not be extracted" |
| `deposit_amount` is null | Show warning: "Deposit amount could not be extracted" |
| Any date field is null | Skip creating `payment_schedule` row for that date |
| PDF > 20MB | Reject upload before processing; show error toast |
| API timeout (>15s) | Show error: "Processing took too long. Please try again." |
| JSON parse failure | Show error: "Could not parse contract. Please review the PDF and try again." |

---

## 3. Budget Allocation Formula

### 3.1 Base Percentages

Applied to `target_budget` as a percentage:

| Category | Percentage |
|----------|-----------|
| Venue | 39.5% |
| Photography | 9.1% |
| Videography | 7.7% |
| Florals | 8.6% |
| Music/DJ | 5.8% |
| Planner/Coordinator | 9.0% |
| Attire | 8.4% |
| Lighting & Decor | 10.0% |
| Rehearsal Dinner | 12.7% |
| Catering | Variable (see formula) |
| Miscellaneous | Remainder (balances to 100%) |

### 3.2 Catering Formula

```typescript
function calculateCatering(targetBudget: number, guestCount: number): number {
  const perGuest = 114; // $114 per guest
  const variableCost = perGuest * guestCount;
  const maxAllocation = targetBudget * 0.20; // cap at 20% of budget
  return Math.min(variableCost, maxAllocation);
}
```

### 3.3 Region Tier Multipliers

Applied to **all non-catering categories**:

| Tier | Multiplier |
|------|-----------|
| `metro` | × 1.15 |
| `suburban` | × 1.00 (baseline) |
| `rural` | × 0.88 |

### 3.4 Allocation Algorithm

```typescript
interface AllocationInput {
  targetBudget: number;
  guestCount: number;
  regionTier: 'metro' | 'suburban' | 'rural';
}

interface CategoryAllocation {
  name: string;
  percentage: number;
  amount: number;
}

function allocateBudget(input: AllocationInput): CategoryAllocation[] {
  const { targetBudget, guestCount, regionTier } = input;

  // Region multiplier
  const multiplier = regionTier === 'metro' ? 1.15
    : regionTier === 'rural' ? 0.88
    : 1.00;

  // Base percentages (excluding catering and miscellaneous)
  const baseCategories = [
    { name: 'Venue', percentage: 0.395 },
    { name: 'Photography', percentage: 0.091 },
    { name: 'Videography', percentage: 0.077 },
    { name: 'Florals', percentage: 0.086 },
    { name: 'Music/DJ', percentage: 0.058 },
    { name: 'Planner/Coordinator', percentage: 0.09 },
    { name: 'Attire', percentage: 0.084 },
    { name: 'Lighting & Decor', percentage: 0.10 },
    { name: 'Rehearsal Dinner', percentage: 0.127 },
  ];

  // Calculate non-catering, non-miscellaneous total
  let allocated = 0;
  const categories: CategoryAllocation[] = baseCategories.map((cat) => {
    const amount = Math.round(targetBudget * cat.percentage * multiplier * 100) / 100;
    allocated += amount;
    return { name: cat.name, percentage: cat.percentage * multiplier, amount };
  });

  // Calculate catering
  const cateringAmount = calculateCatering(targetBudget, guestCount);
  allocated += cateringAmount;
  categories.push({
    name: 'Catering',
    percentage: cateringAmount / targetBudget,
    amount: cateringAmount,
  });

  // Miscellaneous = remainder to balance exactly
  const miscellaneousAmount = Math.round((targetBudget - allocated) * 100) / 100;
  categories.push({
    name: 'Miscellaneous',
    percentage: miscellaneousAmount / targetBudget,
    amount: miscellaneousAmount,
  });

  return categories;
}
```

### 3.5 Rounding Rule

After all allocations, the sum must equal **exactly** `targetBudget`. Any rounding delta is absorbed by the **Miscellaneous** category. The Miscellaneous category must never go negative — if it does, reduce the largest category proportionally and show a warning.

---

## 4. Timeline Auto-Generator

### 4.1 User Inputs (5 Anchor Fields)

| Field | Type | Description |
|-------|------|-------------|
| `venue_access_time` | TIME | When vendors can access the venue |
| `ceremony_start` | TIME | Ceremony start time (hard anchor, never auto-shifted) |
| `golden_hour_time` | TIME | Typically sunset minus 45 minutes |
| `reception_dinner_start` | TIME | When dinner service begins |
| `venue_end_time` | TIME | Hard cutoff, venue must be cleared |

### 4.2 Auto-Generated Timeline Blocks

| # | Time Formula | Title | is_anchor | Default assigned_roles |
|---|-------------|-------|-----------|----------------------|
| 1 | `venue_access_time` | Vendor Setup & Decoration | true | Coordinator, Caterer |
| 2 | `ceremony_start - 3h` | Bridal Hair & Makeup Begins | false | Bridal party |
| 3 | `ceremony_start - 1.5h` | Bridal Party Gets Ready | false | Bridal party |
| 4 | `ceremony_start - 45min` | First Look Photos | false | Photographer, Bridal party |
| 5 | `ceremony_start - 15min` | Guests Seated / Pre-Ceremony Music | false | DJ/Band, Coordinator, Bridal party |
| 6 | `ceremony_start` | Ceremony | true | Coordinator |
| 7 | `ceremony_start + 1h` | Cocktail Hour Begins | false | Photographer, Coordinator |
| 8 | `golden_hour_time` | Golden Hour / Couple Photos | false | Photographer |
| 9 | `reception_dinner_start` | Grand Entrance & First Dance | false | DJ/Band, Coordinator |
| 10 | `reception_dinner_start + 15min` | Dinner Service Begins | false | Caterer |
| 11 | `reception_dinner_start + 1.5h` | Toasts & Speeches | false | Caterer, Coordinator |
| 12 | `reception_dinner_start + 2h` | Cake Cutting | false | Coordinator |
| 13 | `reception_dinner_start + 2.5h` | Open Dancing | false | DJ/Band |
| 14 | `venue_end_time - 30min` | Last Song Warning | false | DJ/Band |
| 15 | `venue_end_time` | Event End / Venue Cleared | true | DJ/Band, Coordinator |

### 4.3 Default assigned_roles per Block

```typescript
const defaultRoles: Record<number, string[]> = {
  1: ['Coordinator', 'Caterer'],
  2: ['Bridal party'],
  3: ['Bridal party'],
  4: ['Photographer', 'Bridal party'],
  5: ['DJ/Band', 'Coordinator', 'Bridal party'],
  6: ['Coordinator'],
  7: ['Photographer', 'Coordinator'],
  8: ['Photographer'],
  9: ['DJ/Band', 'Coordinator'],
  10: ['Caterer'],
  11: ['Caterer', 'Coordinator'],
  12: ['Coordinator'],
  13: ['DJ/Band'],
  14: ['DJ/Band'],
  15: ['DJ/Band', 'Coordinator'],
};
```

### 4.4 Timeline Generator Implementation

```typescript
interface TimelineAnchor {
  venue_access_time: string;     // "HH:MM"
  ceremony_start: string;        // "HH:MM"
  golden_hour_time: string;      // "HH:MM"
  reception_dinner_start: string; // "HH:MM"
  venue_end_time: string;        // "HH:MM"
  ceremony_duration_minutes?: number; // default 60
}

interface TimelineBlock {
  sort_order: number;
  start_time: string;
  end_time: string | null;
  title: string;
  is_anchor: boolean;
  assigned_roles: string[];
}

function parseTime(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 5);
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

function generateTimeline(anchors: TimelineAnchor): TimelineBlock[] {
  const ceremonyDuration = anchors.ceremony_duration_minutes ?? 60;

  const v = parseTime(anchors.venue_access_time);
  const c = parseTime(anchors.ceremony_start);
  const g = parseTime(anchors.golden_hour_time);
  const d = parseTime(anchors.reception_dinner_start);
  const e = parseTime(anchors.venue_end_time);

  const blocks: TimelineBlock[] = [
    {
      sort_order: 1,
      start_time: formatTime(v),
      end_time: formatTime(addMinutes(v, 180)),
      title: 'Vendor Setup & Decoration',
      is_anchor: true,
      assigned_roles: defaultRoles[1],
    },
    {
      sort_order: 2,
      start_time: formatTime(addMinutes(c, -180)),
      end_time: formatTime(addMinutes(c, -90)),
      title: 'Bridal Hair & Makeup Begins',
      is_anchor: false,
      assigned_roles: defaultRoles[2],
    },
    {
      sort_order: 3,
      start_time: formatTime(addMinutes(c, -90)),
      end_time: formatTime(addMinutes(c, -45)),
      title: 'Bridal Party Gets Ready',
      is_anchor: false,
      assigned_roles: defaultRoles[3],
    },
    {
      sort_order: 4,
      start_time: formatTime(addMinutes(c, -45)),
      end_time: formatTime(addMinutes(c, -15)),
      title: 'First Look Photos',
      is_anchor: false,
      assigned_roles: defaultRoles[4],
    },
    {
      sort_order: 5,
      start_time: formatTime(addMinutes(c, -15)),
      end_time: formatTime(c),
      title: 'Guests Seated / Pre-Ceremony Music',
      is_anchor: false,
      assigned_roles: defaultRoles[5],
    },
    {
      sort_order: 6,
      start_time: formatTime(c),
      end_time: formatTime(addMinutes(c, ceremonyDuration)),
      title: 'Ceremony',
      is_anchor: true,
      assigned_roles: defaultRoles[6],
    },
    {
      sort_order: 7,
      start_time: formatTime(addMinutes(c, ceremonyDuration)),
      end_time: formatTime(addMinutes(c, ceremonyDuration + 60)),
      title: 'Cocktail Hour Begins',
      is_anchor: false,
      assigned_roles: defaultRoles[7],
    },
    {
      sort_order: 8,
      start_time: formatTime(g),
      end_time: formatTime(addMinutes(g, 45)),
      title: 'Golden Hour / Couple Photos',
      is_anchor: false,
      assigned_roles: defaultRoles[8],
    },
    {
      sort_order: 9,
      start_time: formatTime(d),
      end_time: formatTime(addMinutes(d, 15)),
      title: 'Grand Entrance & First Dance',
      is_anchor: false,
      assigned_roles: defaultRoles[9],
    },
    {
      sort_order: 10,
      start_time: formatTime(addMinutes(d, 15)),
      end_time: formatTime(addMinutes(d, 90)),
      title: 'Dinner Service Begins',
      is_anchor: false,
      assigned_roles: defaultRoles[10],
    },
    {
      sort_order: 11,
      start_time: formatTime(addMinutes(d, 90)),
      end_time: formatTime(addMinutes(d, 120)),
      title: 'Toasts & Speeches',
      is_anchor: false,
      assigned_roles: defaultRoles[11],
    },
    {
      sort_order: 12,
      start_time: formatTime(addMinutes(d, 120)),
      end_time: formatTime(addMinutes(d, 135)),
      title: 'Cake Cutting',
      is_anchor: false,
      assigned_roles: defaultRoles[12],
    },
    {
      sort_order: 13,
      start_time: formatTime(addMinutes(d, 150)),
      end_time: formatTime(addMinutes(e, -30)),
      title: 'Open Dancing',
      is_anchor: false,
      assigned_roles: defaultRoles[13],
    },
    {
      sort_order: 14,
      start_time: formatTime(addMinutes(e, -30)),
      end_time: formatTime(addMinutes(e, -5)),
      title: 'Last Song Warning',
      is_anchor: false,
      assigned_roles: defaultRoles[14],
    },
    {
      sort_order: 15,
      start_time: formatTime(e),
      end_time: null,
      title: 'Event End / Venue Cleared',
      is_anchor: true,
      assigned_roles: defaultRoles[15],
    },
  ];

  return blocks;
}
```

### 4.5 Anchor Change Rules

- `ceremony_start` and `venue_end_time` are **always hard-locked**; never auto-shifted
- If any anchor (`is_anchor = true`) is manually changed, **all relative items shift automatically**
- Items 2–5 are calculated relative to `ceremony_start`
- Items 7–13 are calculated relative to `reception_dinner_start` or `ceremony_start + ceremony_duration`
- Items 14–15 are calculated relative to `venue_end_time`
- Item 1 is calculated relative to `venue_access_time`
- Item 8 is calculated relative to `golden_hour_time`

### 4.6 Role-Specific Export

```typescript
function generateRoleSchedule(
  timelineItems: TimelineBlock[],
  role: string
): TimelineBlock[] {
  return timelineItems.filter((item) =>
    item.assigned_roles.includes(role)
  );
}
```

Available roles: `Photographer`, `Caterer`, `Coordinator`, `DJ/Band`, `Bridal party`
