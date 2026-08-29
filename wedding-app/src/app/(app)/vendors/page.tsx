import type { Metadata } from "next";
import { requireWedding } from "@/lib/wedding";
import { createClient } from "@/lib/supabase/server";
import { VendorList, type VendorView } from "@/components/vendors/VendorList";

export const metadata: Metadata = { title: "Vendors" };

export default async function VendorsPage() {
  const { wedding, role } = await requireWedding();
  const supabase = await createClient();

  const [{ data: vendors, error }, { data: documents }] = await Promise.all([
    supabase
      .from("vendors")
      .select("*")
      .eq("wedding_id", wedding.id)
      .order("category")
      .order("business_name"),
    supabase
      .from("vendor_documents")
      .select("id, vendor_id, name, doc_type, uploaded_at")
      .eq("wedding_id", wedding.id),
  ]);

  if (error) {
    return (
      <div className="bg-error-50 border border-error-100 rounded-lg p-4 text-sm text-error-700">
        Failed to load vendors. Please refresh the page.
      </div>
    );
  }

  const docsByVendor = new Map<string, VendorView["documents"]>();
  (documents ?? []).forEach((doc) => {
    const key = doc.vendor_id ?? "";
    const list = docsByVendor.get(key) ?? [];
    list.push({
      id: doc.id,
      name: doc.name,
      doc_type: doc.doc_type,
      uploaded_at: doc.uploaded_at,
    });
    docsByVendor.set(key, list);
  });

  return (
    <VendorList
      vendors={(vendors ?? []).map((v) => ({
        id: v.id,
        category: v.category,
        business_name: v.business_name,
        contact_name: v.contact_name,
        email: v.email,
        phone: v.phone,
        website: v.website,
        notes: v.notes,
        status: (v.status as VendorView["status"]) ?? "researching",
        rating: v.rating,
        instagram: v.instagram,
        quote_amount: v.quote_amount,
        documents: docsByVendor.get(v.id) ?? [],
      }))}
      readOnly={role === "viewer"}
    />
  );
}
