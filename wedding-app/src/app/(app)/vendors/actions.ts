"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/wedding";
import type { ActionResult } from "@/lib/action-result";

const vendorSchema = z.object({
  id: z.string().uuid().optional(),
  category: z.string().min(1, "Category is required").max(60),
  business_name: z.string().min(1, "Business name is required").max(160),
  contact_name: z.string().max(120).optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  website: z.string().max(240).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export async function saveVendor(input: unknown): Promise<ActionResult> {
  const parsed = vendorSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { wedding } = await requireWedding();
  const supabase = await createClient();

  const { id, ...rest } = parsed.data;
  const fields = {
    category: rest.category,
    business_name: rest.business_name,
    contact_name: rest.contact_name || null,
    email: rest.email || null,
    phone: rest.phone || null,
    website: rest.website || null,
    notes: rest.notes || null,
  };

  if (id) {
    const { error } = await supabase
      .from("vendors")
      .update(fields)
      .eq("id", id);
    if (error) {
      console.error("saveVendor update:", error);
      return { error: "Failed to save vendor." };
    }
  } else {
    const { error } = await supabase
      .from("vendors")
      .insert({ ...fields, wedding_id: wedding.id });
    if (error) {
      console.error("saveVendor insert:", error);
      return { error: "Failed to add vendor." };
    }
  }

  revalidatePath("/vendors");
  return { ok: true };
}

export async function deleteVendor(input: unknown): Promise<ActionResult> {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { error: "Invalid vendor" };

  await requireWedding();
  const supabase = await createClient();

  const { error } = await supabase
    .from("vendors")
    .delete()
    .eq("id", parsed.data.id);

  if (error) {
    console.error("deleteVendor:", error);
    return { error: "Failed to delete vendor." };
  }

  revalidatePath("/vendors");
  return { ok: true };
}
