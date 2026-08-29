"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/wedding";
import type { ActionResult } from "@/lib/action-result";
import { giftSchema } from "@/lib/schemas/gifts";

export async function addGift(input: unknown): Promise<ActionResult> {
  const parsed = giftSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { wedding, role } = await requireWedding();
  if (role === "viewer") return { error: "Viewers can't log gifts." };
  const supabase = await createClient();

  const data = parsed.data;
  const { error } = await supabase.from("gifts").insert({
    wedding_id: wedding.id,
    guest_id: data.guest_id || null,
    giver_name: data.giver_name || null,
    gift_type: data.gift_type,
    description: data.description || null,
    value: data.value ?? null,
    received_at: data.received_at || null,
    notes: data.notes || null,
  });

  if (error) {
    console.error("addGift:", error);
    return { error: "Failed to log gift. Please try again." };
  }

  revalidatePath("/gifts");
  revalidatePath("/guests");
  return { ok: true };
}

const toggleThankYouSchema = z.object({
  id: z.string().uuid(),
  thank_you_sent: z.boolean(),
});

export async function toggleThankYou(input: unknown): Promise<ActionResult> {
  const parsed = toggleThankYouSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid gift" };

  const { role } = await requireWedding();
  if (role === "viewer") return { error: "Viewers can't update thank-yous." };
  const supabase = await createClient();

  const { id, thank_you_sent } = parsed.data;
  const { error } = await supabase
    .from("gifts")
    .update({
      thank_you_sent,
      thank_you_sent_at: thank_you_sent
        ? new Date().toISOString().slice(0, 10)
        : null,
    })
    .eq("id", id);

  if (error) {
    console.error("toggleThankYou:", error);
    return { error: "Failed to update thank-you. Please try again." };
  }

  revalidatePath("/gifts");
  revalidatePath("/guests");
  return { ok: true };
}

const deleteGiftSchema = z.object({ id: z.string().uuid() });

export async function deleteGift(input: unknown): Promise<ActionResult> {
  const parsed = deleteGiftSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid gift" };

  const { role } = await requireWedding();
  if (role === "viewer") return { error: "Viewers can't delete gifts." };
  const supabase = await createClient();

  const { error } = await supabase
    .from("gifts")
    .delete()
    .eq("id", parsed.data.id);

  if (error) {
    console.error("deleteGift:", error);
    return { error: "Failed to delete gift. Please try again." };
  }

  revalidatePath("/gifts");
  revalidatePath("/guests");
  return { ok: true };
}
