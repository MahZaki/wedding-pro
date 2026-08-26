"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { allocateBudget } from "@/lib/budget/allocate";

const schema = z.object({
  title: z.string().min(1, "Give your wedding a name").max(120),
  wedding_date: z.string().optional(),
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

export type CreateWeddingInput = z.infer<typeof schema>;

export type CreateWeddingResult = {
  error?: string;
};

export async function createWedding(
  input: CreateWeddingInput
): Promise<CreateWeddingResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  // Prevent duplicate workspaces
  const { data: existing } = await supabase
    .from("wedding_members")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) return { error: "You already have a wedding workspace." };

  const { data: wedding, error: weddingError } = await supabase
    .from("weddings")
    .insert({
      title: data.title,
      wedding_date: data.wedding_date || null,
      target_budget: data.target_budget,
      guest_count_estimate: data.guest_count_estimate,
      region_tier: data.region_tier,
    })
    .select("id")
    .single();

  if (weddingError || !wedding) {
    console.error("createWedding:", weddingError);
    return { error: "Failed to create your wedding. Please try again." };
  }

  const { error: memberError } = await supabase
    .from("wedding_members")
    .insert({
      wedding_id: wedding.id,
      user_id: user.id,
      role: "owner",
    });

  if (memberError) {
    console.error("createWedding member:", memberError);
    return { error: "Wedding created but membership failed. Contact support." };
  }

  const { categories } = allocateBudget({
    targetBudget: data.target_budget,
    guestCount: data.guest_count_estimate,
    regionTier: data.region_tier,
  });

  const { error: catError } = await supabase.from("budget_categories").insert(
    categories.map((c, i) => ({
      wedding_id: wedding.id,
      name: c.name,
      allocated_amount: c.amount,
      sort_order: i,
    }))
  );

  if (catError) {
    console.error("createWedding categories:", catError);
    return { error: "Wedding created but budget allocation failed." };
  }

  // One default budget_item per category
  const { data: createdCats } = await supabase
    .from("budget_categories")
    .select("id, name")
    .eq("wedding_id", wedding.id);

  if (createdCats && createdCats.length > 0) {
    await supabase.from("budget_items").insert(
      createdCats.map((cat) => {
        const match = categories.find((c) => c.name === cat.name);
        return {
          category_id: cat.id,
          name: cat.name,
          estimated_cost: match?.amount ?? 0,
        };
      })
    );
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
