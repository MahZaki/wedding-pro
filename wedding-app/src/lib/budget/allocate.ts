/**
 * Budget auto-allocation engine.
 * Formula reference: docs/ai-prompts.md §3
 */

export type RegionTier = "metro" | "suburban" | "rural";

export interface AllocationInput {
  targetBudget: number;
  guestCount: number;
  regionTier: RegionTier;
}

export interface CategoryAllocation {
  name: string;
  amount: number;
}

const CATERING_PER_GUEST = 114;
const CATERING_BUDGET_CAP = 0.2;

/** Region multipliers applied to all non-catering categories. */
export const REGION_MULTIPLIERS: Record<RegionTier, number> = {
  metro: 1.15,
  suburban: 1.0,
  rural: 0.88,
};

/** Base percentages of target budget, excluding Catering + Miscellaneous. */
const BASE_CATEGORIES: Array<{ name: string; percentage: number }> = [
  { name: "Venue", percentage: 0.395 },
  { name: "Photography", percentage: 0.091 },
  { name: "Videography", percentage: 0.077 },
  { name: "Florals", percentage: 0.086 },
  { name: "Music/DJ", percentage: 0.058 },
  { name: "Planner/Coordinator", percentage: 0.09 },
  { name: "Attire", percentage: 0.084 },
  { name: "Lighting & Decor", percentage: 0.1 },
  { name: "Rehearsal Dinner", percentage: 0.127 },
];

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** MIN($114 × guest_count, target_budget × 20%) */
export function calculateCatering(
  targetBudget: number,
  guestCount: number
): number {
  return round2(
    Math.min(
      CATERING_PER_GUEST * guestCount,
      round2(targetBudget * CATERING_BUDGET_CAP)
    )
  );
}

/**
 * Allocates target_budget across categories.
 * All amounts sum to EXACTLY target_budget; rounding delta is absorbed
 * by Miscellaneous. If Miscellaneous would be negative, it is clamped
 * to 0 and the caller receives a warning.
 */
export function allocateBudget(input: AllocationInput): {
  categories: CategoryAllocation[];
  warning?: string;
} {
  const { targetBudget, guestCount, regionTier } = input;
  const multiplier = REGION_MULTIPLIERS[regionTier];

  let allocated = 0;
  const categories: CategoryAllocation[] = BASE_CATEGORIES.map((cat) => {
    const amount = round2(targetBudget * cat.percentage * multiplier);
    allocated += amount;
    return { name: cat.name, amount };
  });

  const cateringAmount = calculateCatering(targetBudget, guestCount);
  allocated += cateringAmount;
  categories.push({ name: "Catering", amount: cateringAmount });

  let miscAmount = round2(targetBudget - allocated);
  let warning: string | undefined;

  if (miscAmount < 0) {
    warning =
      "Allocations exceed your total budget — Miscellaneous was set to $0. Consider lowering your budget or guest count.";
    miscAmount = 0;
  }

  categories.push({ name: "Miscellaneous", amount: miscAmount });

  // Guarantee exact balance: push any remaining cent into Miscellaneous.
  const sum = categories.reduce((acc, c) => acc + c.amount, 0);
  const delta = round2(targetBudget - sum);
  if (delta !== 0) {
    const misc = categories.find((c) => c.name === "Miscellaneous");
    if (misc && misc.amount + delta >= 0) {
      misc.amount = round2(misc.amount + delta);
    }
  }

  return { categories, warning };
}
