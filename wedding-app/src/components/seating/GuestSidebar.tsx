"use client";

/* eslint-disable react-hooks/refs -- @dnd-kit's API exposes ref-derived values for render */

import { useMemo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { Search, Users, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GuestView } from "./SeatingBoard";
import { hasConflict } from "./helpers";

export function GuestSidebar({
  guests,
  allCount,
  readOnly,
}: {
  guests: GuestView[];
  allCount: number;
  readOnly: boolean;
}) {
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const { setNodeRef, isOver } = useDroppable({ id: "unassigned-pool" });

  const filtered = useMemo(() => {
    if (!search.trim()) return guests;
    const q = search.toLowerCase();
    return guests.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [guests, search]);

  const seated = allCount - guests.length;
  const complete = guests.length === 0;

  return (
    <aside
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-xl border transition-colors duration-200",
        "bg-white",
        isOver && !complete
          ? "border-bordeaux-400 bg-bordeaux-50 shadow-md"
          : "border-stone-200",
        collapsed ? "w-auto" : "w-56 lg:w-60",
      )}
    >
      {/* Header */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center gap-2 px-3 py-2.5 text-left hover:bg-ink-50 rounded-t-xl transition-colors"
      >
        <Users className="w-4 h-4 text-bordeaux-500 flex-shrink-0" />
        {!collapsed && (
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">
            Unassigned
          </span>
        )}
        <span className="ml-auto flex items-center gap-1">
          <span
            className={cn(
              "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold",
              complete
                ? "bg-success-100 text-success-700"
                : "bg-ink-100 text-ink-600",
            )}
          >
            {guests.length}
          </span>
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-ink-300" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-ink-300" />
          )}
        </span>
      </button>

      {/* Body */}
      {!collapsed && (
        <div className="flex flex-col min-h-0">
          {complete ? (
            <div className="px-3 pb-3 pt-1">
              <p className="text-xs text-success-600 font-medium flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-success-100 text-success-700 text-[10px]">
                  ✓
                </span>
                Everyone has a seat!
              </p>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="px-3 pb-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-300" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search guests…"
                    className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg border border-stone-200 bg-ink-50/50 text-ink-700 placeholder:text-ink-300 focus:outline-none focus:ring-1 focus:ring-bordeaux-300 focus:border-bordeaux-300 transition-colors"
                  />
                </div>
              </div>

              {/* Guest list */}
              <ul className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5 max-h-[280px] lg:max-h-none">
                {filtered.length === 0 ? (
                  <li className="text-xs text-ink-400 py-3 text-center">
                    {search ? "No matches" : "All guests seated"}
                  </li>
                ) : (
                  filtered.map((g) => (
                    <GuestRow
                      key={g.id}
                      guest={g}
                      readOnly={readOnly}
                    />
                  ))
                )}
              </ul>

              {/* Seated count */}
              <div className="border-t border-stone-100 px-3 py-1.5">
                <p className="text-[11px] text-ink-400">
                  {seated} of {allCount} seated
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );
}

function GuestRow({
  guest,
  readOnly,
}: {
  guest: GuestView;
  readOnly: boolean;
}) {
  const draggable = useDraggable({
    id: `guest-${guest.id}`,
    disabled: readOnly,
    data: { type: "guest", guest },
  });

  const conflict = hasConflict(guest);
  const initials = guest.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <li
      ref={draggable.setNodeRef}
      {...draggable.listeners}
      {...draggable.attributes}
      style={draggable.transform ? { transform: `translate(${draggable.transform.x}px, ${draggable.transform.y}px)` } : undefined}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-grab active:cursor-grabbing select-none touch-none transition-colors",
        conflict ? "hover:bg-warning-50" : "hover:bg-ink-50",
        draggable.isDragging && "opacity-30",
      )}
    >
      <span
        className={cn(
          "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold",
          conflict
            ? "bg-warning-100 text-warning-700"
            : "bg-bordeaux-100 text-bordeaux-700",
        )}
      >
        {conflict ? <AlertTriangle className="w-3 h-3" /> : initials}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-ink-700 truncate leading-tight">
          {guest.name}
        </span>
        {guest.tags.length > 0 && (
          <span className="block text-[10px] text-ink-400 truncate leading-tight">
            {guest.tags[0]}
          </span>
        )}
      </span>
    </li>
  );
}
