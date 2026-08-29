import { z } from "zod";

export const setupSchema = z.object({
  partner1_name: z.string().trim().min(1, "Enter your name").max(80),
  partner2_name: z.string().trim().min(1, "Enter partner's name").max(80),
  wedding_date: z.string().optional(),
  ceremony_location: z.string().trim().max(200).optional(),
  reception_location: z.string().trim().max(200).optional(),
  wedding_style: z
    .enum(["classic", "boho", "modern", "rustic", "destination"])
    .optional(),
  timezone: z.string().default("America/New_York"),
  target_budget: z.coerce
    .number()
    .min(1000, "Budget must be at least $1,000")
    .max(10_000_000),
  guest_count_estimate: z.coerce
    .number()
    .int()
    .min(2, "At least 2 guests")
    .max(2000),
  region_tier: z.enum(["metro", "suburban", "rural"]),
});

export type SetupInput = z.infer<typeof setupSchema>;
