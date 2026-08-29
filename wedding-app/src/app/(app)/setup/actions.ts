"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/wedding";
import type { ActionResult } from "@/lib/action-result";
import { setupSchema } from "@/lib/schemas/setup";

/**
 * Persists the setup wizard fields for the current wedding. Additive only —
 * existing settings on the wedding row are left untouched.
 */
export async function saveSetup(input: unknown): Promise<ActionResult> {
  const parsed = setupSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const { wedding } = await requireWedding();
  const supabase = await createClient();

  const { error } = await supabase
    .from("weddings")
    .update({
      partner1_name: data.partner1_name || null,
      partner2_name: data.partner2_name || null,
      wedding_date: data.wedding_date || null,
      ceremony_location: data.ceremony_location || null,
      reception_location: data.reception_location || null,
      wedding_style: data.wedding_style || null,
      timezone: data.timezone,
      target_budget: data.target_budget,
      guest_count_estimate: data.guest_count_estimate,
      region_tier: data.region_tier,
    })
    .eq("id", wedding.id);

  if (error) {
    console.error("saveSetup:", error);
    return { error: "Failed to save your details." };
  }

  revalidatePath("/setup");
  return { ok: true };
}

/** Marks setup complete and sends the user to the dashboard. */
export async function completeSetup(): Promise<ActionResult> {
  const { wedding } = await requireWedding();
  const supabase = await createClient();

  const { error } = await supabase
    .from("weddings")
    .update({ setup_complete: true })
    .eq("id", wedding.id);

  if (error) {
    console.error("completeSetup:", error);
    return { error: "Failed to finish setup." };
  }

  revalidatePath("/setup");
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

/**
 * Returns the partner invite link for the current wedding.
 * Uses the existing invite system (copyable /invite/:weddingId link).
 */
export async function getInviteLink(): Promise<{ ok: true; url: string } | { error: string }> {
  const { wedding } = await requireWedding();
  return { ok: true, url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/invite/${wedding.id}` };
}
