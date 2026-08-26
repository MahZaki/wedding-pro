"use client";

import { useState, useTransition } from "react";
import { CalendarPlus } from "lucide-react";
import { cn, formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { updateBudgetItem, markPaymentPaid } from "@/app/(app)/budget/actions";
import type { BudgetItemView } from "./CategoryCard";

export function LineItemRow({
  item,
  readOnly = false,
  onAddPayment,
}: {
  item: BudgetItemView;
  readOnly?: boolean;
  onAddPayment?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const variance =
    item.actual_cost === null ? null : item.actual_cost - item.estimated_cost;

  function saveActual(value: string) {
    const num = value === "" ? null : Number(value);
    if (num !== null && (Number.isNaN(num) || num < 0)) return;
    startTransition(async () => {
      const result = await updateBudgetItem({ id: item.id, actual_cost: num });
      if (result?.error) toast("error", result.error);
    });
  }

  function togglePaid() {
    startTransition(async () => {
      const result = await updateBudgetItem({
        id: item.id,
        is_paid: !item.is_paid,
      });
      if (result?.error) toast("error", result.error);
    });
  }

  return (
    <li className="py-3">
      <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
        {/* Name + paid toggle */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-700 truncate flex items-center gap-2">
            {item.name}
            {item.is_paid ? (
              <Badge variant="success">Paid</Badge>
            ) : isPending ? (
              <span className="text-xs text-slate-400">saving…</span>
            ) : null}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Est. {formatMoney(item.estimated_cost)}
            {variance !== null && (
              <span
                className={cn(
                  "ml-2 font-semibold",
                  variance > 0 ? "text-red-600" : "text-green-600"
                )}
              >
                {variance > 0 ? "+" : ""}
                {formatMoney(variance)} variance
              </span>
            )}
          </p>
        </div>

        {/* Actual cost input */}
        {!readOnly && (
          <input
            type="number"
            min="0"
            placeholder="Actual $"
            defaultValue={item.actual_cost ?? ""}
            onBlur={(e) => {
              if (e.target.value !== (item.actual_cost?.toString() ?? "")) {
                saveActual(e.target.value);
              }
            }}
            className="w-28 min-h-[40px] px-2 border border-slate-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            aria-label={`Actual cost for ${item.name}`}
          />
        )}

        {!readOnly && (
          <>
            <button
              onClick={togglePaid}
              className="min-h-[44px] px-3 rounded-lg border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-50"
              aria-label={
                item.is_paid ? "Mark as unpaid" : "Mark as paid"
              }
            >
              {item.is_paid ? "Unmark" : "Mark paid"}
            </button>
            {onAddPayment && (
              <button
                onClick={onAddPayment}
                aria-label="Schedule payment"
                title="Schedule payment"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-50"
              >
                <CalendarPlus className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Payment schedule */}
      {item.payments.length > 0 && (
        <ul className="mt-2 ml-1 space-y-1.5">
          {item.payments.map((p) => (
            <li key={p.id} className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">
                {new Date(p.due_date + "T00:00:00").toLocaleDateString()}
              </span>
              <span className="font-semibold text-slate-600">
                {formatMoney(p.amount)}
              </span>
              <Badge
                variant={
                  p.status === "paid"
                    ? "success"
                    : p.status === "overdue"
                      ? "danger"
                      : "pending"
                }
              >
                {p.status}
              </Badge>
              {readOnly
                ? null
                : p.status !== "paid" && (
                    <button
                      onClick={() =>
                        startTransition(async () => {
                          const result = await markPaymentPaid({ id: p.id });
                          if (result?.error) toast("error", result.error);
                        })
                      }
                      className="text-green-600 hover:underline min-h-[32px]"
                    >
                      Mark paid
                    </button>
                  )}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
