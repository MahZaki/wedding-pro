"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { updateVendorStatus } from "@/app/(app)/vendors/actions";

export const VENDOR_STATUSES = [
  "researching",
  "contacted",
  "quoted",
  "shortlisted",
  "booked",
  "paid",
  "completed",
] as const;

export type VendorStatus = (typeof VENDOR_STATUSES)[number];

const STATUS_LABELS: Record<VendorStatus, string> = {
  researching: "Researching",
  contacted: "Contacted",
  quoted: "Quoted",
  shortlisted: "Shortlisted",
  booked: "Booked",
  paid: "Paid",
  completed: "Completed",
};

const STATUS_STYLES: Record<VendorStatus, string> = {
  researching: "bg-ink-100 text-ink-600",
  contacted: "bg-bordeaux-100 text-bordeaux-700",
  quoted: "bg-warning-100 text-warning-700",
  shortlisted: "bg-bordeaux-300 text-white",
  booked: "bg-success-100 text-success-700",
  paid: "bg-success-600 text-white",
  completed: "bg-ink-200 text-ink-700",
};

export function VendorStatusBadge({
  vendorId,
  status,
  readOnly = false,
  onChanged,
}: {
  vendorId: string;
  status: VendorStatus;
  readOnly?: boolean;
  onChanged?: (status: VendorStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<VendorStatus>(status);
  const [saving, setSaving] = useState(false);

  async function change(next: VendorStatus) {
    if (next === value) {
      setOpen(false);
      return;
    }
    setSaving(true);
    const result = await updateVendorStatus({ id: vendorId, status: next });
    setSaving(false);
    if (!result?.error) {
      setValue(next);
      onChanged?.(next);
    }
    setOpen(false);
  }

  if (readOnly) {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
          STATUS_STYLES[value]
        )}
      >
        {STATUS_LABELS[value]}
      </span>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium min-h-[28px] hover:ring-2 hover:ring-ink-300 transition",
          STATUS_STYLES[value],
          saving && "opacity-60"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {STATUS_LABELS[value]}
        <svg
          className="w-3 h-3 opacity-70"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <ul
            className="absolute left-0 top-full z-20 mt-1 w-44 bg-white border border-ink-200 rounded-lg shadow-lg py-1 text-sm text-ink-700"
            role="listbox"
          >
            {VENDOR_STATUSES.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  role="option"
                  aria-selected={s === value}
                  onClick={() => change(s)}
                  className="w-full text-left px-3 py-2 hover:bg-ink-50 flex items-center justify-between min-h-[36px]"
                >
                  {STATUS_LABELS[s]}
                  {s === value && (
                    <span className="text-bordeaux-500">✓</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
