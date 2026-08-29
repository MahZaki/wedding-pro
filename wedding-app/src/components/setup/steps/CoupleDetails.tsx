"use client";

import { Input } from "@/components/ui/Input";
import type { WizardForm } from "../SetupWizard";

export function CoupleDetails({ form }: { form: WizardForm }) {
  const { register } = form;
  const errors = form.formState.errors as Record<string, { message?: string }>;

  return (
    <div>
      <h2 className="font-heading text-lg font-semibold text-ink-700 mb-1">
        Hi there! Who are you two?
      </h2>
      <p className="text-sm text-ink-500 mb-5">
        We&apos;ll use these names throughout your workspace.
      </p>

      <div className="space-y-4">
        <Input
          label="Partner 1"
          placeholder="Your first & last name"
          error={errors.partner1_name?.message}
          {...register("partner1_name")}
        />
        <Input
          label="Partner 2"
          placeholder="Partner's first & last name"
          error={errors.partner2_name?.message}
          {...register("partner2_name")}
        />
      </div>
    </div>
  );
}
