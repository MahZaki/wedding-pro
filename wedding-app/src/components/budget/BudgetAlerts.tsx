"use client";

import { AlertTriangle } from "lucide-react";
import { formatMoney } from "@/lib/utils";

export interface AlertCategory {
  id: string;
  name: string;
  allocated_amount: number;
  actual: number;
}

export function BudgetAlerts({
  targetBudget,
  totalSpent,
  categories,
}: {
  targetBudget: number;
  totalSpent: number;
  categories: AlertCategory[];
}) {
  const overBudgetTotal = totalSpent > targetBudget;
  const overCategories = categories.filter(
    (c) => c.actual > c.allocated_amount
  );

  if (!overBudgetTotal && overCategories.length === 0) return null;

  return (
    <div className="space-y-2">
      {overBudgetTotal && (
        <div className="flex items-start gap-2.5 bg-error-50 border border-error-100 text-error-700 rounded-lg p-4">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Over budget</p>
            <p className="text-sm">
              Total spent ({formatMoney(totalSpent)}) exceeds your target budget
              ({formatMoney(targetBudget)}).
            </p>
          </div>
        </div>
      )}

      {overCategories.map((c) => (
        <div
          key={c.id}
          className="flex items-start gap-2.5 bg-warning-50 border border-warning-100 text-warning-700 rounded-lg p-4"
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">
              {c.name} over budget by {formatMoney(c.actual - c.allocated_amount)}
            </p>
            <p>
              Allocated {formatMoney(c.allocated_amount)} · Actual{" "}
              {formatMoney(c.actual)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
