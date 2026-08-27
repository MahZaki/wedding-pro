"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/wedding";
import { computeTableLayout } from "@/components/seating/helpers";
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

  const { data: existing } = await supabase
    .from("tables")
    .select("id, table_number, shape, capacity")
    .eq("wedding_id", wedding.id);

  const nextNumber =
    Math.max(0, ...(existing ?? []).map((t) => t.table_number ?? 0)) + 1;

  // Compute layout including the new table so it lands in the first
  // free grid slot without overlapping the others.
  const layout = computeTableLayout([
    ...(existing ?? []).map((t) => ({
      id: t.id,
      shape: (t.shape ?? "round") as "round" | "banquet" | "square",
      capacity: t.capacity,
      table_number: t.table_number ?? 0,
    })),
    { id: "new", shape: parsed.data.shape, capacity: parsed.data.capacity, table_number: nextNumber },
  ]);

  const pos = layout.positions.get("new") ?? { x: 60, y: 60 };

  const { data: created, error } = await supabase
    .from("tables")
    .insert({
      wedding_id: wedding.id,
      table_number: nextNumber,
      shape: parsed.data.shape,
      capacity: parsed.data.capacity,
      pos_x: pos.x,
      pos_y: pos.y,
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

export async function swapTableOrder(input: unknown): Promise<ActionResult> {
  const parsed = z
    .object({
      idA: z.string().uuid(),
      idB: z.string().uuid(),
    })
    .safeParse(input);
  if (!parsed.success) return { error: "Invalid tables" };

  const { wedding } = await requireWedding();
  const supabase = await createClient();

  const { data: tables, error: fetchErr } = await supabase
    .from("tables")
    .select("id, table_number")
    .eq("wedding_id", wedding.id)
    .in("id", [parsed.data.idA, parsed.data.idB]);

  if (fetchErr || !tables || tables.length !== 2) {
    console.error("swapTableOrder fetch:", fetchErr);
    return { error: "Could not find tables." };
  }

  const a = tables.find((t) => t.id === parsed.data.idA);
  const b = tables.find((t) => t.id === parsed.data.idB);
  if (!a || !b) return { error: "Could not find tables." };

  const numA = a.table_number ?? 0;
  const numB = b.table_number ?? 0;

  // Swap via two updates (numbers are unique and not unique-constrained in
  // this migration, so no intermediate collision issue).
  const { error: errB } = await supabase
    .from("tables")
    .update({ table_number: numA })
    .eq("id", b.id);
  if (errB) {
    console.error("swapTableOrder B:", errB);
    return { error: "Failed to reorder tables." };
  }
  const { error: errA } = await supabase
    .from("tables")
    .update({ table_number: numB })
    .eq("id", a.id);
  if (errA) {
    console.error("swapTableOrder A:", errA);
    return { error: "Failed to reorder tables." };
  }

  revalidatePath("/seating");
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

export async function swapGuests(input: unknown): Promise<ActionResult> {
  const parsed = z
    .object({
      guestIdA: z.string().uuid(),
      guestIdB: z.string().uuid(),
    })
    .safeParse(input);
  if (!parsed.success) return { error: "Invalid swap" };

  await requireWedding();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("guests")
    .select("id, table_id")
    .in("id", [parsed.data.guestIdA, parsed.data.guestIdB]);

  if (error || !data || data.length !== 2) {
    console.error("swapGuests fetch:", error);
    return { error: "Guests not found." };
  }

  const a = data.find((g) => g.id === parsed.data.guestIdA)!;
  const b = data.find((g) => g.id === parsed.data.guestIdB)!;

  // Already used for the same table (or pool) — nothing to do.
  if (a.table_id === b.table_id) {
    revalidatePath("/seating");
    return { ok: true };
  }

  const { error: errA } = await supabase
    .from("guests")
    .update({ table_id: b.table_id })
    .eq("id", a.id);
  if (errA) {
    console.error("swapGuests A:", errA);
    return { error: "Failed to swap guests." };
  }

  const { error: errB } = await supabase
    .from("guests")
    .update({ table_id: a.table_id })
    .eq("id", b.id);
  if (errB) {
    console.error("swapGuests B:", errB);
    return { error: "Failed to swap guests." };
  }

  revalidatePath("/seating");
  revalidatePath("/dashboard");
  return { ok: true };
}
