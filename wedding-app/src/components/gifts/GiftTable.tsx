"use client";

import { useOptimistic, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { toggleThankYou, deleteGift } from "@/app/(app)/gifts/actions";
import type { GiftView } from "./types";

const TYPE_BADGES: Record<string, "success" | "pending" | "neutral"> = {
  cash: "success",
  check: "success",
  "gift-card": "pending",
  physical: "neutral",
  registry: "neutral",
};

const TYPE_LABELS: Record<string, string> = {
  cash: "Cash",
  check: "Check",
  physical: "Physical",
  registry: "Registry",
  "gift-card": "Gift card",
};

export function GiftTable({
  gifts,
  readOnly,
}: {
  gifts: GiftView[];
  readOnly?: boolean;
}) {
  return (
    <div className="overflow-x-auto mt-3">
      {gifts.length === 0 ? (
        <p className="text-sm text-ink-400 py-2">
          No gifts logged yet. Track what you've received so you never forget a
          thank-you note.
        </p>
      ) : (
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-xs text-ink-400 uppercase border-b border-stone-100">
              <th className="py-2 pr-4 font-medium">From</th>
              <th className="py-2 pr-4 font-medium">Type</th>
              <th className="py-2 pr-4 font-medium">Description</th>
              <th className="py-2 pr-4 font-medium text-right">Value</th>
              <th className="py-2 pr-4 font-medium">Received</th>
              <th className="py-2 font-medium">Thank-you</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {gifts.map((g) => (
              <GiftRow key={g.id} gift={g} readOnly={readOnly} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function GiftRow({
  gift,
  readOnly,
}: {
  gift: GiftView;
  readOnly?: boolean;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [optimistic, toggleOpt] = useOptimistic(
    gift.thank_you_sent,
    (_state, next: boolean) => next
  );

  const from =
    gift.guest_name || gift.giver_name || (gift.guest_id ? "Guest" : "—");

  function onToggle() {
    const next = !optimistic;
    startTransition(async () => {
      toggleOpt(next);
      const result = await toggleThankYou({
        id: gift.id,
        thank_you_sent: next,
      });
      if (result?.error) {
        toggleOpt(optimistic);
        toast("error", result.error);
      } else {
        toast("success", next ? "Thank-you marked as sent" : "Thank-you undone");
      }
    });
  }

  function onDelete() {
    if (!confirm("Delete this gift record?")) return;
    startTransition(async () => {
      const result = await deleteGift({ id: gift.id });
      if (result?.error) toast("error", result.error);
      else toast("success", "Gift deleted");
    });
  }

  return (
    <tr>
      <td className="py-3 pr-4 text-ink-700">{from}</td>
      <td className="py-3 pr-4">
        <Badge variant={TYPE_BADGES[gift.gift_type] ?? "neutral"}>
          {TYPE_LABELS[gift.gift_type] ?? gift.gift_type}
        </Badge>
      </td>
      <td className="py-3 pr-4 text-ink-500 max-w-[220px] truncate">
        {gift.description || "—"}
      </td>
      <td className="py-3 pr-4 font-semibold text-ink-700 text-right">
        {gift.value === null ? "—" : formatMoney(gift.value)}
      </td>
      <td className="py-3 pr-4 text-ink-500">
        {gift.received_at
          ? new Date(gift.received_at + "T00:00:00").toLocaleDateString()
          : "—"}
      </td>
      <td className="py-3">
        <div className="flex items-center gap-2">
          {!readOnly ? (
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                className="w-4 h-4 accent-bordeaux-500"
                checked={optimistic}
                disabled={isPending}
                onChange={onToggle}
              />
              sent
            </label>
          ) : (
            <Badge variant={optimistic ? "success" : "pending"}>
              {optimistic ? "Sent" : "Pending"}
            </Badge>
          )}
          {!readOnly && (
            <button
              onClick={onDelete}
              disabled={isPending}
              aria-label="Delete gift"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-ink-400 hover:text-error-600 hover:bg-error-50 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
