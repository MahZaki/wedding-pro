"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { addGift } from "@/app/(app)/gifts/actions";
import { giftSchema } from "@/lib/schemas/gifts";
import type { GiftView } from "./types";

type FormInput = z.input<typeof giftSchema>;

const GIFT_TYPE_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "physical", label: "Physical gift" },
  { value: "registry", label: "Registry item" },
  { value: "gift-card", label: "Gift card" },
];

export function AddGiftForm({
  guests,
  onSubmitted,
  readOnly,
}: {
  guests: Array<{ id: string; label: string }>;
  onSubmitted?: (g: GiftView) => void;
  readOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormInput>({
    resolver: zodResolver(giftSchema),
    defaultValues: { gift_type: "physical", value: null, guest_id: null },
  });
  const { register, reset } = form;
  const errors = form.formState.errors as Record<
    string,
    { message?: string }
  >;

  function onSubmit(values: FormInput) {
    startTransition(async () => {
      const result = await addGift(values);
      if (result?.error) {
        toast("error", result.error);
        return;
      }
      const selected = guests.find((g) => g.id === values.guest_id);
      onSubmitted?.({
        id: `opt-${Date.now()}`,
        guest_id: values.guest_id || null,
        guest_name: values.guest_id ? selected?.label ?? null : null,
        giver_name: values.giver_name || null,
        gift_type: values.gift_type,
        description: values.description || null,
        value: values.value === null ? null : Number(values.value),
        received_at: values.received_at || null,
        thank_you_sent: false,
        thank_you_sent_at: null,
      });
      toast("success", "Gift logged");
      reset({ gift_type: "physical", value: null, guest_id: null });
      setOpen(false);
    });
  }

  return (
    <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 lg:px-5 py-4 min-h-[56px] hover:bg-ink-50"
      >
        <span className="flex items-center gap-3">
          <ChevronDown
            className={cn(
              "w-4 h-4 text-ink-400 transition-transform",
              !open && "-rotate-90"
            )}
          />
          <span className="font-heading font-semibold text-ink-700 text-left">
            Log a gift
          </span>
        </span>
        {!readOnly && (
          <span className="text-sm font-semibold text-bordeaux-600 inline-flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add Gift
          </span>
        )}
      </button>

      {open && (
        <div className="border-t border-stone-100 px-4 lg:px-5 pb-5 pt-4">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 border border-stone-200 rounded-lg p-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Guest (optional)"
                options={[
                  { value: "", label: "Not linked to a guest" },
                  ...guests.map((g) => ({ value: g.id, label: g.label })),
                ]}
                error={errors.guest_id?.message}
                {...register("guest_id")}
              />
              <Input
                label="Giver name"
                placeholder="Only if not a listed guest"
                error={errors.giver_name?.message}
                {...register("giver_name")}
              />
              <Select
                label="Gift type"
                options={GIFT_TYPE_OPTIONS}
                error={errors.gift_type?.message}
                {...register("gift_type")}
              />
              <Input
                label="Value ($)"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                error={errors.value?.message}
                {...register("value")}
              />
              <Input
                label="Description"
                placeholder="e.g. Blender, cash, etc."
                error={errors.description?.message}
                {...register("description")}
              />
              <Input
                label="Date received"
                type="date"
                error={errors.received_at?.message}
                {...register("received_at")}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" loading={isPending}>
                Log gift
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
