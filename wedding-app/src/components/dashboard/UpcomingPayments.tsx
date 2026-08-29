import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, cn } from "@/lib/utils";

const DAY = 24 * 60 * 60 * 1000;

function dateStr(offsetDays = 0): string {
  return new Date(Date.now() + offsetDays * DAY).toISOString().split("T")[0];
}

type PaymentRow = {
  id: string;
  amount: number;
  due_date: string;
  status: string | null;
  vendor: string | null;
};

export async function UpcomingPayments() {
  const supabase = await createClient();
  const today = dateStr();

  const select =
    `id, amount, due_date, status,
     budget_items ( name, vendors ( business_name ) )`;

  const [overdueRes, upcomingRes] = await Promise.all([
    supabase
      .from("payment_schedules")
      .select(select)
      .neq("status", "paid")
      .lt("due_date", today)
      .order("due_date"),
    supabase
      .from("payment_schedules")
      .select(select)
      .neq("status", "paid")
      .gte("due_date", today)
      .order("due_date")
      .limit(3),
  ]);

  function toPayment(row: {
    id: string;
    amount: number;
    due_date: string;
    status: string | null;
    budget_items?: unknown;
  }): PaymentRow {
    const item = (row.budget_items ?? null) as
      | {
          name?: string;
          vendors?: { business_name?: string } | null;
        }
      | null;
    const vendor = item?.vendors?.business_name ?? null;
    return {
      id: row.id,
      amount: Number(row.amount),
      due_date: row.due_date,
      status: row.status,
      vendor: vendor ?? item?.name ?? null,
    };
  }

  const overdue = (overdueRes.data ?? []).map(toPayment);
  const upcoming = (upcomingRes.data ?? []).map(toPayment);

  const rows = [...overdue, ...upcoming];

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
        <h2 className="font-heading text-base font-semibold text-ink-700">
          Upcoming payments
        </h2>
        <Link
          href="/budget"
          className="text-xs font-medium text-bordeaux-600 hover:underline"
        >
          View all →
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-ink-400 text-center">
          No upcoming payments
        </p>
      ) : (
        <ul className="divide-y divide-stone-100">
          {rows.map((p) => {
            const overdueRow = p.due_date < today;
            const daysUntil = Math.ceil(
              (new Date(p.due_date + "T00:00:00").getTime() -
                new Date(today + "T00:00:00").getTime()) /
                DAY
            );
            return (
              <li
                key={p.id}
                className={cn(
                  "flex items-center justify-between gap-3 px-4 py-3",
                  overdueRow && "bg-error-50"
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-700 truncate">
                    {p.vendor ?? "Payment"}
                  </p>
                  <p className="text-xs text-ink-400">
                    due{" "}
                    {new Date(p.due_date + "T00:00:00").toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric" }
                    )}
                    {" · "}
                    {overdueRow
                      ? "overdue"
                      : daysUntil === 0
                        ? "today"
                        : `in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-sm font-semibold text-ink-700">
                    {formatMoney(p.amount)}
                  </p>
                  {overdueRow && (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-error-600 text-white">
                      OVERDUE
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
