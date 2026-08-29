"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, ChevronDown } from "lucide-react";
import { cn, formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { addExpense, expenseSchema } from "@/app/(app)/budget/actions";

export interface ExpenseView {
  id: string;
  description: string;
  amount: number;
  paid_by: string;
  paid_at: string | null;
  budget_item_name: string | null;
}

type FormInput = z.input<typeof expenseSchema>;
type FormOutput = z.output<typeof expenseSchema>;

const PAID_BY_OPTIONS = [
  { value: "couple", label: "Couple" },
  { value: "partner1", label: "Partner 1" },
  { value: "partner2", label: "Partner 2" },
  { value: "family", label: "Family" },
];

const paidByLabel: Record<string, string> = {
  couple: "Couple",
  partner1: "Partner 1",
  partner2: "Partner 2",
  family: "Family",
};

export function ExpenseTracker({
  expenses,
  budgetItems,
  readOnly,
}: {
  expenses: ExpenseView[];
  budgetItems: Array<{ id: string; name: string }>;
  readOnly?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [showForm, setShowForm] = useState(false);

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
            Expenses
          </span>
        </span>
        {!readOnly && (
          <span className="text-sm font-semibold text-bordeaux-600 inline-flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add Expense
          </span>
        )}
      </button>

      {open && (
        <div className="border-t border-stone-100 px-4 lg:px-5 pb-4 pt-2">
          {!readOnly && showForm && (
            <ExpenseForm
              budgetItems={budgetItems}
              onDone={() => setShowForm(false)}
            />
          )}

          {!readOnly && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 flex items-center gap-1.5 text-sm text-bordeaux-600 hover:text-bordeaux-700 min-h-[44px]"
            >
              <Plus className="w-4 h-4" /> Add expense
            </button>
          )}

          {expenses.length === 0 ? (
            <p className="text-sm text-ink-400 py-2">
              No expenses tracked yet.
            </p>
          ) : (
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-xs text-ink-400 uppercase border-b border-stone-100">
                    <th className="py-2 pr-4 font-medium">Description</th>
                    <th className="py-2 pr-4 font-medium">Category</th>
                    <th className="py-2 pr-4 font-medium text-right">Amount</th>
                    <th className="py-2 pr-4 font-medium">Paid By</th>
                    <th className="py-2 font-medium">Paid On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {expenses.map((e) => (
                    <tr key={e.id}>
                      <td className="py-3 pr-4 text-ink-700">{e.description}</td>
                      <td className="py-3 pr-4 text-ink-500">
                        {e.budget_item_name || "—"}
                      </td>
                      <td className="py-3 pr-4 font-semibold text-ink-700 text-right">
                        {formatMoney(e.amount)}
                      </td>
                      <td className="py-3 pr-4 text-ink-500">
                        {e.paid_by ? paidByLabel[e.paid_by] || e.paid_by : "—"}
                      </td>
                      <td className="py-3 text-ink-500">
                        {e.paid_at
                          ? new Date(e.paid_at + "T00:00:00").toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExpenseForm({
  budgetItems,
  onDone,
}: {
  budgetItems: Array<{ id: string; name: string }>;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      paid_by: "couple",
      paid_at: null,
      budget_item_id: null,
    },
  });
  const { register } = form;
  const errors = form.formState.errors as Record<string, { message?: string }>;

  const itemOptions = [
    { value: "", label: "No category" },
    ...budgetItems.map((b) => ({ value: b.id, label: b.name })),
  ];

  function onSubmit(values: FormInput) {
    startTransition(async () => {
      const result = await addExpense(values);
      if (result?.error) {
        toast("error", result.error);
        return;
      }
      toast("success", "Expense added");
      form.reset();
      onDone();
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="mt-3 space-y-4 border border-stone-200 rounded-lg p-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Description"
          placeholder="e.g. Florist deposit"
          error={errors.description?.message}
          {...register("description")}
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
        <Select
          label="Paid by"
          options={PAID_BY_OPTIONS}
          error={errors.paid_by?.message}
          {...register("paid_by")}
        />
        <Input
          label="Paid on"
          type="date"
          error={errors.paid_at?.message}
          {...register("paid_at")}
        />
        <div className="sm:col-span-2">
          <Select
            label="Budget category (optional)"
            options={itemOptions}
            error={errors.budget_item_id?.message}
            {...register("budget_item_id")}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={isPending}>
          Add expense
        </Button>
      </div>
    </form>
  );
}
