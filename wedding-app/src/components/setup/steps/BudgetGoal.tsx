"use client";

import { AlertTriangle } from "lucide-react";
import { allocateBudget, type RegionTier } from "@/lib/budget/allocate";
import { formatMoney, cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import type { WizardForm } from "../SetupWizard";

const REGIONS = [
  { value: "metro", label: "Metro / major city (+15%)" },
  { value: "suburban", label: "Suburban (baseline)" },
  { value: "rural", label: "Rural (-12%)" },
] as const;

export function BudgetGoal({ form }: { form: WizardForm }) {
  const { register, watch } = form;
  const errors = form.formState.errors as Record<string, { message?: string }>;
  const values = watch();

  const budget = Number(values.target_budget) || 0;
  const guests = Number(values.guest_count_estimate) || 0;
  const region = (values.region_tier as RegionTier) || "suburban";

  const preview =
    budget >= 1000 && guests >= 2
      ? allocateBudget({ targetBudget: budget, guestCount: guests, regionTier: region })
      : null;

  return (
    <div>
      <h2 className="font-heading text-lg font-semibold text-ink-700 mb-1">
        Set your budget goal
      </h2>
      <p className="text-sm text-ink-500 mb-5">
        We&apos;ll automatically split this across categories — adjust anytime.
      </p>

      <div className="space-y-4">
        <Input
          label="Total budget ($)"
          type="number"
          step="1"
          min="1000"
          error={errors.target_budget?.message}
          {...register("target_budget")}
        />
        <Input
          label="Estimated guest count"
          type="number"
          min="2"
          error={errors.guest_count_estimate?.message}
          {...register("guest_count_estimate")}
        />

        <div>
          <span className="block text-sm font-medium text-ink-700 mb-2">
            Region tier
          </span>
          <div className="grid grid-cols-1 gap-2">
            {REGIONS.map((r) => {
              const selected = values.region_tier === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => form.setValue("region_tier", r.value, { shouldValidate: true })}
                  aria-pressed={selected}
                  className={cn(
                    "min-h-[44px] flex items-center justify-between px-4 rounded-lg border text-sm font-medium transition-colors",
                    selected
                      ? "border-bordeaux-500 bg-bordeaux-50 text-bordeaux-700"
                      : "border-ink-300 bg-white text-ink-600 hover:bg-ink-50"
                  )}
                >
                  <span>{r.label.split(" (")[0]}</span>
                  <span className="text-xs font-normal text-ink-400">
                    {r.label.match(/\(([^)]+)\)/)?.[1]}
                  </span>
                </button>
              );
            })}
          </div>
          <input type="hidden" {...register("region_tier")} />
        </div>

        {/* Live allocation preview */}
        {preview && (
          <div>
            {preview.warning && (
              <div className="flex items-start gap-2 bg-warning-50 border border-warning-100 rounded-lg p-3 mb-3">
                <AlertTriangle className="w-4 h-4 text-warning-700 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-warning-700">{preview.warning}</p>
              </div>
            )}
            <p className="text-sm font-medium text-ink-700 mb-2">
              Suggested breakdown
            </p>
            <ul className="divide-y divide-stone-100 border border-stone-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              {preview.categories.map((c) => (
                <li
                  key={c.name}
                  className="flex items-center justify-between px-4 py-2.5 bg-white"
                >
                  <span className="text-sm text-ink-600">{c.name}</span>
                  <span className="text-sm font-semibold text-ink-700">
                    {formatMoney(c.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
