"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/wedding";
import type { ActionResult } from "@/lib/action-result";

const SEAT_R = 14;
const SAFETY = 24;

function tableFootprint(
  shape: "round" | "banquet" | "square",
  capacity: number,
): { width: number; height: number } {
  const body =
    shape === "round"
      ? { w: 160, h: 160 }
      : shape === "square"
        ? { w: 140, h: 140 }
        : { w: 200, h: 120 };

  const minW = body.w + 2 * (SEAT_R + SAFETY);
  const minH = body.h + 2 * (SEAT_R + SAFETY);

  // Estimate seats extent: circumference-based for round, perimeter for others
  let seatsW: number;
  let seatsH: number;

  if (shape === "round") {
    const r = Math.max(72, Math.ceil(capacity * 5.5));
    seatsW = 2 * (r + SEAT_R);
    seatsH = 2 * (r + SEAT_R);
  } else {
    const w = body.w;
    const h = body.h;
    // Seats distributed around perimeter; max extent ≈ body + seat margin
    seatsW = w + 2 * (SEAT_R + 8);
    seatsH = h + 2 * (SEAT_R + 8);
  }

  return {
    width: Math.max(minW, seatsW + 2 * SAFETY),
    height: Math.max(minH, seatsH + 2 * SAFETY),
  };
}

function rectsOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
): boolean {
  return !(
    a.x + a.w <= b.x ||
    b.x + b.w <= a.x ||
    a.y + a.h <= b.y ||
    b.y + b.h <= a.y
  );
}

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
    .select("table_number, shape, capacity, pos_x, pos_y")
    .eq("wedding_id", wedding.id);

  const nextNumber =
    Math.max(0, ...(existing ?? []).map((t) => t.table_number ?? 0)) + 1;

  // Footprint-aware placement
  const newFp = tableFootprint(parsed.data.shape, parsed.data.capacity);
  const GAP_X = 64;
  const GAP_Y = 80;
  const PAD = 60;
  const CANVAS_W = 1100;

  const occupied: Array<{ x: number; y: number; w: number; h: number }> =
    (existing ?? []).map((t) => {
      const fp = tableFootprint(
        (t.shape ?? "round") as "round" | "banquet" | "square",
        t.capacity,
      );
      return {
        x: Number(t.pos_x ?? 0),
        y: Number(t.pos_y ?? 0),
        w: fp.width,
        h: fp.height,
      };
    });

  let px = PAD;
  let py = PAD;
  const newRect = { x: px, y: py, w: newFp.width, h: newFp.height };

  // Find first non-overlapping position
  for (let attempt = 0; attempt < 200; attempt++) {
    newRect.x = px;
    newRect.y = py;
    const overlaps = occupied.some((r) => rectsOverlap(newRect, r));
    if (!overlaps) break;
    px += newFp.width + GAP_X;
    if (px + newFp.width > CANVAS_W) {
      px = PAD;
      py += newFp.height + GAP_Y;
    }
  }

  const { data: created, error } = await supabase
    .from("tables")
    .insert({
      wedding_id: wedding.id,
      table_number: nextNumber,
      shape: parsed.data.shape,
      capacity: parsed.data.capacity,
      pos_x: newRect.x,
      pos_y: newRect.y,
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
