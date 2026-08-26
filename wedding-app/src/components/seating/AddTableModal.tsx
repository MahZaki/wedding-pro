"use client";

import { useState } from "react";
import { Circle, Square, RectangleHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { addTable } from "@/app/(app)/seating/actions";

const SHAPES = [
  { value: "round", label: "Round", icon: Circle, desc: "Classic round" },
  { value: "banquet", label: "Rectangle", icon: RectangleHorizontal, desc: "Long banquet" },
  { value: "square", label: "Square", icon: Square, desc: "Compact square" },
] as const;

const PRESETS = [4, 6, 8, 10, 12];

export function AddTableModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [shape, setShape] = useState<string>("round");
  const [capacity, setCapacity] = useState(8);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isCustom = custom !== "" && !PRESETS.includes(Number(custom));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const cap = Number(custom) || capacity;
    if (!cap || cap < 1) {
      toast("warning", "Enter a capacity of at least 1");
      return;
    }
    setLoading(true);
    const result = await addTable({ capacity: cap, shape });
    setLoading(false);
    if (result?.error) {
      toast("error", result.error);
      return;
    }
    toast("success", "Table added");
    onClose();
  }

  function selectPreset(n: number) {
    setCapacity(n);
    setCustom("");
  }

  return (
    <Modal open={open} onClose={onClose} title="Add a table">
      <form onSubmit={submit} className="space-y-5">
        {/* Shape picker */}
        <div>
          <p className="text-xs font-semibold text-ink-500 mb-2 uppercase tracking-wide">
            Choose a shape
          </p>
          <div className="grid grid-cols-3 gap-2">
            {SHAPES.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setShape(s.value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                    shape === s.value
                      ? "border-bordeaux-500 bg-bordeaux-50 text-bordeaux-700"
                      : "border-stone-200 bg-white text-ink-500 hover:border-stone-300",
                  )}
                >
                  <Icon className="w-7 h-7" strokeWidth={1.5} />
                  <span className="text-xs font-medium">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Seat presets */}
        <div>
          <p className="text-xs font-semibold text-ink-500 mb-2 uppercase tracking-wide">
            Seats
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => selectPreset(n)}
                className={cn(
                  "w-10 h-10 rounded-lg border-2 text-sm font-semibold transition-all",
                  capacity === n && !isCustom
                    ? "border-bordeaux-500 bg-bordeaux-50 text-bordeaux-700"
                    : "border-stone-200 bg-white text-ink-500 hover:border-stone-300",
                )}
              >
                {n}
              </button>
            ))}
            <input
              type="number"
              min="1"
              max="24"
              placeholder="…"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              className={cn(
                "w-14 h-10 rounded-lg border-2 text-center text-sm font-medium transition-all",
                "border-stone-200 bg-white text-ink-500 placeholder:text-ink-300",
                "focus:outline-none focus:ring-1 focus:ring-bordeaux-300 focus:border-bordeaux-300",
                isCustom && "border-bordeaux-500 bg-bordeaux-50 text-bordeaux-700",
              )}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Add table
          </Button>
        </div>
      </form>
    </Modal>
  );
}
