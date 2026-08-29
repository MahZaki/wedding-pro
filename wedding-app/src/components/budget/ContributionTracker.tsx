"use client";

import { useState, useOptimistic, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, ChevronDown } from "lucide-react";
import { cn, formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { addContribution } from "@/app/(app)/budget/actions";
import { contributionSchema } from "@/lib/schemas/budget";

export interface ContributionView {
  id: string;
  contributor: string;
  label: string;
  amount: number;
  received: boolean;
  received_at: string | null;
}

type FormInput = z.input<typeof contributionSchema>;
type FormOutput = z.output<typeof contributionSchema>;

const CONTRIBUTOR_OPTIONS = [
  { value: "Couple", label: "Couple" },
  { value: "Bride Parents", label: "Bride's Parents" },
  { value: "Groom Parents", label: "Groom's Parents" },
  { value: "Other", label: "Other" },
];

export function ContributionTracker({
  contributions,
  readOnly,
}: {
  contributions: ContributionView[];
  readOnly?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [optimisticList, addOptimistic] = useOptimistic(
    contributions,
    (state, next: ContributionView) => [...state, next]
  );

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
            Contributions
          </span>
        </span>
        {!readOnly && (
          <span className="text-sm font-semibold text-bordeaux-600 inline-flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add Contribution
          </span>
        )}
      </button>

      {open && (
        <div className="border-t border-stone-100 px-4 lg:px-5 pb-4 pt-2">
          {!readOnly && showForm && (
            <ContributionForm
              onSubmitted={addOptimistic}
              onDone={() => setShowForm(false)}
            />
          )}

          {!readOnly && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 flex items-center gap-1.5 text-sm text-bordeaux-600 hover:text-bordeaux-700 min-h-[44px]"
            >
              <Plus className="w-4 h-4" /> Add contribution
            </button>
          )}

          <ContributionTable contributions={optimisticList} />
        </div>
      )}
    </div>
  );
}

function ContributionTable({
  contributions,
}: {
  contributions: ContributionView[];
}) {
  return (
    <div className="overflow-x-auto mt-3">
      {contributions.length === 0 ? (
        <p className="text-sm text-ink-400 py-2">
          No contributions yet. Track money coming in from family and yourselves.
        </p>
      ) : (
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-xs text-ink-400 uppercase border-b border-stone-100">
              <th className="py-2 pr-4 font-medium">Contributor</th>
              <th className="py-2 pr-4 font-medium">Label</th>
              <th className="py-2 pr-4 font-medium text-right">Amount</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 font-medium">Date Received</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {contributions.map((c) => (
              <tr key={c.id}>
                <td className="py-3 pr-4 text-ink-700">{c.contributor}</td>
                <td className="py-3 pr-4 text-ink-500">{c.label || "—"}</td>
                <td className="py-3 pr-4 font-semibold text-ink-700 text-right">
                  {formatMoney(c.amount)}
                </td>
                <td className="py-3 pr-4">
                  <Badge variant={c.received ? "success" : "pending"}>
                    {c.received ? "Received" : "Pending"}
                  </Badge>
                </td>
                <td className="py-3 text-ink-500">
                  {c.received_at
                    ? new Date(c.received_at + "T00:00:00").toLocaleDateString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ContributionForm({
  onSubmitted,
  onDone,
}: {
  onSubmitted: (c: ContributionView) => void;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      contributor: "Other",
      received: false,
      received_at: null,
    },
  });
  const { register, watch, reset } = form;
  const received = watch("received");
  const errors = form.formState.errors as Record<string, { message?: string }>;

  function onSubmit(values: FormInput) {
    startTransition(async () => {
      const result = await addContribution(values);
      if (result?.error) {
        toast("error", result.error);
        return;
      }
      onSubmitted({
        id: `opt-${Date.now()}`,
        contributor: values.contributor,
        label: values.label || "",
        amount: Number(values.amount),
        received: values.received ?? false,
        received_at: values.received ? values.received_at || null : null,
      });
      toast("success", "Contribution added");
      reset();
      onDone();
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="mt-3 space-y-4 border border-stone-200 rounded-lg p-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Contributor"
          options={CONTRIBUTOR_OPTIONS}
          error={errors.contributor?.message}
          {...register("contributor")}
        />
        <Input
          label="Label"
          placeholder="e.g. Mom's contribution"
          error={errors.label?.message}
          {...register("label")}
        />
        <Input
          label="Amount ($)"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          error={errors.amount?.message}
          {...register("amount")}
        />
        <div className="flex items-end min-h-[44px]">
          <label className="flex items-center gap-2 text-sm text-ink-700 pb-2">
            <input
              type="checkbox"
              className="w-4 h-4 accent-bordeaux-500"
              {...register("received")}
            />
            Received
          </label>
        </div>
        {received && (
          <Input
            label="Date received"
            type="date"
            error={errors.received_at?.message}
            {...register("received_at")}
          />
        )}
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={isPending}>
          Add contribution
        </Button>
      </div>
    </form>
  );
}
