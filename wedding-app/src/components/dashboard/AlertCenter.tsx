import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, cn } from "@/lib/utils";
import { CheckCircle2, ChevronRight } from "lucide-react";

const DAY = 24 * 60 * 60 * 1000;

const CORE_CATEGORIES = [
  "Venue",
  "Catering",
  "Photography",
  "Videography",
  "Florals",
  "Music/DJ",
  "Planner/Coordinator",
];

type Alert = {
  id: string;
  tone: "red" | "yellow";
  message: string;
  href: string;
};

function dateStr(offsetDays = 0): string {
  return new Date(Date.now() + offsetDays * DAY).toISOString().split("T")[0];
}

export async function AlertCenter({ weddingId }: { weddingId: string }) {
  const supabase = await createClient();
  const today = dateStr();
  const in7 = dateStr(7);

  const [paymentsRes, guestsRes, vendorsRes, categoriesRes, giftsRes] =
    await Promise.all([
      supabase
        .from("payment_schedules")
        .select(`id, amount, due_date, status, budget_items ( name )`)
        .neq("status", "paid")
        .gte("due_date", today)
        .lte("due_date", in7)
        .order("due_date"),
      supabase.from("guests").select("id, rsvps ( status )"),
      supabase.from("vendors").select("id, category, status"),
      supabase
        .from("budget_categories")
        .select(`id, name, allocated_amount, budget_items ( actual_cost )`),
      supabase
        .from("gifts")
        .select("id", { count: "exact" })
        .eq("thank_you_sent", false),
    ]);

  const alerts: Alert[] = [];

  // 1. Payments due within 7 days (red)
  for (const p of paymentsRes.data ?? []) {
    const item = p.budget_items as unknown as { name?: string } | null;
    alerts.push({
      id: `pay-${p.id}`,
      tone: "red",
      message: `${item?.name ?? "Payment"} of ${formatMoney(
        Number(p.amount)
      )} due ${new Date(p.due_date + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })}`,
      href: "/budget",
    });
  }

  // 2. RSVPs pending > 20% of invitees (yellow)
  const guestList = guestsRes.data ?? [];
  let pendingCount = 0;
  let attendingCount = 0;
  for (const g of guestList) {
    const statuses = (g.rsvps as Array<{ status: string | null }> | null) ?? [];
    const status = statuses[0]?.status;
    if (!status || status === "pending") pendingCount++;
    else if (status === "attending") attendingCount++;
  }
  const invited = guestList.length;
  if (invited > 0 && pendingCount > 0 && pendingCount > invited * 0.2) {
    alerts.push({
      id: "rsvp",
      tone: "yellow",
      message: `${pendingCount} guest${pendingCount === 1 ? "" : "s"} haven't RSVP'd`,
      href: "/guests",
    });
  }

  // 3. Vendor categories present but with no booking (yellow)
  const vendors = vendorsRes.data ?? [];
  const byCategory: Record<string, { total: number; booked: number }> = {};
  for (const v of vendors) {
    const c = v.category ?? "Other";
    if (!byCategory[c]) byCategory[c] = { total: 0, booked: 0 };
    byCategory[c].total++;
    if (v.status === "booked" || v.status === "paid") byCategory[c].booked++;
  }
  for (const cat of CORE_CATEGORIES) {
    const stats = byCategory[cat];
    if (stats && stats.total > 0 && stats.booked === 0) {
      alerts.push({
        id: `vendor-${cat}`,
        tone: "yellow",
        message: `No ${cat.toLowerCase()} booked yet`,
        href: "/vendors",
      });
    }
  }

  // 4. Over-budget categories (red)
  for (const c of categoriesRes.data ?? []) {
    const actual = (c.budget_items ?? []).reduce(
      (acc: number, i) =>
        acc + (i?.actual_cost === null ? 0 : Number(i?.actual_cost ?? 0)),
      0
    );
    if (actual > Number(c.allocated_amount)) {
      alerts.push({
        id: `budget-${c.id}`,
        tone: "red",
        message: `${c.name} is ${formatMoney(actual - Number(c.allocated_amount))} over budget`,
        href: "/budget",
      });
    }
  }

  // 5. Unsent thank-you notes (yellow)
  const pendingThankYous = giftsRes.count ?? 0;
  if (pendingThankYous > 0) {
    alerts.push({
      id: "thank-you",
      tone: "yellow",
      message: `${pendingThankYous} thank-you note${pendingThankYous === 1 ? "" : "s"} pending`,
      href: "/gifts",
    });
  }

  // Sort: red first, then yellow (stable within tone by insertion).
  const sorted = alerts
    .sort((a, b) => (a.tone === b.tone ? 0 : a.tone === "red" ? -1 : 1))
    .slice(0, 5);

  if (sorted.length === 0) {
    return (
      <div className="flex items-center gap-3 bg-success-50 border border-success-100 rounded-xl px-4 py-4 text-success-700">
        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm font-medium">You're all caught up!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-stone-100">
        <h2 className="font-heading text-base font-semibold text-ink-700">
          Needs attention
        </h2>
      </div>
      <ul className="divide-y divide-stone-100">
        {sorted.map((a) => (
          <li key={a.id}>
            <Link
              href={a.href}
              className="flex items-center gap-3 min-h-[48px] px-4 py-3 hover:bg-stone-50 transition-colors"
            >
              <span
                className={cn(
                  "w-2.5 h-2.5 rounded-full flex-shrink-0",
                  a.tone === "red" ? "bg-error-600" : "bg-warning-700"
                )}
              />
              <span className="flex-1 text-sm text-ink-700">{a.message}</span>
              <ChevronRight className="w-4 h-4 text-ink-300 flex-shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
