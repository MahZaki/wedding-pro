"use client";

import { CheckCircle2 } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import type { WizardForm } from "../SetupWizard";

function Row({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-sm text-ink-500">{label}</span>
      <span className="text-sm font-semibold text-ink-700 text-right">
        {value || "—"}
      </span>
    </div>
  );
}

export function SetupComplete({ form, title }: { form: WizardForm; title: string }) {
  const v = form.getValues();

  const style = (v.wedding_style as string | undefined) ?? "";
  const styleLabel = style
    ? style.charAt(0).toUpperCase() + style.slice(1)
    : "";

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <CheckCircle2 className="w-5 h-5 text-success-600" />
        <h2 className="font-heading text-lg font-semibold text-ink-700">
          You&apos;re all set!
        </h2>
      </div>
      <p className="text-sm text-ink-500 mb-5">
        Here&apos;s a summary of your wedding workspace. You can change any of
        this later in Settings.
      </p>

      <div className="rounded-lg border border-stone-200 overflow-hidden divide-y divide-stone-100">
        <Row label="Wedding" value={title} />
        <Row label="Partner 1" value={v.partner1_name} />
        <Row label="Partner 2" value={v.partner2_name} />
        <Row
          label="Date"
          value={v.wedding_date ? new Date(v.wedding_date + "T00:00:00").toLocaleDateString() : ""}
        />
        <Row label="Ceremony" value={v.ceremony_location} />
        <Row label="Reception" value={v.reception_location} />
        <Row label="Style" value={styleLabel} />
        <Row label="Timezone" value={(v.timezone as string | undefined)?.replace(/_/g, " ")} />
        <Row label="Budget" value={formatMoney(Number(v.target_budget) || 0)} />
        <Row label="Guests" value={Number(v.guest_count_estimate) || 0} />
        <Row
          label="Region"
          value={(v.region_tier as string | undefined)?.toUpperCase()}
        />
      </div>
    </div>
  );
}
