"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWedding } from "@/lib/wedding";
import type { ActionResult } from "@/lib/action-result";

const updateSchema = z.object({
  title: z.string().min(1).max(120),
  wedding_date: z.string().optional(),
  target_budget: z.coerce.number().min(1000).max(10_000_000),
  guest_count_estimate: z.coerce.number().int().min(2).max(2000),
  region_tier: z.enum(["metro", "suburban", "rural"]),
});

export async function updateWedding(input: unknown): Promise<ActionResult> {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { wedding, role: memberRole } = await requireWedding();
  if (memberRole !== "owner" && memberRole !== "planner") {
    return { error: "Only the owner can change settings." };
  }
  const supabase = await createClient();

  const data = parsed.data;
  const { error } = await supabase
    .from("weddings")
    .update({
      title: data.title,
      wedding_date: data.wedding_date || null,
      target_budget: data.target_budget,
      guest_count_estimate: data.guest_count_estimate,
      region_tier: data.region_tier,
    })
    .eq("id", wedding.id);

  if (error) {
    console.error("updateWedding:", error);
    return { error: "Failed to save settings." };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

/**
 * Accepts a partner invite.
 * TODO: replace raw wedding-id tokens with expiring signed invite tokens.
 */
export async function acceptInvite(input: unknown): Promise<{
  error?: string;
  weddingTitle?: string;
}> {
  const parsed = z.object({ token: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { error: "Invalid invite link." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in first." };

  const admin = createAdminClient();

  // Verify wedding exists
  const { data: wedding } = await admin
    .from("weddings")
    .select("id, title")
    .eq("id", parsed.data.token)
    .maybeSingle();

  if (!wedding) return { error: "This invite is no longer valid." };

  const { data: existing } = await admin
    .from("wedding_members")
    .select("id")
    .eq("wedding_id", wedding.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return { weddingTitle: wedding.title };
  }

  // Count current members — free tier allows max 2 collaborators
  const { count } = await admin
    .from("wedding_members")
    .select("*", { count: "exact", head: true })
    .eq("wedding_id", wedding.id);

  if ((count ?? 0) >= 2) {
    return {
      error:
        "This workspace already has two members. Additional collaborators require a premium license.",
    };
  }

  const { error: insertError } = await admin.from("wedding_members").insert({
    wedding_id: wedding.id,
    user_id: user.id,
    role: "partner",
  });

  if (insertError) {
    console.error("acceptInvite:", insertError);
    return { error: "Could not join this workspace." };
  }

  return { weddingTitle: wedding.title };
}
