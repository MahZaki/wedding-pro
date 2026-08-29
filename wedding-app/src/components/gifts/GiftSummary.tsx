import { formatMoney } from "@/lib/utils";
import type { GiftView } from "./types";

export function GiftSummary({
  gifts,
  pendingThankYous,
}: {
  gifts: GiftView[];
  pendingThankYous: number;
}) {
  const totalValue = gifts.reduce((sum, g) => sum + (g.value ?? 0), 0);

  const cards = [
    { label: "Gifts received", value: String(gifts.length) },
    { label: "Total value", value: formatMoney(totalValue) },
    {
      label: "Thank-you notes sent",
      value: `${gifts.length - pendingThankYous}/${gifts.length}`,
    },
    { label: "Thank-you notes pending", value: String(pendingThankYous) },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-lg border border-stone-200 p-5"
        >
          <p className="text-xs font-medium text-ink-400 uppercase">
            {card.label}
          </p>
          <p className="mt-1 font-heading text-xl font-bold text-ink-700">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
