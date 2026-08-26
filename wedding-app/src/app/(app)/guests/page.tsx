import type { Metadata } from "next";
import { requireWedding } from "@/lib/wedding";
import { createClient } from "@/lib/supabase/server";
import { GuestsView } from "@/components/guests/GuestsView";

export const metadata: Metadata = { title: "Guests" };

export default async function GuestsPage() {
  const { wedding, role } = await requireWedding();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("guests")
    .select(
      `id, first_name, last_name, email, phone, side, token,
       rsvps (status)`
    )
    .eq("wedding_id", wedding.id)
    .order("last_name");

  if (error) {
    return (
      <div className="bg-error-50 border border-error-100 rounded-lg p-4 text-sm text-error-700">
        Failed to load guests. Please refresh the page.
      </div>
    );
  }

  return (
    <GuestsView
      guests={(data ?? []).map((g) => ({
        id: g.id,
        first_name: g.first_name,
        last_name: g.last_name,
        email: g.email,
        phone: g.phone,
        side: g.side,
        token: g.token,
        rsvpStatus:
          (g.rsvps as Array<{ status: string | null }> | null)?.[0]?.status ??
          "pending",
      }))}
      readOnly={role === "viewer"}
      appUrl={process.env.NEXT_PUBLIC_APP_URL ?? ""}
    />
  );
}
