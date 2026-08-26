import type { Metadata } from "next";
import { requireWedding } from "@/lib/wedding";
import { createClient } from "@/lib/supabase/server";
import { SettingsView } from "@/components/settings/SettingsView";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { wedding, role } = await requireWedding();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: members } = await supabase
    .from("wedding_members")
    .select("role, invited_at, users ( email )")
    .eq("wedding_id", wedding.id);

  return (
    <SettingsView
      role={role}
      email={user?.email ?? ""}
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
