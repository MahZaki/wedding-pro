import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/wedding";
import { Wallet, Users, CreditCard } from "lucide-react";
import { formatMoney, cn } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { wedding } = await requireWedding();
  const supabase = await createClient();

  // Budget summary
  const { data: categories } = await supabase
    .from("budget_categories")
    .select("allocated_amount")
    .eq("wedding_id", wedding.id);

  const allocated =
    categories?.reduce((acc, c) => acc + Number(c.allocated_amount), 0) ?? 0;

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

  // Upcoming payments in next 30 days
  // eslint-disable-next-line react-hooks/purity -- server component, computed once per request
  const today = new Date().toISOString().split("T")[0];
  // eslint-disable-next-line react-hooks/purity -- server component, computed once per request
  const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data: payments } = await supabase
    .from("payment_schedules")
    .select(
      `id, amount, due_date, status,
       budget_items ( name, budget_categories ( name ) )`
    )
    .neq("status", "paid")
    .gte("due_date", today)
    .lte("due_date", in30)
    .order("due_date")
    .limit(5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl lg:text-3xl font-bold text-slate-700">
          Dashboard
        </h1>
        <p className="text-sm text-slate-500">
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
          className="bg-white rounded-lg border border-gray-200 p-5 hover:border-rose-300 transition-colors"
        >
          <div className="flex items-center gap-2 text-slate-500 mb-3">
            <Wallet className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Budget
            </span>
          </div>
          <p className="font-heading text-2xl font-bold text-slate-700">
            {formatMoney(allocated)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            of {formatMoney(Number(wedding.target_budget))} planned
          </p>
        </Link>

        {/* Guests card */}
        <Link
          href="/guests"
          className="bg-white rounded-lg border border-gray-200 p-5 hover:border-rose-300 transition-colors"
        >
          <div className="flex items-center gap-2 text-slate-500 mb-3">
            <Users className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Guests
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="font-heading text-2xl font-bold text-green-600">
              {attending}
            </span>
            <span className="text-xs text-red-500">{declined} declined</span>
            <span className="text-xs text-yellow-600">{pending} pending</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {(guests?.length ?? 0)} invited
          </p>
        </Link>

        {/* Payments card */}
        <Link
          href="/budget"
          className="bg-white rounded-lg border border-gray-200 p-5 hover:border-rose-300 transition-colors"
        >
          <div className="flex items-center gap-2 text-slate-500 mb-3">
            <CreditCard className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Due in 30 days
            </span>
          </div>
          <p className="font-heading text-2xl font-bold text-slate-700">
            {payments?.length ?? 0} payments
          </p>
          <p className="text-xs text-slate-400 mt-1">upcoming</p>
        </Link>
      </div>

      {/* Upcoming payments list */}
      <section>
        <h2 className="font-heading text-lg font-semibold text-slate-700 mb-3">
          Upcoming payments
        </h2>
        {payments && payments.length > 0 ? (
          <ul className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {payments.map((p) => {
              const item = p.budget_items as unknown as {
                name?: string;
                budget_categories?: { name?: string };
              } | null;
              const overdue = p.due_date < today;
              return (
                <li
                  key={p.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {item?.name ?? "Payment"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {item?.budget_categories?.name} · due{" "}
                      {new Date(p.due_date + "T00:00:00").toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-sm font-semibold text-slate-700">
                      {formatMoney(Number(p.amount))}
                    </p>
                    <span
                      className={cn(
                        "inline-flex px-2 py-0.5 rounded-full text-xs font-medium",
                        overdue
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      )}
                    >
                      {overdue ? "Overdue" : p.status ?? "pending"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="bg-white rounded-lg border border-gray-200 px-4 py-6 text-sm text-slate-400 text-center">
            No payments due in the next 30 days.
          </p>
        )}
      </section>
    </div>
  );
}
