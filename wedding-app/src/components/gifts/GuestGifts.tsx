"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { addGift, toggleThankYou } from "@/app/(app)/gifts/actions";
import type { GiftView } from "@/components/gifts/types";

const GIFT_TYPE_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "physical", label: "Physical gift" },
  { value: "registry", label: "Registry item" },
  { value: "gift-card", label: "Gift card" },
];

const TYPE_LABELS: Record<string, string> = {
  cash: "Cash",
  check: "Check",
  physical: "Physical",
  registry: "Registry",
  "gift-card": "Gift card",
};

export function GuestGifts({
  guestId,
  guestName,
  readOnly,
}: {
  guestId: string;
  guestName: string;
  readOnly?: boolean;
}) {
  const { toast } = useToast();
  const [gifts, setGifts] = useState<GiftView[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("gifts")
      .select("*")
      .eq("guest_id", guestId)
      .order("received_at", { ascending: false, nullsFirst: true });
    if (!error) {
      setGifts(
        (data ?? []).map((g) => ({
          id: g.id,
          guest_id: g.guest_id,
          guest_name: guestName,
          giver_name: g.giver_name,
          gift_type: g.gift_type,
          description: g.description,
          value: g.value === null ? null : Number(g.value),
          received_at: g.received_at,
          thank_you_sent: g.thank_you_sent ?? false,
          thank_you_sent_at: g.thank_you_sent_at,
        }))
      );
    }
    setLoading(false);
  }, [guestId, guestName]);

  useEffect(() => {
    load();
  }, [load]);

  function onToggle(gift: GiftView) {
    const next = !gift.thank_you_sent;
    setGifts((prev) =>
      prev.map((g) =>
        g.id === gift.id
          ? {
              ...g,
              thank_you_sent: next,
              thank_you_sent_at: next
                ? new Date().toISOString().slice(0, 10)
                : null,
            }
          : g
      )
    );
    startTransition(async () => {
      const result = await toggleThankYou({ id: gift.id, thank_you_sent: next });
      if (result?.error) {
        toast("error", result.error);
        load();
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-400">
          {gifts.length === 0
            ? "No gifts logged yet."
            : `${gifts.length} gift${gifts.length === 1 ? "" : "s"} received.`}
        </p>
        {!readOnly && (
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-1 text-sm font-medium text-bordeaux-600 hover:text-bordeaux-700 min-h-[44px]"
          >
            <Plus className="w-4 h-4" /> Log gift
          </button>
        )}
      </div>

      {!readOnly && showForm && (
        <QuickGiftForm
          guestId={guestId}
          onDone={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {loading ? (
        <p className="text-sm text-ink-400">Loading gifts…</p>
      ) : (
        <ul className="divide-y divide-stone-100">
          {gifts.map((g) => (
            <li key={g.id} className="py-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="neutral">{TYPE_LABELS[g.gift_type] ?? g.gift_type}</Badge>
                  <span className="text-sm font-semibold text-ink-700">
                    {g.value === null ? "—" : formatMoney(g.value)}
                  </span>
                </div>
                {g.description && (
                  <p className="text-xs text-ink-400 truncate mt-0.5">
                    {g.description}
                  </p>
                )}
              </div>
              {!readOnly ? (
                <label className="flex items-center gap-2 text-xs text-ink-600 flex-shrink-0">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-bordeaux-500"
                    checked={g.thank_you_sent}
                    onChange={() => onToggle(g)}
                  />
                  thank-you
                </label>
              ) : (
                <Badge variant={g.thank_you_sent ? "success" : "pending"}>
                  {g.thank_you_sent ? "Sent" : "Pending"}
                </Badge>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function QuickGiftForm({
  guestId,
  onDone,
}: {
  guestId: string;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState("physical");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await addGift({
        guest_id: guestId,
        gift_type: type,
        value: value === "" ? null : Number(value),
        description: description || null,
      });
      if (result?.error) {
        toast("error", result.error);
        return;
      }
      toast("success", "Gift logged");
      onDone();
    });
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 border border-stone-200 rounded-lg p-3"
    >
      <Select
        label="Gift type"
        options={GIFT_TYPE_OPTIONS}
        value={type}
        onChange={(e) => setType(e.target.value)}
      />
      <Input
        label="Value ($)"
        type="number"
        min="0"
        step="0.01"
        placeholder="0.00"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Input
        label="Description"
        placeholder="e.g. Kitchenaid mixer"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Button type="submit" loading={isPending}>
        Log gift
      </Button>
    </form>
  );
}
