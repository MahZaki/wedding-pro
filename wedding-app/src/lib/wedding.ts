import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type Wedding = Database["public"]["Tables"]["weddings"]["Row"];
export type WeddingRole = "owner" | "partner" | "planner" | "viewer";

/**
 * Fetches the current user's wedding via wedding_members.
 * Returns null if the user has no wedding yet.
 */
export async function getWeddingForUser(): Promise<{
  wedding: Wedding;
  role: WeddingRole;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("wedding_members")
    .select("role, weddings (*)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data || !data.weddings) return null;

  const wedding = data.weddings as unknown as Wedding;
  const role = data.role as WeddingRole;
  return { wedding, role };
}

/** Requires a wedding or redirects to onboarding. For use in (app) pages. */
export async function requireWedding() {
  const result = await getWeddingForUser();
  if (!result) redirect("/onboarding");
  return result;
}

import { redirect } from "next/navigation";
