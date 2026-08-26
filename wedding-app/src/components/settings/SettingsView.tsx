"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Copy, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { updateWedding } from "@/app/(app)/settings/actions";

interface WeddingSettings {
  id: string;
  title: string;
  wedding_date: string;
  target_budget: number;
  guest_count_estimate: number;
  region_tier: "metro" | "suburban" | "rural";
}

export function SettingsView({
  wedding,
  role,
  appUrl,
  members,
}: {
  wedding: WeddingSettings;
  role: string;
  appUrl: string;
  members: Array<{ role: string; email: string }>;
}) {
  const [title, setTitle] = useState(wedding.title);
  const [date, setDate] = useState(wedding.wedding_date);
  const [budget, setBudget] = useState(String(wedding.target_budget));
  const [guests, setGuests] = useState(String(wedding.guest_count_estimate));
  const [region, setRegion] = useState(wedding.region_tier);
  const [isPending, startTransition] = useTransition();
  const originInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    // Ref write (not setState): no re-render, lint-safe mount update.
    if (originInputRef.current) {
      originInputRef.current.value = `${window.location.origin}/invite/${wedding.id}`;
    }
  }, [wedding.id]);
  const { toast } = useToast();

  const canEdit = role === "owner" || role === "planner";

  function save(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateWedding({
        title,
        wedding_date: date || undefined,
        target_budget: Number(budget),
        guest_count_estimate: Number(guests),
        region_tier: region,
      });
      if (result?.error) toast("error", result.error);
      else toast("success", "Settings saved");
    });
  }

  function copyInvite() {
    const origin =
      originInputRef.current?.value ??
      (typeof window !== "undefined"
        ? `${window.location.origin}/invite/${wedding.id}`
        : `${appUrl}/invite/${wedding.id}`);
    void navigator.clipboard
      .writeText(origin)
      .then(() => toast("success", "Invite link copied"))
      .catch(() => toast("error", "Could not copy link"));
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-heading text-2xl lg:text-3xl font-bold text-ink-700">
        Settings
      </h1>

      {/* Wedding settings */}
      <section className="bg-white rounded-lg border border-stone-200 p-4 lg:p-6">
        <h2 className="font-heading font-semibold text-ink-700 mb-4">
          Wedding details
        </h2>
        <form onSubmit={save} className="space-y-4">
          <Input
            label="Wedding name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!canEdit}
          />
          <Input
            label="Wedding date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={!canEdit}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Total budget ($)"
              type="number"
              min="1000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              disabled={!canEdit}
            />
            <Input
              label="Estimated guests"
              type="number"
              min="2"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <Select
            label="Region tier"
            options={[
              { value: "metro", label: "Metro / major city" },
              { value: "suburban", label: "Suburban" },
              { value: "rural", label: "Rural" },
            ]}
            value={region}
            onChange={(e) =>
              setRegion(e.target.value as "metro" | "suburban" | "rural")
            }
            disabled={!canEdit}
          />
          {canEdit && (
            <Button type="submit" loading={isPending}>
              Save changes
            </Button>
          )}
        </form>
      </section>

      {/* Members + invite */}
      <section className="bg-white rounded-lg border border-stone-200 p-4 lg:p-6">
        <h2 className="font-heading font-semibold text-ink-700 mb-1 flex items-center gap-2">
          Collaborators
          {members.length >= 2 && <Badge variant="premium">Free limit</Badge>}
        </h2>
        <p className="text-xs text-ink-400 mb-4">
          Free workspaces include you plus one partner. More collaborators need
          a premium license.
        </p>

        <ul className="divide-y divide-stone-100 border border-stone-100 rounded-lg mb-4">
          {members.map((m) => (
            <li
              key={`${m.email}-${m.role}`}
              className="flex items-center justify-between px-3 py-2.5"
            >
              <span className="text-sm text-ink-700 truncate">{m.email}</span>
              <Badge variant={m.role === "owner" ? "success" : "neutral"}>
                {m.role}
              </Badge>
            </li>
          ))}
        </ul>

        {canEdit && (
          <div>
            <p className="text-sm font-medium text-ink-700 mb-1.5 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4" /> Partner invite link
            </p>
            <div className="flex gap-2">
              <input
                ref={originInputRef}
                readOnly
                defaultValue={`${appUrl}/invite/${wedding.id}`}
                onFocus={(e) => e.target.select()}
                className="flex-1 min-h-[44px] px-3 border border-ink-300 rounded-lg text-xs bg-ink-50 text-ink-500 focus:outline-none focus:ring-2 focus:ring-bordeaux-500"
                aria-label="Invite link"
              />
              <Button variant="secondary" onClick={copyInvite}>
                <Copy className="w-4 h-4" /> Copy
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Account */}
      <section className="bg-white rounded-lg border border-stone-200 p-4 lg:p-6">
        <h2 className="font-heading font-semibold text-ink-700 mb-2">
          Account
        </h2>
        <p className="text-xs text-ink-400 capitalize">
          Your role: {role}
        </p>
      </section>
    </div>
  );
}
