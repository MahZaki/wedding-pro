import { cn, formatMoney } from "@/lib/utils";

interface Stat {
  label: string;
  value: number;
  over?: boolean;
}

function StatCard({ label, value, over }: Stat) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 flex flex-col gap-1",
        over
          ? "bg-error-50 border-error-100 text-error-700"
          : "bg-white border-stone-200 text-ink-700"
      )}
    >
      <span
        className={cn(
          "text-xs font-medium uppercase",
          over ? "text-error-600" : "text-ink-400"
        )}
      >
        {label}
      </span>
      <span className="font-heading text-xl font-bold">
        {formatMoney(value)}
      </span>
      {over && (
        <span className="text-xs font-semibold text-error-700">
          Over budget
        </span>
      )}
    </div>
  );
}

export function BudgetSummary({
  totalBudget,
  totalContributed,
  totalSpent,
}: {
  totalBudget: number;
  totalContributed: number;
  totalSpent: number;
}) {
  const remaining = totalBudget - totalSpent;
  const over = remaining < 0;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label="Total Budget" value={totalBudget} />
      <StatCard label="Total Contributed" value={totalContributed} />
      <StatCard label="Total Spent" value={totalSpent} />
      <StatCard label="Remaining" value={remaining} over={over} />
    </div>
  );
}
