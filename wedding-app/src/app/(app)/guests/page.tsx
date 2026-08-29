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
       address, age_group, allergies, group_id, meal_preference, notes,
       is_child, thank_you_sent, thank_you_sent_at, table_id,
       rsvps (status)`
    )
    .eq("wedding_id", wedding.id)
    .order("last_name");

  const { data: groups } = await supabase
    .from("guest_groups")
    .select("id, name")
    .eq("wedding_id", wedding.id)
    .order("name");

  const { data: tables } = await supabase
    .from("tables")
    .select("id, label, table_number")
    .eq("wedding_id", wedding.id)
    .order("table_number");

  if (error) {
    return (
      <div className="bg-error-50 border border-error-100 rounded-lg p-4 text-sm text-error-700">
        Failed to load guests. Please refresh the page.
      </div>
    );
  }

  const groupMap = new Map((groups ?? []).map((g) => [g.id, g.name]));
  const tableMap = new Map(
    (tables ?? []).map((t) => [
      t.id,
      t.label || (t.table_number ? `Table ${t.table_number}` : null),
    ])
  );

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
        group_id: g.group_id,
        group_name: g.group_id ? groupMap.get(g.group_id) ?? null : null,
        table_id: g.table_id,
        table_name: g.table_id ? tableMap.get(g.table_id) ?? null : null,
        address: g.address,
        age_group: g.age_group,
        allergies: g.allergies,
        meal_preference: g.meal_preference,
        notes: g.notes,
        is_child: g.is_child,
        thank_you_sent: g.thank_you_sent,
        thank_you_sent_at: g.thank_you_sent_at,
      }))}
      groups={(groups ?? []).map((g) => ({
        id: g.id,
        name: g.name,
        count:
          data?.filter((x) => x.group_id === g.id).length ?? 0,
      }))}
      tables={(tables ?? []).map((t) => ({
        id: t.id,
        label: t.label || (t.table_number ? `Table ${t.table_number}` : "Unlabeled"),
      }))}
      readOnly={role === "viewer"}
      appUrl={process.env.NEXT_PUBLIC_APP_URL ?? ""}
    />
  );
}
