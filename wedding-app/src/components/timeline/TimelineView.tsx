"use client";

import { useState, useTransition } from "react";
import { Clock, Star, Trash2, Wand2, Users } from "lucide-react";
import { TIMELINE_ROLES } from "@/lib/timeline/generate";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import {
  regenerateTimeline,
  deleteTimelineItem,
} from "@/app/(app)/timeline/actions";

interface TimelineItemView {
  id: string;
  start_time: string;
  end_time: string | null;
  title: string;
  is_anchor: boolean;
  sort_order: number;
  assigned_roles: string[];
}

const ANCHOR_FIELDS = [
  { key: "venue_access_time", label: "Venue access" },
  { key: "ceremony_start", label: "Ceremony start" },
  { key: "golden_hour_time", label: "Golden hour" },
  { key: "reception_dinner_start", label: "Dinner start" },
  { key: "venue_end_time", label: "Venue end" },
] as const;

type AnchorKey = (typeof ANCHOR_FIELDS)[number]["key"];

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function TimelineView({
  items,
  readOnly = false,
}: {
  items: TimelineItemView[];
  readOnly?: boolean;
}) {
  const [anchors, setAnchors] = useState<Record<AnchorKey, string>>({
    venue_access_time: "11:00",
    ceremony_start: "16:00",
    golden_hour_time: "18:15",
    reception_dinner_start: "18:30",
    venue_end_time: "23:00",
  });
  const [isPending, startTransition] = useTransition();
  const [showRoles, setShowRoles] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const { toast } = useToast();

  function generate() {
    startTransition(async () => {
      const result = await regenerateTimeline(anchors);
      if (result && "error" in result && result.error)
        toast("error", result.error);
      else toast("success", "Timeline generated");
    });
  }

  const visible =
    roleFilter !== null
      ? items.filter((i) => i.assigned_roles.includes(roleFilter))
      : items;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl lg:text-3xl font-bold text-slate-700">
        Timeline
      </h1>

      {!readOnly && (
        <section className="bg-white rounded-lg border border-gray-200 p-4 lg:p-5">
          <h2 className="font-heading font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-rose-500" /> Generate from anchors
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {ANCHOR_FIELDS.map(({ key, label }) => (
              <Input
                key={key}
                label={label}
                type="time"
                value={anchors[key]}
                onChange={(e) =>
                  setAnchors((a) => ({ ...a, [key]: e.target.value }))
                }
              />
            ))}
          </div>
          <Button onClick={generate} loading={isPending}>
            Generate full day schedule
          </Button>
          <p className="text-xs text-slate-400 mt-2">
            Regenerates all 15 blocks. Ceremony and venue end are hard anchors —
            every other block shifts with them.
          </p>
        </section>
      )}

      {/* Role filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setShowRoles((s) => !s)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 min-h-[44px]"
        >
          <Users className="w-4 h-4" /> Filter by role
        </button>
        {showRoles &&
          TIMELINE_ROLES.map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter((r) => (r === role ? null : role))}
              className={`px-3 min-h-[36px] rounded-full text-xs font-medium border transition-colors ${
                roleFilter === role
                  ? "bg-rose-500 border-rose-500 text-white"
                  : "border-slate-300 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {role}
            </button>
          ))}
        {roleFilter && (
          <button
            onClick={() => setRoleFilter(null)}
            className="text-xs text-rose-600 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Timeline */}
      {visible.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200">
          <EmptyState
            icon={Clock}
            title="No timeline yet"
            description="Enter your five anchor times above and generate a complete wedding-day schedule in one click."
          />
        </div>
      ) : (
        <ol className="relative border-l-2 border-slate-200 ml-3 space-y-0">
          {visible.map((item) => (
            <li key={item.id} className="ml-6 pb-5 relative">
              <span
                className={`absolute -left-[31px] top-1 w-3 h-3 rounded-full ${
                  item.is_anchor ? "bg-gold-500 ring-4 ring-gold-100" : "bg-slate-300"
                }`}
              />
              <div className="bg-white rounded-lg border border-gray-200 p-3 lg:p-4 group">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      {item.is_anchor && (
                        <Star className="w-3.5 h-3.5 text-gold-500 fill-gold-500 flex-shrink-0" />
                      )}
                      <span className="truncate">{item.title}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatTime(item.start_time)}
                      {item.end_time && ` – ${formatTime(item.end_time)}`}
                    </p>
                    {item.assigned_roles.length > 0 && (
                      <div className="mt-1.5 flex gap-1.5 flex-wrap">
                        {item.assigned_roles.map((r) => (
                          <Badge key={r} variant="neutral">
                            {r}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {!readOnly && !item.is_anchor && (
                    <button
                      onClick={() =>
                        startTransition(async () => {
                          const result = await deleteTimelineItem({
                            id: item.id,
                          });
                          if (result?.error) toast("error", result.error);
                        })
                      }
                      aria-label={`Delete ${item.title}`}
                      className="min-w-[40px] min-h-[40px] hidden sm:flex items-center justify-center rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
