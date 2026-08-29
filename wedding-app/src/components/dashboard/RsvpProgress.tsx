import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function RsvpProgress({ weddingId }: { weddingId: string }) {
  const supabase = await createClient();

  const { data: guests } = await supabase
    .from("guests")
    .select("id, rsvps ( status )")
    .eq("wedding_id", weddingId);

  let attending = 0;
  let declined = 0;
  let pending = 0;
  for (const g of guests ?? []) {
    const statuses = (g.rsvps as Array<{ status: string | null }> | null) ?? [];
    const status = statuses[0]?.status;
    if (!status || status === "pending") pending++;
    else if (status === "attending") attending++;
    else if (status === "declined") declined++;
  }

  const total = (guests?.length ?? 0) || 1;
  const pct = (n: number) => Math.round((n / total) * 100);

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading text-base font-semibold text-ink-700">
          RSVPs
        </h2>
        <span className="text-xs text-ink-400">{total} invited</span>
      </div>

      <div className="h-2.5 w-full rounded-full bg-stone-100 overflow-hidden flex">
        {attending > 0 && (
          <div
            className="h-full bg-success-600"
            style={{ width: `${pct(attending)}%` }}
          />
        )}
        {declined > 0 && (
          <div
            className="h-full bg-error-600"
            style={{ width: `${pct(declined)}%` }}
          />
        )}
        {pending > 0 && (
          <div
            className="h-full bg-warning-700"
            style={{ width: `${pct(pending)}%` }}
          />
        )}
      </div>

      <p className="mt-2 text-sm text-ink-600">
        {attending} attending · {declined} declined · {pending} pending
      </p>

      {pending > 0 && (
        <Link
          href="/guests"
          className="inline-flex items-center justify-center min-h-[40px] px-3 mt-3 rounded-lg bg-ink-900 text-white text-sm font-medium hover:bg-ink-800"
        >
          Send reminders →
        </Link>
      )}
    </div>
  );
}
