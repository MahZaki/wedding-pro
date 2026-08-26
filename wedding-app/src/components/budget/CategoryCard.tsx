"use client";

import React, { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { cn, formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { LineItemRow } from "./LineItemRow";
import { addBudgetItem, addPaymentSchedule } from "@/app/(app)/budget/actions";

export interface BudgetItemView {
  id: string;
  name: string;
  estimated_cost: number;
  actual_cost: number | null;
  is_paid: boolean;
  payments: Array<{
    id: string;
    amount: number;
    due_date: string;
    status: string;
  }>;
}

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    allocated_amount: number;
  };
  items: BudgetItemView[];
  readOnly?: boolean;
}

export function CategoryCard({
  category,
  items,
  readOnly = false,
}: CategoryCardProps) {
  const [open, setOpen] = useState(true);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [paymentItemId, setPaymentItemId] = useState<string | null>(null);
  const { toast } = useToast();
  const estimated = items.reduce((a, i) => a + i.estimated_cost, 0);
  const actual = items.reduce((a, i) => a + (i.actual_cost ?? 0), 0);
  const variance = actual - estimated;

  return (
    <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
      {/* Header */}
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
            {category.name}
          </span>
        </span>
        <span className="text-right">
          <span className="block text-sm font-semibold text-ink-700">
            {formatMoney(category.allocated_amount)}
          </span>
          <span className="block text-xs text-ink-400">allocated</span>
        </span>
      </button>

      {open && (
        <div className="border-t border-stone-100 px-4 lg:px-5 pb-4 pt-2">
          <div className="flex gap-4 text-xs mb-3">
            <span className="text-ink-400">
              Estimated:{" "}
              <span className="font-semibold text-ink-600">
                {formatMoney(estimated)}
              </span>
            </span>
            <span className="text-ink-400">
              Actual:{" "}
              <span
                className={cn(
                  "font-semibold",
                  variance > 0 ? "text-red-600" : "text-green-600"
                )}
              >
                {formatMoney(actual)}
              </span>
            </span>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-ink-400 py-2">
              No line items in this category.
            </p>
          ) : (
            <ul className="divide-y divide-stone-100 -mx-1">
              {items.map((item) => (
                <LineItemRow
                  key={item.id}
                  item={item}
                  readOnly={readOnly}
                  onAddPayment={() => {
                    setPaymentItemId(item.id);
                    setShowAddPayment(true);
                  }}
                />
              ))}
            </ul>
          )}

          {!readOnly && (
            <button
              onClick={() => setShowAddItem(true)}
              className="mt-3 flex items-center gap-1.5 text-sm text-bordeaux-600 hover:text-bordeaux-700 min-h-[44px]"
            >
              <Plus className="w-4 h-4" /> Add line item
            </button>
          )}
        </div>
      )}

      <AddItemModal
        open={showAddItem}
        onClose={() => setShowAddItem(false)}
        categoryId={category.id}
        categoryName={category.name}
      />
      <AddPaymentModal
        open={showAddPayment}
        onClose={() => setShowAddPayment(false)}
        itemId={paymentItemId ?? ""}
      />
    </div>
  );
}

function AddItemModal({
  open,
  onClose,
  categoryId,
  categoryName,
}: {
  open: boolean;
  onClose: () => void;
  categoryId: string;
  categoryName: string;
}) {
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = React.useState<{ name?: string; cost?: string }>(
    {}
  );
  const { toast } = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = "Name is required";
    if (!cost || Number(cost) < 0) nextErrors.cost = "Enter a valid amount";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    const result = await addBudgetItem({
      category_id: categoryId,
      name: name.trim(),
      estimated_cost: Number(cost),
    });
    setLoading(false);

    if (result?.error) {
      toast("error", result.error);
      return;
    }
    toast("success", `Added to ${categoryName}`);
    setName("");
    setCost("");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={`Add item · ${categoryName}`}>
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />
        <Input
          label="Estimated cost ($)"
          type="number"
          min="0"
          step="1"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          error={errors.cost}
        />
        <Button type="submit" loading={loading} className="w-full">
          Add item
        </Button>
      </form>
    </Modal>
  );
}

function AddPaymentModal({
  open,
  onClose,
  itemId,
}: {
  open: boolean;
  onClose: () => void;
  itemId: string;
}) {
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = React.useState<{
    amount?: string;
    due_date?: string;
  }>({});
  const { toast } = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (!amount || Number(amount) <= 0)
      nextErrors.amount = "Enter a valid amount";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate))
      nextErrors.due_date = "Pick a date";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    const result = await addPaymentSchedule({
      budget_item_id: itemId,
      amount: Number(amount),
      due_date: dueDate,
    });
    setLoading(false);

    if (result?.error) {
      toast("error", result.error);
      return;
    }
    toast("success", "Payment scheduled");
    setAmount("");
    setDueDate("");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Schedule payment">
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Amount ($)"
          type="number"
          min="1"
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
        />
        <Input
          label="Due date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          error={errors.due_date}
        />
        <Button type="submit" loading={loading} className="w-full">
          Schedule
        </Button>
      </form>
    </Modal>
  );
}
