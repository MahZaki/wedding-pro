import { z } from "zod";

export const CONTRIBUTORS = [
  "Couple",
  "Bride Parents",
  "Groom Parents",
  "Other",
] as const;

export const contributionSchema = z.object({
  contributor: z.enum(CONTRIBUTORS, {
    error: "Pick a contributor",
  }),
  label: z.string().trim().max(120).optional(),
  amount: z.coerce.number().min(0.01, "Enter an amount"),
  received: z.boolean().optional(),
  received_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date")
    .nullable()
    .optional(),
});

export const EXPENSE_PAYERS = ["couple", "partner1", "partner2", "family"] as const;

export const expenseSchema = z.object({
  description: z.string().trim().min(1, "Description is required").max(160),
  amount: z.coerce.number().min(0.01, "Enter an amount"),
  paid_by: z.enum(EXPENSE_PAYERS).optional(),
  paid_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date")
    .nullable()
    .optional(),
  budget_item_id: z.string().uuid().nullable().optional(),
});
