import type { Metadata } from "next";
import { requireWedding } from "@/lib/wedding";
import { createClient } from "@/lib/supabase/server";
import { VendorList } from "@/components/vendors/VendorList";

export const metadata: Metadata = { title: "Vendors" };

export default async function VendorsPage() {
  const { wedding, role } = await requireWedding();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .eq("wedding_id", wedding.id)
    .order("category")
    .order("business_name");

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
        Failed to load vendors. Please refresh the page.
      </div>
    );
  }

  return (
    <VendorList
      vendors={
        data?.map((v) => ({
          id: v.id,
          category: v.category,
          business_name: v.business_name,
          contact_name: v.contact_name,
          email: v.email,
          phone: v.phone,
          website: v.website,
          notes: v.notes,
        })) ?? []
      }
      readOnly={role === "viewer"}
    />
  );
}
