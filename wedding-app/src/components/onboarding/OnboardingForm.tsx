"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { allocateBudget, type RegionTier } from "@/lib/budget/allocate";
import { formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { createWedding } from "@/app/onboarding/actions";

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

type FormData = z.input<typeof schema>;

export function OnboardingForm() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      region_tier: "suburban",
      target_budget: 28000,
      guest_count_estimate: 80,
    },
  });

  // eslint-disable-next-line react-hooks/purity -- react-hook-form's supported live-preview API
  const values = watch();

  // Live allocation preview (pure function, no DB)
  const preview =
    Number(values.target_budget) >= 1000 && Number(values.guest_count_estimate) >= 2
      ? allocateBudget({
          targetBudget: Number(values.target_budget) || 0,
          guestCount: Number(values.guest_count_estimate) || 0,
          regionTier: (values.region_tier as RegionTier) || "suburban",
        })
      : null;

  async function next() {
    const fieldsByStep: Record<number, Array<keyof FormData>> = {
      1: ["title"],
      2: ["target_budget", "guest_count_estimate"],
      3: ["region_tier"],
    };
    const valid = await trigger(fieldsByStep[step]);
    if (valid) setStep((s) => Math.min(s + 1, 4));
  }

  async function onSubmit(data: z.output<typeof schema>) {
    try {
      const result = await createWedding(data);
      if (result?.error) toast("error", result.error);
      else router.refresh();
    } catch {
      // Server actions that redirect throw NEXT_REDIRECT — safe to ignore
    }
  }

  return (
    <div>
      {/* Progress */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`h-1.5 flex-1 rounded-full ${
              n <= step ? "bg-rose-500" : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-heading text-lg font-semibold text-slate-700">
              About your wedding
            </h2>
            <Input
              label="Wedding name"
              placeholder="e.g. Sarah & James"
              error={errors.title?.message}
              {...register("title")}
            />
            <Input
              label="Wedding date (optional)"
              type="date"
              {...register("wedding_date")}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-heading text-lg font-semibold text-slate-700">
              Budget &amp; guests
            </h2>
            <Input
              label="Total budget ($)"
              type="number"
              step="1"
              min="1000"
              error={errors.target_budget?.message}
              {...register("target_budget")}
            />
            <Input
              label="Estimated guest count"
              type="number"
              min="2"
              error={errors.guest_count_estimate?.message}
              {...register("guest_count_estimate")}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-heading text-lg font-semibold text-slate-700">
              Where is your wedding?
            </h2>
            <Select
              label="Region tier"
              options={[
                { value: "metro", label: "Metro / major city (+15%)" },
                { value: "suburban", label: "Suburban (baseline)" },
                { value: "rural", label: "Rural (-12%)" },
              ]}
              error={errors.region_tier?.message}
              {...register("region_tier")}
            />
            <p className="text-xs text-slate-400">
              We adjust category allocations for local cost of living.
            </p>
          </div>
        )}

        {step === 4 && preview && (
          <div className="space-y-4">
            <h2 className="font-heading text-lg font-semibold text-slate-700">
              Your budget plan
            </h2>
            {preview.warning && (
              <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-700">{preview.warning}</p>
              </div>
            )}
            <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
              {preview.categories.map((c) => (
                <li
                  key={c.name}
                  className="flex items-center justify-between px-4 py-2.5 bg-white"
                >
                  <span className="text-sm text-slate-600">{c.name}</span>
                  <span className="text-sm font-semibold text-slate-700">
                    {formatMoney(c.amount)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-400">
              Total:{" "}
              <span className="font-semibold">
                {formatMoney(
                  preview.categories.reduce((acc, c) => acc + c.amount, 0)
                )}
              </span>{" "}
              — you can adjust everything later.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          {step > 1 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          ) : (
            <Link
              href="/login"
              className="text-sm text-slate-400 hover:text-slate-600 min-h-[44px] flex items-center"
            >
              Cancel
            </Link>
          )}
          {step < 4 ? (
            <Button type="button" onClick={next}>
              Continue
            </Button>
          ) : (
            <Button type="submit">Create workspace</Button>
          )}
        </div>
      </form>
    </div>
  );
}
