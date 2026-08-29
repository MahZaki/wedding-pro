import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/wedding";
import { Wallet, Users, CreditCard } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { CountdownCard } from "@/components/dashboard/CountdownCard";
import { AlertCenter } from "@/components/dashboard/AlertCenter";
import { UpcomingPayments } from "@/components/dashboard/UpcomingPayments";
import { RsvpProgress } from "@/components/dashboard/RsvpProgress";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { wedding } = await requireWedding();
  const supabase = await createClient();

  // Budget summary
  const { data: categories } = await supabase
    .from("budget_categories")
    .select(
      `allocated_amount,
       budget_items(actual_cost)`
    )
    .eq("wedding_id", wedding.id);

  const allocated =
    categories?.reduce((acc, c) => acc + Number(c.allocated_amount), 0) ?? 0;

  const overBudgetCount =
    categories?.filter((c) => {
      const actual = (c.budget_items ?? []).reduce(
        (a: number, i) =>
          a + (i?.actual_cost === null ? 0 : Number(i?.actual_cost ?? 0)),
        0
      );
      return actual > Number(c.allocated_amount);
    }).length ?? 0;

  // Guest stats (attending / declined / pending) via rsvps join
  const { data: guests } = await supabase
    .from("guests")
    .select("id, rsvps (status)")
    .eq("wedding_id", wedding.id);

  let attending = 0;
  let declined = 0;
  let pending = 0;
  for (const g of guests ?? []) {
    const statuses = (g.rsvps as Array<{ status: string | null }> | null) ?? [];
    if (statuses.length === 0) {
      pending++;
      continue;
    }
    const status = statuses[0]?.status ?? "pending";
    if (status === "attending") attending++;
    else if (status === "declined") declined++;
    else pending++;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl lg:text-3xl font-bold text-ink-700">
          Dashboard
        </h1>
        <p className="text-sm text-ink-500">
          {wedding.title}
          {wedding.wedding_date
            ? ` · ${new Date(wedding.wedding_date + "T00:00:00").toLocaleDateString(
                "en-US",
                { month: "long", day: "numeric", year: "numeric" }
              )}`
            : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Budget card */}
        <Link
          href="/budget"
          className="bg-white rounded-lg border border-stone-200 p-5 hover:border-bordeaux-300 transition-colors"
        >
          <div className="flex items-center gap-2 text-ink-500 mb-3">
            <Wallet className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Budget
            </span>
          </div>
          <p className="font-heading text-2xl font-bold text-ink-700">
            {formatMoney(allocated)}
          </p>
          <p className="text-xs text-ink-400 mt-1">
            of {formatMoney(Number(wedding.target_budget))} planned
          </p>
          {overBudgetCount > 0 && (
            <p className="text-xs font-semibold text-error-600 mt-2">
              {overBudgetCount} categor{overBudgetCount === 1 ? "y" : "ies"} over
              budget
            </p>
          )}
        </Link>

        {/* Guests card */}
        <Link
          href="/guests"
          className="bg-white rounded-lg border border-stone-200 p-5 hover:border-bordeaux-300 transition-colors"
        >
          <div className="flex items-center gap-2 text-ink-500 mb-3">
            <Users className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Guests
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="font-heading text-2xl font-bold text-success-600">
              {attending}
            </span>
            <span className="text-xs text-error-600">{declined} declined</span>
            <span className="text-xs text-warning-700">{pending} pending</span>
          </div>
          <p className="text-xs text-ink-400 mt-1">
            {(guests?.length ?? 0)} invited
          </p>
        </Link>

        {/* Over budget card */}
        <Link
          href="/budget"
          className="bg-white rounded-lg border border-stone-200 p-5 hover:border-bordeaux-300 transition-colors"
        >
          <div className="flex items-center gap-2 text-ink-500 mb-3">
            <CreditCard className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Health
            </span>
          </div>
          {overBudgetCount > 0 ? (
            <>
              <p className="font-heading text-2xl font-bold text-error-600">
                {overBudgetCount}
              </p>
              <p className="text-xs text-ink-400 mt-1">
                categor{overBudgetCount === 1 ? "y" : "ies"} over budget
              </p>
            </>
          ) : (
            <>
              <p className="font-heading text-2xl font-bold text-success-600">
                On track
              </p>
              <p className="text-xs text-ink-400 mt-1">budget is healthy</p>
            </>
          )}
        </Link>
      </div>

      {/* Countdown + alerts + widget rows */}
      <CountdownCard wedding={wedding} />

      <AlertCenter weddingId={wedding.id} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UpcomingPayments />
        <RsvpProgress weddingId={wedding.id} />
      </div>
    </div>
  );
}
