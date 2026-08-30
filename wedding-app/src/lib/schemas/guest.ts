import { z } from "zod";

const MEAL_OPTIONS = [
  "chicken",
  "fish",
  "vegetarian",
  "vegan",
  "kids",
] as const;
const AGE_GROUPS = ["adult", "teen", "child", "infant"] as const;

export const guestProfileSchema = z.object({
  id: z.string().uuid(),
  first_name: z.string().trim().min(1, "First name is required").max(80).optional(),
  last_name: z.string().trim().min(1, "Last name is required").max(80).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  address: z.string().max(300).nullable().optional(),
  side: z.enum(["bride", "groom", "both"]).nullable().optional(),
  group_id: z.string().uuid().nullable().optional(),
  table_id: z.string().uuid().nullable().optional(),
  meal_preference: z.enum(MEAL_OPTIONS).nullable().optional(),
  allergies: z.array(z.string().max(40)).nullable().optional(),
  is_child: z.boolean().nullable().optional(),
  age_group: z.enum(AGE_GROUPS).nullable().optional(),
  thank_you_sent: z.boolean().nullable().optional(),
  thank_you_sent_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date")
    .nullable()
    .optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export type GuestProfileInput = z.input<typeof guestProfileSchema>;
