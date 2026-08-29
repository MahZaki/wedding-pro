"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { VendorStatusBadge, type VendorStatus } from "./VendorStatusBadge";

export interface VendorCompareView {
  id: string;
  business_name: string;
  status: VendorStatus | null;
  quote_amount: number | null;
  rating: number | null;
  website: string | null;
  notes: string | null;
}

function formatMoney(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function Stars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-sm text-ink-400">—</span>;
  return (
    <span className="text-sm tracking-wide text-warning-700">
      {"★".repeat(rating)}
      <span className="text-ink-200">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export function VendorComparison({
  compared,
  onClear,
  onBooked,
}: {
  compared: VendorCompareView[];
  onClear: () => void;
  onBooked: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const showBar = compared.length >= 2;

  const status = compared.map(
    (v) => (v.status ?? "researching") as VendorStatus
  );

  return (
    <>
      {showBar && (
        <div className="fixed bottom-4 inset-x-0 z-40 flex justify-center px-4">
          <div className="flex items-center gap-2 bg-ink-900 text-white rounded-full pl-4 pr-2 py-1.5 shadow-xl">
            <span className="text-sm font-medium">
              {compared.length} selected
            </span>
            <Button size="sm" onClick={() => setOpen(true)}>
              Compare
            </Button>
            <button
              type="button"
              onClick={onClear}
              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-ink-300 hover:text-white"
              aria-label="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Compare vendors">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left font-medium text-ink-400 p-2 w-24">
                  &nbsp;
                </th>
                {compared.map((v) => (
                  <th
                    key={v.id}
                    className="text-left font-heading font-semibold text-ink-700 p-2 min-w-[140px]"
                  >
                    {v.business_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              <tr>
                <td className="p-2 text-ink-400">Status</td>
                {compared.map((v, i) => (
                  <td key={v.id} className="p-2">
                    <VendorStatusBadge
                      vendorId={v.id}
                      status={status[i]}
                      readOnly
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 text-ink-400">Quote</td>
                {compared.map((v) => (
                  <td key={v.id} className="p-2 font-medium text-ink-700">
                    {formatMoney(v.quote_amount)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 text-ink-400">Rating</td>
                {compared.map((v) => (
                  <td key={v.id} className="p-2">
                    <Stars rating={v.rating} />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 text-ink-400">Website</td>
                {compared.map((v) => (
                  <td key={v.id} className="p-2 break-all">
                    {v.website ? (
                      <a
                        href={
                          v.website.startsWith("http")
                            ? v.website
                            : `https://${v.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-bordeaux-600 hover:underline"
                      >
                        {v.website}
                      </a>
                    ) : (
                      <span className="text-ink-400">—</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2 text-ink-400 align-top">Notes</td>
                {compared.map((v) => (
                  <td key={v.id} className="p-2 text-ink-600">
                    {v.notes || <span className="text-ink-400">—</span>}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-2" />
                {compared.map((v) => (
                  <td key={v.id} className="p-2 pt-3">
                    <Button
                      variant={v.status === "booked" ? "secondary" : "primary"}
                      size="sm"
                      className="w-full"
                      disabled={v.status === "booked"}
                      onClick={() => onBooked(v.id)}
                    >
                      {v.status === "booked" ? "Booked ✓" : "Book this vendor"}
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Modal>
    </>
  );
}
