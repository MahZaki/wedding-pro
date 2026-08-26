"use client";

import { useState } from "react";
import { Plus, Store, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  saveVendor,
  deleteVendor,
} from "@/app/(app)/vendors/actions";

export interface VendorView {
  id: string;
  category: string;
  business_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
}

const CATEGORY_OPTIONS = [
  "Venue",
  "Catering",
  "Photography",
  "Videography",
  "Florals",
  "Music/DJ",
  "Planner/Coordinator",
  "Attire",
  "Lighting & Decor",
  "Cake",
  "Transportation",
  "Other",
].map((c) => ({ value: c, label: c }));

export function VendorList({
  vendors,
  readOnly = false,
}: {
  vendors: VendorView[];
  readOnly?: boolean;
}) {
  const [editing, setEditing] = useState<VendorView | null>(null);
  const [creating, setCreating] = useState(false);

  const grouped = vendors.reduce<Record<string, VendorView[]>>((acc, v) => {
    (acc[v.category] ??= []).push(v);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl lg:text-3xl font-bold text-ink-700">
          Vendors
        </h1>
        {!readOnly && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="w-4 h-4" /> Add vendor
          </Button>
        )}
      </div>

      <p className="text-xs text-ink-400 -mt-4">
        Your private CRM — vendor details are never shared or sold.
      </p>

      {vendors.length === 0 ? (
        <div className="bg-white rounded-lg border border-stone-200">
          <EmptyState
            icon={Store}
            title="No vendors yet"
            description="Add the vendors you're working with to keep all contacts and notes in one private place."
            action={
              !readOnly ? (
                <Button onClick={() => setCreating(true)}>Add Vendor</Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        Object.entries(grouped).map(([category, list]) => (
          <section key={category}>
            <h2 className="font-heading text-lg font-semibold text-ink-700 mb-2">
              {category}
              <span className="ml-2 text-xs font-body font-normal text-ink-400">
                {list.length}
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {list.map((v) => (
                <VendorCard
                  key={v.id}
                  vendor={v}
                  readOnly={readOnly}
                  onEdit={() => setEditing(v)}
                />
              ))}
            </div>
          </section>
        ))
      )}

      <VendorFormModal
        open={creating || editing !== null}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        vendor={editing}
      />
    </div>
  );
}

function VendorCard({
  vendor,
  readOnly,
  onEdit,
}: {
  vendor: VendorView;
  readOnly: boolean;
  onEdit: () => void;
}) {
  const { toast } = useToast();

  function remove() {
    if (!confirm(`Delete ${vendor.business_name}?`)) return;
    void (async () => {
      const result = await deleteVendor({ id: vendor.id });
      if (result?.error) toast("error", result.error);
      else toast("success", "Vendor deleted");
    })();
  }

  return (
    <div className="bg-white rounded-lg border border-stone-200 p-4 flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-ink-700 truncate">
            {vendor.business_name}
          </p>
          {vendor.contact_name && (
            <p className="text-xs text-ink-400">{vendor.contact_name}</p>
          )}
        </div>
        {!readOnly && (
          <div className="flex flex-shrink-0 gap-1">
            <button
              onClick={onEdit}
              aria-label={`Edit ${vendor.business_name}`}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-ink-400 hover:text-ink-600 hover:bg-ink-100"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={remove}
              aria-label={`Delete ${vendor.business_name}`}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-ink-400 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      <div className="mt-2 space-y-0.5 text-sm text-ink-500">
        {vendor.email && <p>{vendor.email}</p>}
        {vendor.phone && <p>{vendor.phone}</p>}
        {vendor.website && (
          <a
            href={
              vendor.website.startsWith("http")
                ? vendor.website
                : `https://${vendor.website}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-bordeaux-600 hover:underline break-all"
          >
            {vendor.website}
          </a>
        )}
      </div>
      {vendor.notes && (
        <p className="mt-2 text-xs text-ink-400 line-clamp-2">{vendor.notes}</p>
      )}
    </div>
  );
}

function VendorFormModal({
  open,
  onClose,
  vendor,
}: {
  open: boolean;
  onClose: () => void;
  vendor: VendorView | null;
}) {
  const [category, setCategory] = useState(vendor?.category ?? "Venue");
  const [businessName, setBusinessName] = useState(vendor?.business_name ?? "");
  const [contactName, setContactName] = useState(vendor?.contact_name ?? "");
  const [email, setEmail] = useState(vendor?.email ?? "");
  const [phone, setPhone] = useState(vendor?.phone ?? "");
  const [website, setWebsite] = useState(vendor?.website ?? "");
  const [notes, setNotes] = useState(vendor?.notes ?? "");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Reset fields when a different vendor is opened
  const [lastKey, setLastKey] = useState("");
  const key = `${open}-${vendor?.id ?? "new"}`;
  if (key !== lastKey) {
    setLastKey(key);
    setCategory(vendor?.category ?? "Venue");
    setBusinessName(vendor?.business_name ?? "");
    setContactName(vendor?.contact_name ?? "");
    setEmail(vendor?.email ?? "");
    setPhone(vendor?.phone ?? "");
    setWebsite(vendor?.website ?? "");
    setNotes(vendor?.notes ?? "");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!businessName.trim()) {
      toast("warning", "Business name is required");
      return;
    }
    setLoading(true);
    const result = await saveVendor({
      id: vendor?.id,
      category,
      business_name: businessName.trim(),
      contact_name: contactName,
      email,
      phone,
      website,
      notes,
    });
    setLoading(false);

    if (result?.error) {
      toast("error", result.error);
      return;
    }
    toast("success", vendor ? "Vendor updated" : "Vendor added");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={vendor ? "Edit vendor" : "Add vendor"}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="block text-sm font-medium text-ink-700 mb-1">
            Category
          </span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full min-h-[44px] px-3 border border-ink-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-bordeaux-500"
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <Input
          label="Business name"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          required
        />
        <Input
          label="Contact name"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Input
          label="Website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
        <Input
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything worth remembering…"
        />
        <Button type="submit" loading={loading} className="w-full">
          {vendor ? "Save changes" : "Add vendor"}
        </Button>
      </form>
    </Modal>
  );
}
