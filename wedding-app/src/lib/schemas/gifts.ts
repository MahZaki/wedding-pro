import { z } from "zod";

export const GIFT_TYPES = [
  "cash",
  "check",
  "physical",
  "registry",
  "gift-card",
] as const;

export const giftSchema = z.object({
  guest_id: z.string().uuid().or(z.literal("")).nullish(),
  giver_name: z.string().trim().max(120).optional(),
  gift_type: z.enum(GIFT_TYPES, { error: "Pick a gift type" }),
  description: z.string().trim().max(160).optional(),
  value: z.coerce.number().min(0).nullable().optional(),
  received_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date")
    .nullable()
    .optional(),
  notes: z.string().trim().max(500).optional(),
});
