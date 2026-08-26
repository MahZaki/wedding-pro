import type { Metadata } from "next";
import { requireWedding } from "@/lib/wedding";
import { createAdminClient } from "@/lib/supabase/admin";
import { SettingsView } from "@/components/settings/SettingsView";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { wedding, role } = await requireWedding();

  // auth.users isn't readable by authenticated clients — resolve
  // collaborator emails with the service-role client instead.
  const admin = createAdminClient();
  const { data: members } = await admin
    .from("wedding_members")
    .select("role, users ( email )")
    .eq("wedding_id", wedding.id)
    .order("invited_at");

  return (
    <SettingsView
      role={role}
      appUrl={process.env.NEXT_PUBLIC_APP_URL ?? ""}
      wedding={{
        title: wedding.title,
        wedding_date: wedding.wedding_date ?? "",
        target_budget: Number(wedding.target_budget),
        guest_count_estimate: wedding.guest_count_estimate ?? 80,
        region_tier: wedding.region_tier as "metro" | "suburban" | "rural",
        id: wedding.id,
      }}
      members={(members ?? []).map((m) => ({
        role: m.role,
        email:
          (m.users as unknown as { email?: string } | null)?.email ??
          "(invited)",
      }))}
    />
  );
}
