"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import {
  updateGuestProfile,
  type GuestProfileInput,
} from "@/app/(app)/guests/actions";

export interface GuestDetail {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  side: string | null;
  group_id: string | null;
  group_name: string | null;
  table_id: string | null;
  table_name: string | null;
  rsvpStatus: string;
  meal_preference: string | null;
  allergies: string[] | null;
  is_child: boolean | null;
  age_group: string | null;
  thank_you_sent: boolean | null;
  thank_you_sent_at: string | null;
  notes: string | null;
}

const MEAL_OPTIONS = [
  { value: "chicken", label: "Chicken" },
  { value: "fish", label: "Fish" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "kids", label: "Kids" },
];

const AGE_GROUP_OPTIONS = [
  { value: "adult", label: "Adult" },
  { value: "teen", label: "Teen" },
  { value: "child", label: "Child" },
  { value: "infant", label: "Infant" },
];

const RSVP_BADGE: Record<string, BadgeVariant> = {
  attending: "success",
  declined: "danger",
  pending: "pending",
};

export function GuestProfile({
  guest,
  groups,
  tables,
  readOnly,
  onClose,
}: {
  guest: GuestDetail;
  groups: Array<{ id: string; name: string }>;
  tables: Array<{ id: string; label: string }>;
  readOnly?: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  function save(fields: Omit<GuestProfileInput, "id">) {
    setSaved(false);
    startTransition(async () => {
      const result = await updateGuestProfile({ ...fields, id: guest.id });
      if (result?.error) {
        toast("error", result.error);
        return;
      }
      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 2000);
    });
  }

  const groupOptions = [
    { value: "", label: "No group" },
    ...groups.map((g) => ({ value: g.id, label: g.name })),
  ];
  const tableOptions = [
    { value: "", label: "No table" },
    ...tables.map((t) => ({ value: t.id, label: t.label })),
  ];

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-ink-900/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-label={`${guest.first_name} ${guest.last_name}`}
        className={cn(
          "absolute bg-white shadow-xl flex flex-col",
          "inset-x-0 bottom-0 rounded-t-2xl sm:rounded-none",
          "sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[400px] sm:max-w-full h-[80vh] sm:h-full"
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
          <div className="min-w-0 flex items-center gap-2">
            <p className="font-heading font-semibold text-ink-700 truncate">
              {guest.first_name} {guest.last_name}
            </p>
            <Badge
              variant={RSVP_BADGE[guest.rsvpStatus] ?? "neutral"}
            >
              {guest.rsvpStatus}
            </Badge>
            {saved && (
              <span className="inline-flex items-center gap-1 text-xs text-success-600">
                <Check className="w-3.5 h-3.5" /> Saved
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close profile"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-ink-400 hover:text-ink-600 hover:bg-ink-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* Basic Info */}
          <Section title="Basic Info">
            <Field>
              <Input
                label="First name"
                defaultValue={guest.first_name}
                disabled={readOnly}
                onBlur={(e) =>
                  e.target.value !== guest.first_name &&
                  save({ first_name: e.target.value })
                }
              />
            </Field>
            <Field>
              <Input
                label="Last name"
                defaultValue={guest.last_name}
                disabled={readOnly}
                onBlur={(e) =>
                  e.target.value !== guest.last_name &&
                  save({ last_name: e.target.value })
                }
              />
            </Field>
            <Field>
              <Input
                label="Email"
                type="email"
                defaultValue={guest.email ?? ""}
                disabled={readOnly}
                onBlur={(e) =>
                  e.target.value !== (guest.email ?? "") &&
                  save({ email: e.target.value.trim() || null })
                }
              />
            </Field>
            <Field>
              <Input
                label="Phone"
                type="tel"
                defaultValue={guest.phone ?? ""}
                disabled={readOnly}
                onBlur={(e) =>
                  e.target.value !== (guest.phone ?? "") &&
                  save({ phone: e.target.value.trim() || null })
                }
              />
            </Field>
            <Field>
              <Input
                label="Address"
                defaultValue={guest.address ?? ""}
                disabled={readOnly}
                onBlur={(e) =>
                  e.target.value !== (guest.address ?? "") &&
                  save({ address: e.target.value.trim() || null })
                }
              />
            </Field>
          </Section>

          {/* Wedding Info */}
          <Section title="Wedding Info">
            <Field>
              <Select
                label="Side"
                options={[
                  { value: "", label: "No side" },
                  { value: "bride", label: "Bride's side" },
                  { value: "groom", label: "Groom's side" },
                  { value: "both", label: "Both" },
                ]}
                defaultValue={guest.side ?? ""}
                disabled={readOnly}
                onChange={(e) =>
                  save({ side: (e.target.value || null) as "bride" | "groom" | "both" | null })
                }
              />
            </Field>
            <Field>
              <Select
                label="Group"
                options={groupOptions}
                defaultValue={guest.group_id ?? ""}
                disabled={readOnly}
                onChange={(e) => save({ group_id: e.target.value || null })}
              />
            </Field>
            <Field>
              <Select
                label="Table assignment"
                options={tableOptions}
                defaultValue={guest.table_id ?? ""}
                disabled={readOnly}
                onChange={(e) => save({ table_id: e.target.value || null })}
              />
            </Field>
          </Section>

          {/* RSVP */}
          <Section title="Meals & Allergies">
            <Field>
              <Select
                label="Meal preference"
                options={[
                  { value: "", label: "No preference" },
                  ...MEAL_OPTIONS,
                ]}
                defaultValue={guest.meal_preference ?? ""}
                disabled={readOnly}
                onChange={(e) =>
                  save({ meal_preference: (e.target.value || null) as GuestProfileInput["meal_preference"] })
                }
              />
            </Field>
            <Field>
              <Select
                label="Age group"
                options={[
                  { value: "", label: "No age group" },
                  ...AGE_GROUP_OPTIONS,
                ]}
                defaultValue={guest.age_group ?? ""}
                disabled={readOnly}
                onChange={(e) =>
                  save({ age_group: (e.target.value || null) as GuestProfileInput["age_group"] })
                }
              />
            </Field>
            <Field>
              <AllergyEditor
                allergies={guest.allergies ?? []}
                disabled={readOnly}
                onSave={(allergies) => save({ allergies })}
              />
            </Field>
            <Field>
              <CheckboxRow
                label="Child"
                checked={guest.is_child ?? false}
                disabled={readOnly}
                onChange={(checked) => save({ is_child: checked })}
              />
            </Field>
          </Section>

          {/* Gifts & Thank You (Epic 4 placeholder) */}
          <Section title="Gifts & Thank You">
            <p className="text-sm text-ink-400">
              Gift and thank-you tracking is coming soon.
            </p>
            <Field>
              <CheckboxRow
                label="Thank-you sent"
                checked={guest.thank_you_sent ?? false}
                disabled={readOnly}
                onChange={(checked) => save({ thank_you_sent: checked })}
              />
            </Field>
          </Section>

          {/* Notes */}
          <Section title="Notes">
            <textarea
              defaultValue={guest.notes ?? ""}
              disabled={readOnly}
              rows={4}
              onBlur={(e) =>
                e.target.value !== (guest.notes ?? "") &&
                save({ notes: e.target.value.trim() || null })
              }
              className="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bordeaux-500 disabled:bg-ink-50"
            />
          </Section>
        </div>

        {isPending && (
          <div className="px-5 py-3 border-t border-stone-200 text-xs text-ink-400">
            Saving…
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="font-heading text-sm font-semibold text-ink-700 mb-3">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

function CheckboxRow({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink-700 min-h-[44px]">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-bordeaux-500"
      />
      {label}
    </label>
  );
}

const ALLERGY_OPTIONS = ["nuts", "gluten", "dairy", "shellfish", "egg", "soy"];

function AllergyEditor({
  allergies,
  disabled,
  onSave,
}: {
  allergies: string[];
  disabled?: boolean;
  onSave: (allergies: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(allergies);

  function toggle(tag: string) {
    const next = selected.includes(tag)
      ? selected.filter((a) => a !== tag)
      : [...selected, tag];
    setSelected(next);
    onSave(next);
  }

  return (
    <div>
      <p className="block text-sm font-medium text-ink-700 mb-1.5">Allergies</p>
      <div className="flex flex-wrap gap-2">
        {ALLERGY_OPTIONS.map((a) => {
          const active = selected.includes(a);
          return (
            <button
              key={a}
              type="button"
              disabled={disabled}
              onClick={() => toggle(a)}
              className={cn(
                "inline-flex items-center px-3 h-9 rounded-full text-xs font-medium border transition-colors",
                active
                  ? "bg-error-100 border-error-100 text-error-700"
                  : "bg-white border-ink-300 text-ink-500 hover:bg-ink-50",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {a}
            </button>
          );
        })}
      </div>
      {selected.length === 0 && (
        <p className="text-xs text-ink-400 mt-1.5">No allergies recorded.</p>
      )}
    </div>
  );
}
