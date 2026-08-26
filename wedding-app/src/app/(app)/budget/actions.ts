"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/wedding";
import type { ActionResult } from "@/lib/action-result";

const updateItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120).optional(),
  estimated_cost: z.coerce.number().min(0).max(100_000_000).optional(),
  actual_cost: z.coerce.number().min(0).max(100_000_000).nullable().optional(),
  is_paid: z.boolean().optional(),
});

export async function updateBudgetItem(input: unknown): Promise<ActionResult> {
  const parsed = updateItemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { id, ...fields } = parsed.data;
  await requireWedding();
  const supabase = await createClient();

  const { error } = await supabase
    .from("budget_items")
    .update(fields)
    .eq("id", id);

  if (error) {
    console.error("updateBudgetItem:", error);
    return { error: "Failed to save. Please try again." };
  }

  revalidatePath("/budget");
  revalidatePath("/dashboard");
  return { ok: true };
}

const addItemSchema = z.object({
  category_id: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(120),
  estimated_cost: z.coerce.number().min(0).max(100_000_000),
});

export async function addBudgetItem(input: unknown): Promise<ActionResult> {
  const parsed = addItemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await requireWedding();
  const supabase = await createClient();

  const { error } = await supabase
    .from("budget_items")
    .insert(parsed.data);

  if (error) {
    console.error("addBudgetItem:", error);
    return { error: "Failed to add item. Please try again." };
  }

  revalidatePath("/budget");
  return { ok: true };
}

const addPaymentSchema = z.object({
  budget_item_id: z.string().uuid(),
  amount: z.coerce.number().min(0.01),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  notes: z.string().max(500).optional(),
});

export async function addPaymentSchedule(input: unknown): Promise<ActionResult> {
  const parsed = addPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await requireWedding();
  const supabase = await createClient();

  const { notes, ...rest } = parsed.data;
  const { error } = await supabase.from("payment_schedules").insert({
    ...rest,
    notes: notes || null,
  });

  if (error) {
    console.error("addPaymentSchedule:", error);
    return { error: "Failed to add payment. Please try again." };
  }

  revalidatePath("/budget");
  revalidatePath("/dashboard");
  return { ok: true };
}

const markPaidSchema = z.object({ id: z.string().uuid() });

export async function markPaymentPaid(input: unknown): Promise<ActionResult> {
  const parsed = markPaidSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid payment" };

  await requireWedding();
  const supabase = await createClient();

  const { error } = await supabase
    .from("payment_schedules")
    .update({ status: "paid" })
    .eq("id", parsed.data.id);

  if (error) {
    console.error("markPaymentPaid:", error);
    return { error: "Failed to update payment." };
  }

  revalidatePath("/budget");
  revalidatePath("/dashboard");
  return { ok: true };
}
