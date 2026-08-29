"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/wedding";
import { uploadVendorDocument, getSignedUrl } from "@/lib/supabase/storage";
import type { ActionResult } from "@/lib/action-result";

const VENDOR_STATUSES = [
  "researching",
  "contacted",
  "quoted",
  "shortlisted",
  "booked",
  "paid",
  "completed",
] as const;

const vendorSchema = z.object({
  id: z.string().uuid().optional(),
  category: z.string().min(1, "Category is required").max(60),
  business_name: z.string().min(1, "Business name is required").max(160),
  contact_name: z.string().max(120).optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  website: z.string().max(240).optional().or(z.literal("")),
  instagram: z.string().max(120).optional().or(z.literal("")),
  quote_amount: z.coerce.number().min(0).max(99999999).optional().nullable(),
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
    instagram: rest.instagram || null,
    quote_amount: rest.quote_amount ?? null,
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

const statusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(VENDOR_STATUSES),
});

export async function updateVendorStatus(input: unknown): Promise<ActionResult> {
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid status" };

  await requireWedding();
  const supabase = await createClient();

  const update = { status: parsed.data.status } as {
    status: string;
    booked_at?: string;
  };
  if (parsed.data.status === "booked") {
    update.booked_at = new Date().toISOString().slice(0, 10);
  }

  const { error } = await supabase
    .from("vendors")
    .update(update)
    .eq("id", parsed.data.id);

  if (error) {
    console.error("updateVendorStatus:", error);
    return { error: "Failed to update status." };
  }

  revalidatePath("/vendors");
  revalidatePath("/dashboard");
  return { ok: true };
}

const ratingSchema = z.object({
  id: z.string().uuid(),
  rating: z.number().int().min(0).max(5),
});

export async function updateVendorRating(input: unknown): Promise<ActionResult> {
  const parsed = ratingSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid rating" };

  await requireWedding();
  const supabase = await createClient();

  const rating = parsed.data.rating === 0 ? null : parsed.data.rating;
  const { error } = await supabase
    .from("vendors")
    .update({ rating })
    .eq("id", parsed.data.id);

  if (error) {
    console.error("updateVendorRating:", error);
    return { error: "Failed to update rating." };
  }

  revalidatePath("/vendors");
  return { ok: true };
}

const bookVendorSchema = z.object({ id: z.string().uuid() });

export async function bookVendor(input: unknown): Promise<ActionResult> {
  const parsed = bookVendorSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid vendor" };

  await requireWedding();
  const supabase = await createClient();

  const { error } = await supabase
    .from("vendors")
    .update({ status: "booked", booked_at: new Date().toISOString().slice(0, 10) })
    .eq("id", parsed.data.id);

  if (error) {
    console.error("bookVendor:", error);
    return { error: "Failed to book vendor." };
  }

  revalidatePath("/vendors");
  revalidatePath("/dashboard");
  return { ok: true };
}

const DOC_TYPES = ["contract", "invoice", "insurance", "quote", "other"] as const;

const uploadDocSchema = z.object({
  vendor_id: z.string().uuid(),
  doc_type: z.enum(DOC_TYPES).default("other"),
});

export async function uploadVendorDoc(
  input: unknown,
  file: File
): Promise<ActionResult> {
  const parsed = uploadDocSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid document" };

  const { wedding } = await requireWedding();
  const supabase = await createClient();

  const { path, error } = await uploadVendorDocument(
    wedding.id,
    parsed.data.vendor_id,
    file
  );
  if (error) return { error };
  if (!path) return { error: "Upload failed." };

  const { error: insertError } = await supabase
    .from("vendor_documents")
    .insert({
      vendor_id: parsed.data.vendor_id,
      wedding_id: wedding.id,
      name: file.name,
      doc_type: parsed.data.doc_type,
      storage_url: path,
    });

  if (insertError) {
    console.error("uploadVendorDoc insert:", insertError);
    return { error: "Failed to save document." };
  }

  revalidatePath("/vendors");
  return { ok: true };
}

const docIdSchema = z.object({ id: z.string().uuid() });

export async function deleteVendorDocument(input: unknown): Promise<ActionResult> {
  const parsed = docIdSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid document" };

  await requireWedding();
  const supabase = await createClient();

  const { error } = await supabase
    .from("vendor_documents")
    .delete()
    .eq("id", parsed.data.id);

  if (error) {
    console.error("deleteVendorDocument:", error);
    return { error: "Failed to delete document." };
  }

  revalidatePath("/vendors");
  return { ok: true };
}

export async function getDocumentUrl(input: unknown): Promise<{ url?: string; error?: string }> {
  const parsed = docIdSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid document" };

  await requireWedding();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("vendor_documents")
    .select("storage_url")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (error || !data?.storage_url) {
    return { error: "Document not found." };
  }

  const url = await getSignedUrl(data.storage_url);
  if (!url) return { error: "Couldn't generate a download link." };

  return { url };
}
