"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { saveSetup, completeSetup } from "@/app/(app)/setup/actions";
import { setupSchema } from "@/lib/schemas/setup";
import { CoupleDetails } from "./steps/CoupleDetails";
import { WeddingDetails } from "./steps/WeddingDetails";
import { BudgetGoal } from "./steps/BudgetGoal";
import { InvitePartner } from "./steps/InvitePartner";
import { SetupComplete } from "./steps/SetupComplete";

type FormInput = z.input<typeof setupSchema>;
type FormOutput = z.output<typeof setupSchema>;

export type WizardForm = UseFormReturn<FormInput, unknown, FormOutput>;

export interface SetupWedding {
  id: string;
  title: string;
  wedding_date: string;
  partner1_name: string;
  partner2_name: string;
  ceremony_location: string;
  reception_location: string;
  wedding_style: "classic" | "boho" | "modern" | "rustic" | "destination" | "";
  timezone: string;
  currency: string;
  target_budget: number;
  guest_count_estimate: number;
  region_tier: "metro" | "suburban" | "rural";
}

const STEPS = ["Couple", "Wedding", "Budget", "Invite", "Done"];

export function SetupWizard({ wedding }: { wedding: SetupWedding }) {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      partner1_name: wedding.partner1_name,
      partner2_name: wedding.partner2_name,
      wedding_date: wedding.wedding_date || undefined,
      ceremony_location: wedding.ceremony_location || "",
      reception_location: wedding.reception_location || "",
      wedding_style: wedding.wedding_style || undefined,
      timezone: wedding.timezone,
      target_budget: wedding.target_budget,
      guest_count_estimate: wedding.guest_count_estimate,
      region_tier: wedding.region_tier,
    },
  });

  const fieldsByStep: Record<number, Array<keyof FormInput>> = {
    1: ["partner1_name", "partner2_name"],
    2: ["wedding_style", "timezone"],
    3: ["target_budget", "guest_count_estimate", "region_tier"],
  };

  async function next() {
    const valid = await form.trigger(fieldsByStep[step]);
    if (valid) {
      if (step === 3) {
        // Persist everything entered so far before showing the summary.
        await persist();
      }
      setStep((s) => Math.min(s + 1, STEPS.length));
    }
  }

  function back() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function persist(): Promise<boolean> {
    const values = form.getValues() as FormOutput;
    try {
      const res = await saveSetup(values);
      if (res?.error) {
        toast("error", res.error);
        return false;
      }
      return true;
    } catch {
      return true;
    }
  }

  async function finish() {
    startTransition(async () => {
      const saved = await persist();
      if (!saved) return;
      try {
        await completeSetup();
      } catch {
        // completeSetup redirects (throws NEXT_REDIRECT) — safe to ignore.
        router.refresh();
      }
    });
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 sm:p-6">
      {/* Progress bar */}
      <div className="flex gap-1.5 mb-2">
        {STEPS.map((label, i) => {
          const n = i + 1;
          return (
            <div
              key={label}
              className="flex-1"
              title={`${label} (${n} of ${STEPS.length})`}
            >
              <div
                className={cn(
                  "h-1.5 rounded-full transition-colors",
                  n <= step ? "bg-bordeaux-500" : "bg-ink-200"
                )}
              />
            </div>
          );
        })}
      </div>
      <p className="text-xs text-ink-400 mb-6">
        Step {step} of {STEPS.length} — {STEPS[step - 1]}
      </p>

      {step === 1 && <CoupleDetails form={form} />}
      {step === 2 && <WeddingDetails form={form} />}
      {step === 3 && <BudgetGoal form={form} />}
      {step === 4 && (
        <InvitePartner weddingId={wedding.id} onSkip={() => setStep((s) => Math.min(s + 1, STEPS.length))} />
      )}
      {step === 5 && <SetupComplete form={form} title={wedding.title} />}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        {step > 1 ? (
          <Button type="button" variant="ghost" onClick={back}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        ) : (
          <span />
        )}

        {step < 5 ? (
          <Button type="button" onClick={next} loading={isPending}>
            {step === 4 ? "Continue" : "Continue"}
          </Button>
        ) : (
          <Button type="button" onClick={finish} loading={isPending}>
            Go to Dashboard
          </Button>
        )}
      </div>
    </div>
  );
}
