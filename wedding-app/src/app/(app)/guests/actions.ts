"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/wedding";
import type { ActionResult } from "@/lib/action-result";

const guestSchema = z.object({
  id: z.string().uuid().optional(),
  first_name: z.string().min(1, "First name is required").max(80),
  last_name: z.string().min(1, "Last name is required").max(80),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  side: z.enum(["bride", "groom", "both"]).optional(),
});

export async function saveGuest(input: unknown): Promise<ActionResult> {
  const parsed = guestSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { wedding } = await requireWedding();
  const supabase = await createClient();

  const { id, ...rest } = parsed.data;
  const fields = {
    first_name: rest.first_name.trim(),
    last_name: rest.last_name.trim(),
    email: rest.email || null,
    phone: rest.phone || null,
    side: rest.side ?? null,
  };

  if (id) {
    const { error } = await supabase.from("guests").update(fields).eq("id", id);
    if (error) {
      console.error("saveGuest update:", error);
      return { error: "Failed to save guest." };
    }
  } else {
    const { error } = await supabase
      .from("guests")
      .insert({ ...fields, wedding_id: wedding.id });
    if (error) {
      console.error("saveGuest insert:", error);
      return { error: "Failed to add guest." };
    }
  }

  revalidatePath("/guests");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteGuest(input: unknown): Promise<ActionResult> {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { error: "Invalid guest" };

  await requireWedding();
  const supabase = await createClient();
  const { error } = await supabase
    .from("guests")
    .delete()
    .eq("id", parsed.data.id);

  if (error) {
    console.error("deleteGuest:", error);
    return { error: "Failed to delete guest." };
  }

  revalidatePath("/guests");
  revalidatePath("/dashboard");
  return { ok: true };
}

const csvRowSchema = z.object({
  first_name: z.string().min(1).max(80),
  last_name: z.string().min(1).max(80),
  email: z.string().email().nullable(),
  phone: z.string().max(40).nullable(),
  group: z.string().max(80).nullable(),
});

const importSchema = z.object({
  rows: z.array(csvRowSchema).min(1).max(2000),
});

export type ImportResult = {
  imported?: number;
  duplicates?: number;
  error?: string;
};

export async function importGuests(input: unknown): Promise<ImportResult> {
  const parsed = importSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "CSV contains invalid rows. Check the preview." };
  }

  const { wedding } = await requireWedding();
  const supabase = await createClient();

  // Fetch existing emails for deduplication
  const { data: existing } = await supabase
    .from("guests")
    .select("email")
    .eq("wedding_id", wedding.id);

  const existingEmails = new Set(
    (existing ?? [])
      .map((g) => g.email?.toLowerCase())
      .filter((e): e is string => !!e)
  );

  // Dedup within the file itself and against existing list
  const seen = new Set<string>();
  const toInsert: Array<{
    wedding_id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
  }> = [];
  let duplicates = 0;

  for (const row of parsed.data.rows) {
    const key = row.email ? row.email.toLowerCase() : `name:${row.first_name}:${row.last_name}`;
    if (existingEmails.has(key) || seen.has(key)) {
      duplicates++;
      continue;
    }
    seen.add(key);
    toInsert.push({
      wedding_id: wedding.id,
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
      phone: row.phone,
    });
  }

  if (toInsert.length === 0) {
    return { imported: 0, duplicates };
  }

  // Insert in chunks of 500
  for (let i = 0; i < toInsert.length; i += 500) {
    const chunk = toInsert.slice(i, i + 500);
    const { error } = await supabase.from("guests").insert(chunk);
    if (error) {
      console.error("importGuests:", error);
      return { error: "Import failed partway. Please try again." };
    }
  }

  revalidatePath("/guests");
  revalidatePath("/dashboard");
  return { imported: toInsert.length, duplicates };
}
