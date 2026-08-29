"use client";

import { useState } from "react";
import {
  Plus,
  Store,
  Pencil,
  Trash2,
  Star,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  saveVendor,
  deleteVendor,
  updateVendorRating,
  bookVendor,
} from "@/app/(app)/vendors/actions";
import {
  VendorStatusBadge,
  type VendorStatus,
} from "./VendorStatusBadge";
import { VendorDocuments } from "./VendorDocuments";
import {
  VendorComparison,
  type VendorCompareView,
} from "./VendorComparison";

export interface VendorDocumentView {
  id: string;
  name: string;
  doc_type: string | null;
  uploaded_at: string | null;
}

export interface VendorView {
  id: string;
  category: string;
  business_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  status: VendorStatus;
  rating: number | null;
  instagram: string | null;
  quote_amount: number | null;
  documents: VendorDocumentView[];
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

const STATUS_FILTERS: Array<{ value: VendorStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "researching", label: "Researching" },
  { value: "contacted", label: "Contacted" },
  { value: "quoted", label: "Quoted" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "booked", label: "Booked" },
  { value: "paid", label: "Paid" },
];

export function VendorList({
  vendors,
  readOnly = false,
}: {
  vendors: VendorView[];
  readOnly?: boolean;
}) {
  const [editing, setEditing] = useState<VendorView | null>(null);
  const [creating, setCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<VendorStatus | "all">("all");
  const [comparing, setComparing] = useState<string[]>([]);
  const { toast } = useToast();

  const filtered =
    statusFilter === "all"
      ? vendors
      : vendors.filter((v) => v.status === statusFilter);

  const grouped = filtered.reduce<Record<string, VendorView[]>>((acc, v) => {
    (acc[v.category] ??= []).push(v);
    return acc;
  }, {});

  function toggleCompare(id: string, category: string) {
    const current = comparing
      .map((cid) => vendors.find((v) => v.id === cid)!)
      .filter(Boolean);

    if (comparing.includes(id)) {
      setComparing(comparing.filter((cid) => cid !== id));
      return;
    }

    const selectedCategory = current[0]?.category;
    if (selectedCategory && selectedCategory !== category) {
      toast("warning", "You can only compare vendors in the same category.");
      return;
    }
    if (comparing.length >= 3) {
      toast("warning", "You can compare up to 3 vendors.");
      return;
    }
    setComparing([...comparing, id]);
  }

  const comparedVendors: VendorCompareView[] = comparing
    .map((cid) => vendors.find((v) => v.id === cid))
    .filter((v): v is VendorView => !!v)
    .map((v) => ({
      id: v.id,
      business_name: v.business_name,
      status: v.status,
      rating: v.rating,
      website: v.website,
      notes: v.notes,
      quote_amount: v.quote_amount,
    }));

  async function handleBooked(id: string) {
    const result = await bookVendor({ id });
    if (result?.error) toast("error", result.error);
    else toast("success", "Vendor booked");
  }

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

      {vendors.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "flex-shrink-0 min-h-[36px] px-3 rounded-full text-sm font-medium transition-colors border",
                statusFilter === f.value
                  ? "bg-bordeaux-500 text-white border-bordeaux-500"
                  : "bg-white text-ink-600 border-ink-200 hover:bg-ink-50"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-stone-200">
          {vendors.length === 0 ? (
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
          ) : (
            <EmptyState
              icon={Store}
              title="No vendors in this status"
              description="Try a different filter."
            />
          )}
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
                  comparing={comparing.includes(v.id)}
                  onToggleCompare={() => toggleCompare(v.id, v.category)}
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

      <VendorComparison
        compared={comparedVendors}
        onClear={() => setComparing([])}
        onBooked={handleBooked}
      />
    </div>
  );
}

function VendorCard({
  vendor,
  readOnly,
  onEdit,
  comparing,
  onToggleCompare,
}: {
  vendor: VendorView;
  readOnly: boolean;
  onEdit: () => void;
  comparing: boolean;
  onToggleCompare: () => void;
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

  async function setRating(rating: number) {
    const result = await updateVendorRating({ id: vendor.id, rating });
    if (result?.error) toast("error", result.error);
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
        <div className="flex flex-shrink-0 items-center gap-1">
          {!readOnly && (
            <button
              onClick={onToggleCompare}
              aria-label={`Compare ${vendor.business_name}`}
              className={cn(
                "min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg",
                comparing
                  ? "text-bordeaux-500 bg-bordeaux-100"
                  : "text-ink-300 hover:text-bordeaux-600 hover:bg-ink-100"
              )}
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          {!readOnly && (
            <button
              onClick={onEdit}
              aria-label={`Edit ${vendor.business_name}`}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-ink-400 hover:text-ink-600 hover:bg-ink-100"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {!readOnly && (
            <button
              onClick={remove}
              aria-label={`Delete ${vendor.business_name}`}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-ink-400 hover:text-error-600 hover:bg-error-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <VendorStatusBadge
          vendorId={vendor.id}
          status={vendor.status}
          readOnly={readOnly}
        />
        <div className="ml-auto flex items-center gap-0.5">
          {!readOnly ? (
            [1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`Rate ${n} of 5 stars`}
                onClick={() => setRating(n)}
                className={cn(
                  "min-w-[28px] min-h-[28px] flex items-center justify-center",
                  (vendor.rating ?? 0) >= n
                    ? "text-warning-700"
                    : "text-ink-200 hover:text-warning-300"
                )}
              >
                <Star className="w-4 h-4 fill-current" />
              </button>
            ))
          ) : (
            <span className="text-sm text-warning-700">
              {"★".repeat(vendor.rating ?? 0)}
              <span className="text-ink-200">
                {"★".repeat(5 - (vendor.rating ?? 0))}
              </span>
            </span>
          )}
        </div>
      </div>

      {vendor.instagram && (
        <p className="mt-2 text-sm text-ink-500">@{vendor.instagram}</p>
      )}

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

      <VendorDocuments
        vendorId={vendor.id}
        documents={vendor.documents}
        readOnly={readOnly}
      />
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
  const [instagram, setInstagram] = useState(vendor?.instagram ?? "");
  const [quoteAmount, setQuoteAmount] = useState(
    vendor?.quote_amount != null ? String(vendor.quote_amount) : ""
  );
  const [notes, setNotes] = useState(vendor?.notes ?? "");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
    setInstagram(vendor?.instagram ?? "");
    setQuoteAmount(vendor?.quote_amount != null ? String(vendor.quote_amount) : "");
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
      instagram,
      quote_amount: quoteAmount === "" ? null : Number(quoteAmount),
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
          label="Instagram"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          placeholder="@handle"
        />
        <Input
          label="Quote amount"
          type="number"
          min="0"
          step="0.01"
          value={quoteAmount}
          onChange={(e) => setQuoteAmount(e.target.value)}
          placeholder="0.00"
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
