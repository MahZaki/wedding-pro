"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/wedding";
import type { ActionResult } from "@/lib/action-result";

export async function addTable(input: unknown): Promise<ActionResult> {
  const parsed = z
    .object({
      capacity: z.coerce.number().int().min(1).max(24),
      shape: z.enum(["round", "banquet", "square"]).default("round"),
    })
    .safeParse(input);
  if (!parsed.success) return { error: "Invalid table settings" };

  const { wedding } = await requireWedding();
  const supabase = await createClient();

  // Next table number
  const { data: existing } = await supabase
    .from("tables")
    .select("table_number")
    .eq("wedding_id", wedding.id);

  const nextNumber =
    Math.max(0, ...(existing ?? []).map((t) => t.table_number ?? 0)) + 1;

  const count = existing?.length ?? 0;
  const col = count % 3;
  const row = Math.floor(count / 3);

  const { data: created, error } = await supabase
    .from("tables")
    .insert({
      wedding_id: wedding.id,
      table_number: nextNumber,
      shape: parsed.data.shape,
      capacity: parsed.data.capacity,
      pos_x: 40 + col * 280,
      pos_y: 40 + row * 220,
    })
    .select("id")
    .single();

  if (error || !created) {
    console.error("addTable:", error);
    return { error: "Failed to add table." };
  }

  revalidatePath("/seating");
  return { ok: true };
}

export async function moveTable(input: unknown): Promise<ActionResult> {
  const parsed = z
    .object({
      id: z.string().uuid(),
      pos_x: z.coerce.number(),
      pos_y: z.coerce.number(),
    })
    .safeParse(input);
  if (!parsed.success) return { error: "Invalid position" };

  await requireWedding();
  const supabase = await createClient();

  const { error } = await supabase
    .from("tables")
    .update({ pos_x: parsed.data.pos_x, pos_y: parsed.data.pos_y })
    .eq("id", parsed.data.id);

  if (error) {
    console.error("moveTable:", error);
    return { error: "Failed to move table." };
  }
  return { ok: true };
}

export async function deleteTable(input: unknown): Promise<ActionResult> {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { error: "Invalid table" };

  await requireWedding();
  const supabase = await createClient();
  const { error } = await supabase
    .from("tables")
    .delete()
    .eq("id", parsed.data.id);

  if (error) {
    console.error("deleteTable:", error);
    return { error: "Failed to delete table." };
  }

  revalidatePath("/seating");
  return { ok: true };
}

export async function assignGuest(input: unknown): Promise<ActionResult> {
  const parsed = z
    .object({
      guestId: z.string().uuid(),
      tableId: z.string().uuid().nullable(),
    })
    .safeParse(input);
  if (!parsed.success) return { error: "Invalid assignment" };

  await requireWedding();
  const supabase = await createClient();

  const { error } = await supabase
    .from("guests")
    .update({ table_id: parsed.data.tableId })
    .eq("id", parsed.data.guestId);

  if (error) {
    console.error("assignGuest:", error);
    return { error: "Failed to seat guest." };
  }

  revalidatePath("/seating");
  revalidatePath("/dashboard");
  return { ok: true };
}
