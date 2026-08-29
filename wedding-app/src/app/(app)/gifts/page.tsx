import type { Metadata } from "next";
import { requireWedding } from "@/lib/wedding";
import { createClient } from "@/lib/supabase/server";
import { GiftSummary } from "@/components/gifts/GiftSummary";
import { AddGiftForm } from "@/components/gifts/AddGiftForm";
import { GiftTable } from "@/components/gifts/GiftTable";
import type { Database } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Gifts" };

type GiftRow = Database["public"]["Tables"]["gifts"]["Row"] & {
  guests: Array<{ first_name: string; last_name: string }> | null;
};

export default async function GiftsPage() {
  const { wedding, role } = await requireWedding();
  const supabase = await createClient();

  const [{ data: gifts, error }, { data: guests }] = await Promise.all([
    supabase
      .from("gifts")
      .select("*, guests (first_name, last_name)")
      .eq("wedding_id", wedding.id)
      .order("received_at", { ascending: false, nullsFirst: true }),
    supabase
      .from("guests")
      .select("id, first_name, last_name")
      .eq("wedding_id", wedding.id)
      .order("last_name"),
  ]);

  if (error) {
    return (
      <div className="bg-error-50 border border-error-100 rounded-lg p-4 text-sm text-error-700">
        Failed to load gifts. Please refresh the page.
      </div>
    );
  }

  const rows = (gifts ?? []) as GiftRow[];

  const viewGifts = rows.map((g) => {
    const guest = g.guests?.[0];
    return {
      id: g.id,
      guest_id: g.guest_id,
      guest_name: guest
        ? `${guest.first_name} ${guest.last_name}`.trim()
        : null,
      giver_name: g.giver_name,
      gift_type: g.gift_type,
      description: g.description,
      value: g.value === null ? null : Number(g.value),
      received_at: g.received_at,
      thank_you_sent: g.thank_you_sent ?? false,
      thank_you_sent_at: g.thank_you_sent_at,
    };
  });

  const pendingThankYous = viewGifts.filter((g) => !g.thank_you_sent).length;

  const guestOptions = (guests ?? []).map((g) => ({
    id: g.id,
    label: `${g.first_name} ${g.last_name}`.trim(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="font-heading text-2xl lg:text-3xl font-bold text-ink-700">
          Gifts & Thank-Yous
        </h1>
        <p className="text-sm text-ink-400">
          Track every gift and never miss a thank-you note.
        </p>
      </div>

      <GiftSummary gifts={viewGifts} pendingThankYous={pendingThankYous} />

      <AddGiftForm
        guests={guestOptions}
        readOnly={role === "viewer"}
      />

      <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
        <div className="px-4 lg:px-5 py-4 border-b border-stone-100">
          <h2 className="font-heading font-semibold text-ink-700">
            All gifts
          </h2>
        </div>
        <div className="px-4 lg:px-5 pb-4">
          <GiftTable gifts={viewGifts} readOnly={role === "viewer"} />
        </div>
      </div>
    </div>
  );
}
