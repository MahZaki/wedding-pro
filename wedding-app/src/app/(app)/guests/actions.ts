"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/wedding";
import type { ActionResult } from "@/lib/action-result";
import { guestProfileSchema } from "@/lib/schemas/guest";
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

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

export type { GuestProfileInput } from "@/lib/schemas/guest";

export async function updateGuestProfile(input: unknown): Promise<ActionResult> {
  const parsed = guestProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { role } = await requireWedding();
  if (role === "viewer") return { error: "Viewers can't edit guests." };
  const supabase = await createClient();

  const { id, ...fields } = parsed.data;
  const { error } = await supabase.from("guests").update(fields).eq("id", id);

  if (error) {
    console.error("updateGuestProfile:", error);
    return { error: "Failed to save. Please try again." };
  }

  revalidatePath("/guests");
  revalidatePath("/dashboard");
  return { ok: true };
}

const groupSchema = z.object({ name: z.string().trim().min(1).max(80) });
const groupIdSchema = z.object({ id: z.string().uuid() });

export async function createGroup(input: unknown): Promise<ActionResult> {
  const parsed = groupSchema.safeParse(input);
  if (!parsed.success) return { error: "Enter a group name" };
  const { wedding, role } = await requireWedding();
  if (role === "viewer") return { error: "Viewers can't create groups." };
  const supabase = await createClient();

  const { error } = await supabase
    .from("guest_groups")
    .insert({ wedding_id: wedding.id, name: parsed.data.name });

  if (error) {
    console.error("createGroup:", error);
    return { error: "Failed to create group." };
  }
  revalidatePath("/guests");
  return { ok: true };
}

export async function renameGroup(input: unknown): Promise<ActionResult> {
  const parsed = z
    .object({ id: z.string().uuid(), name: z.string().trim().min(1).max(80) })
    .safeParse(input);
  if (!parsed.success) return { error: "Enter a group name" };
  const { role } = await requireWedding();
  if (role === "viewer") return { error: "Viewers can't edit groups." };
  const supabase = await createClient();

  const { error } = await supabase
    .from("guest_groups")
    .update({ name: parsed.data.name })
    .eq("id", parsed.data.id);

  if (error) {
    console.error("renameGroup:", error);
    return { error: "Failed to rename group." };
  }
  revalidatePath("/guests");
  return { ok: true };
}

export async function deleteGroup(input: unknown): Promise<ActionResult> {
  const parsed = groupIdSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid group" };
  const { role } = await requireWedding();
  if (role === "viewer") return { error: "Viewers can't delete groups." };
  const supabase = await createClient();

  const { error } = await supabase
    .from("guest_groups")
    .delete()
    .eq("id", parsed.data.id);

  if (error) {
    console.error("deleteGroup:", error);
    return { error: "Failed to delete group." };
  }
  revalidatePath("/guests");
  return { ok: true };
}

const pdfStyles = StyleSheet.create({
  page: { padding: 32, fontFamily: "Helvetica", fontSize: 11, color: "#1c1b1a" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#5f574e", marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: "bold", marginTop: 14, marginBottom: 8 },
  table: { width: "100%", borderWidth: 1, borderColor: "#ded7ce", borderStyle: "solid" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#ded7ce", borderBottomStyle: "solid" },
  cell: { flex: 1, padding: 6 },
  cellAmount: { width: 80, padding: 6 },
  head: { backgroundColor: "#efeae4", fontWeight: "bold" },
});

export async function generateCatererSummary(): Promise<
  { ok: true; pdfDataUrl: string } | { error: string }
> {
  const { wedding, role } = await requireWedding();
  if (role === "viewer") return { error: "Viewers can't download the summary." };
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("guests")
    .select(`id, first_name, last_name, meal_preference, allergies, rsvps(status)`)
    .eq("wedding_id", wedding.id);

  if (error) {
    console.error("generateCatererSummary:", error);
    return { error: "Failed to load guests." };
  }

  const attending = (data ?? []).filter(
    (g) =>
      (g.rsvps as Array<{ status: string | null }> | null)?.[0]?.status ===
      "attending"
  );

  const mealCounts = new Map<string, number>();
  const allergyMap = new Map<string, string[]>();
  for (const g of attending) {
    const meal = g.meal_preference?.trim().toLowerCase();
    if (meal) mealCounts.set(meal, (mealCounts.get(meal) ?? 0) + 1);
    for (const a of g.allergies ?? []) {
      if (!a.trim()) continue;
      allergyMap.set(a, [...(allergyMap.get(a) ?? []), `${g.first_name} ${g.last_name}`]);
    }
  }

  const sortedMeals = [...mealCounts.entries()].sort((a, b) => b[1] - a[1]);
  const sortedByMeal = [...attending].sort((a, b) =>
    (a.meal_preference ?? "").localeCompare(b.meal_preference ?? "")
  );

  const pdf = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { style: pdfStyles.page },
      React.createElement(Text, { style: pdfStyles.title }, "Caterer Summary"),
      React.createElement(
        Text,
        { style: pdfStyles.subtitle },
        `${wedding.title} · Attending: ${attending.length}`
      ),
      React.createElement(Text, { style: pdfStyles.sectionTitle }, "Meal Preference"),
      React.createElement(
        View,
        { style: pdfStyles.table },
        React.createElement(
          View,
          { style: pdfStyles.row },
          React.createElement(Text, { style: [pdfStyles.cell, pdfStyles.head] }, "Meal"),
          React.createElement(Text, { style: [pdfStyles.cellAmount, pdfStyles.head] }, "Count")
        ),
        sortedMeals.map(([meal, count]) =>
          React.createElement(
            View,
            { key: meal, style: pdfStyles.row },
            React.createElement(Text, { style: pdfStyles.cell }, meal),
            React.createElement(Text, { style: pdfStyles.cellAmount, }, String(count))
          )
        )
      ),
      React.createElement(Text, { style: pdfStyles.sectionTitle }, "Attending Guest List"),
      React.createElement(
        View,
        { style: pdfStyles.table },
        React.createElement(
          View,
          { style: pdfStyles.row },
          React.createElement(Text, { style: [pdfStyles.cell, pdfStyles.head] }, "Name"),
          React.createElement(Text, { style: [pdfStyles.cell, pdfStyles.head] }, "Meal")
        ),
        sortedByMeal.map((g) =>
          React.createElement(
            View,
            { key: g.id ?? `${g.first_name} ${g.last_name}`, style: pdfStyles.row },
            React.createElement(
              Text,
              { style: pdfStyles.cell },
              `${g.first_name} ${g.last_name}`
            ),
            React.createElement(
              Text,
              { style: pdfStyles.cell },
              g.meal_preference ?? "—"
            )
          )
        )
      ),
      React.createElement(Text, { style: pdfStyles.sectionTitle }, "Allergies"),
      allergyMap.size === 0
        ? React.createElement(Text, { style: pdfStyles.cell }, "No allergies recorded.")
        : [...allergyMap.entries()].map(([tag, names]) =>
            React.createElement(
              View,
              { key: tag, style: pdfStyles.row },
              React.createElement(Text, { style: [pdfStyles.cell, pdfStyles.head] }, tag),
              React.createElement(Text, { style: pdfStyles.cell }, names.join(", "))
            )
          )
    )
  );

  const buffer = await renderToBuffer(pdf);
  return {
    ok: true,
    pdfDataUrl: `data:application/pdf;base64,${buffer.toString("base64")}`,
  };
}
