"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { WizardForm } from "../SetupWizard";

const STYLES = [
  { value: "classic", label: "Classic" },
  { value: "boho", label: "Boho" },
  { value: "modern", label: "Modern" },
  { value: "rustic", label: "Rustic" },
  { value: "destination", label: "Destination" },
] as const;

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Australia/Sydney",
  "Asia/Tokyo",
] as const;

export function WeddingDetails({ form }: { form: WizardForm }) {
  const { register, watch, setValue } = form;
  const errors = form.formState.errors as Record<string, { message?: string }>;
  const style = watch("wedding_style");

  return (
    <div>
      <h2 className="font-heading text-lg font-semibold text-ink-700 mb-1">
        Tell us about the big day
      </h2>
      <p className="text-sm text-ink-500 mb-5">
        Optional — you can refine these later in Settings.
      </p>

      <div className="space-y-4">
        <Input
          label="Wedding date"
          type="date"
          error={errors.wedding_date?.message}
          {...register("wedding_date")}
        />
        <Input
          label="Ceremony location"
          placeholder="e.g. Garden of the Gods, CO"
          error={errors.ceremony_location?.message}
          {...register("ceremony_location")}
        />
        <Input
          label="Reception location"
          placeholder="e.g. The Ritz-Carlton Ballroom"
          error={errors.reception_location?.message}
          {...register("reception_location")}
        />

        <div>
          <span className="block text-sm font-medium text-ink-700 mb-2">
            Wedding style
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {STYLES.map((s) => {
              const selected = style === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setValue("wedding_style", s.value, { shouldValidate: true })}
                  aria-pressed={selected}
                  className={cn(
                    "min-h-[44px] flex items-center justify-center gap-2 px-3 rounded-lg border text-sm font-medium transition-colors",
                    selected
                      ? "border-bordeaux-500 bg-bordeaux-50 text-bordeaux-700"
                      : "border-ink-300 bg-white text-ink-600 hover:bg-ink-50"
                  )}
                >
                  {selected && <Check className="w-4 h-4" />}
                  {s.label}
                </button>
              );
            })}
          </div>
          <input type="hidden" {...register("wedding_style")} />
        </div>

        <Select
          label="Timezone"
          options={TIMEZONES.map((t) => ({ value: t, label: t.replace(/_/g, " ") }))}
          {...register("timezone")}
        />
      </div>
    </div>
  );
}
