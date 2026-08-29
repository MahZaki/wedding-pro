import { requireWedding } from "@/lib/wedding";
import { createClient } from "@/lib/supabase/server";
import { BudgetRing } from "@/components/budget/BudgetRing";
import { CategoryCard } from "@/components/budget/CategoryCard";
import { BudgetSummary } from "@/components/budget/BudgetSummary";
import { BudgetAlerts } from "@/components/budget/BudgetAlerts";
import { ContributionTracker } from "@/components/budget/ContributionTracker";
import { ExpenseTracker } from "@/components/budget/ExpenseTracker";
import { formatMoney } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

export const metadata = { title: "Budget" };

type CategoryWithItems =
  Database["public"]["Tables"]["budget_categories"]["Row"] & {
    budget_items: Array<
      Database["public"]["Tables"]["budget_items"]["Row"] & {
        payment_schedules: Array<
          Database["public"]["Tables"]["payment_schedules"]["Row"]
        >;
      }
    >;
  };

export default async function BudgetPage() {
  const { wedding, role } = await requireWedding();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("budget_categories")
    .select(
      `*,
       budget_items (
         *,
         payment_schedules (*)
       )
      `
    )
    .eq("wedding_id", wedding.id)
    .order("sort_order");

  if (error) {
    return (
      <div className="bg-error-50 border border-error-100 rounded-lg p-4 text-sm text-error-700">
        Failed to load budget. Please refresh the page.
      </div>
    );
  }

  const { data: contributions } = await supabase
    .from("contributions")
    .select("*")
    .eq("wedding_id", wedding.id)
    .order("created_at");

  const { data: expenses } = await supabase
    .from("expenses")
    .select(
      `*,
       budget_items(name)`
    )
    .eq("wedding_id", wedding.id)
    .order("created_at");

  const expenseRows = (expenses ?? []) as Array<
    Database["public"]["Tables"]["expenses"]["Row"] & {
      budget_items: Array<{ name: string }> | null;
    }
  >;

  const categories = (data ?? []) as unknown as CategoryWithItems[];

  const totalAllocated = categories.reduce(
    (acc, c) => acc + Number(c.allocated_amount),
    0
  );
  const totalEstimated = categories.reduce(
    (acc, c) =>
      acc +
      c.budget_items.reduce((a, i) => a + Number(i.estimated_cost ?? 0), 0),
    0
  );
  const totalSpent = categories.reduce(
    (acc, c) =>
      acc + c.budget_items.reduce((a, i) => a + Number(i.actual_cost ?? 0), 0),
    0
  );

  const totalContributed = (contributions ?? []).reduce(
    (acc, c) => acc + (c.received ? Number(c.amount) : 0),
    0
  );

  const alertCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    allocated_amount: Number(c.allocated_amount),
    actual: c.budget_items.reduce(
      (a, i) => a + Number(i.actual_cost ?? 0),
      0
    ),
  }));

  const budgetItems = categories.flatMap((c) =>
    c.budget_items.map((i) => ({ id: i.id, name: i.name }))
  );

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl lg:text-3xl font-bold text-ink-700">
        Budget
      </h1>

      {/* Alerts */}
      <BudgetAlerts
        targetBudget={Number(wedding.target_budget)}
        totalSpent={totalSpent}
        categories={alertCategories}
      />

      {/* Summary */}
      <BudgetSummary
        totalBudget={Number(wedding.target_budget)}
        totalContributed={totalContributed}
        totalSpent={totalSpent}
      />

      {/* Ring + allocation overview */}
      <div className="bg-white rounded-lg border border-stone-200 p-5 lg:p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <BudgetRing
            spent={totalSpent}
            total={Number(wedding.target_budget)}
            size={140}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4 flex-1 w-full">
            <div>
              <p className="text-xs font-medium text-ink-400 uppercase">
                Target budget
              </p>
              <p className="font-heading text-xl font-bold text-ink-700">
                {formatMoney(Number(wedding.target_budget))}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-400 uppercase">
                Allocated
              </p>
              <p className="font-heading text-xl font-bold text-ink-700">
                {formatMoney(totalAllocated)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-400 uppercase">
                Estimated
              </p>
              <p className="font-heading text-xl font-bold text-ink-700">
                {formatMoney(totalEstimated)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contributions */}
      <ContributionTracker
        contributions={(contributions ?? []).map((c) => ({
          id: c.id,
          contributor: c.contributor,
          label: c.label ?? "",
          amount: Number(c.amount),
          received: c.received ?? false,
          received_at: c.received_at,
        }))}
        readOnly={role === "viewer"}
      />

      {/* Expenses */}
      <ExpenseTracker
        expenses={expenseRows.map((e) => ({
          id: e.id,
          description: e.description,
          amount: Number(e.amount),
          paid_by: e.paid_by ?? "",
          paid_at: e.paid_at,
          budget_item_name: e.budget_items?.[0]?.name ?? null,
        }))}
        budgetItems={budgetItems}
        readOnly={role === "viewer"}
      />

      {/* Categories */}
      <div className="space-y-4">
        {categories.length === 0 ? (
          <p className="bg-white border border-stone-200 rounded-lg p-6 text-center text-sm text-ink-400">
            No budget categories yet.
          </p>
        ) : (
          categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={{
                id: category.id,
                name: category.name,
                allocated_amount: Number(category.allocated_amount),
              }}
              items={category.budget_items.map((i) => ({
                id: i.id,
                name: i.name,
                estimated_cost: Number(i.estimated_cost ?? 0),
                actual_cost:
                  i.actual_cost === null ? null : Number(i.actual_cost),
                is_paid: i.is_paid ?? false,
                payments: i.payment_schedules.map((p) => ({
                  id: p.id,
                  amount: Number(p.amount),
                  due_date: p.due_date,
                  status: p.status ?? "pending",
                })),
              }))}
              readOnly={role === "viewer"}
            />
          ))
        )}
      </div>
    </div>
  );
}
