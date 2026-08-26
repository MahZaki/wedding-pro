"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Plus, Sparkles, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { GuestSidebar } from "./GuestSidebar";
import { TableVisual } from "./TableVisual";
import { AddTableModal } from "./AddTableModal";
import {
  moveTable,
  deleteTable,
  assignGuest,
} from "@/app/(app)/seating/actions";

export interface TableView {
  id: string;
  table_number: number;
  shape: "round" | "banquet" | "square";
  capacity: number;
  pos_x: number;
  pos_y: number;
  label: string | null;
}

export interface GuestView {
  id: string;
  name: string;
  table_id: string | null;
  tags: string[];
}

interface DragData {
  type: "guest" | "table";
  guest?: GuestView;
  table?: TableView;
  fromSeat?: boolean;
}

export function SeatingBoard({
  tables,
  guests,
  readOnly = false,
}: {
  tables: TableView[];
  guests: GuestView[];
  readOnly?: boolean;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [activeGuest, setActiveGuest] = useState<GuestView | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const seatedByTable = useMemo(() => {
    const map = new Map<string, GuestView[]>();
    for (const g of guests) {
      if (!g.table_id) continue;
      const list = map.get(g.table_id) ?? [];
      list.push(g);
      map.set(g.table_id, list);
    }
    return map;
  }, [guests]);

  const unassigned = guests.filter((g) => !g.table_id);
  const totalSeated = guests.length - unassigned.length;
  const totalCapacity = tables.reduce((s, t) => s + t.capacity, 0);
  const pct = guests.length > 0 ? Math.round((totalSeated / guests.length) * 100) : 0;
  const complete = unassigned.length === 0 && guests.length > 0;

  function onDragStart(e: DragStartEvent) {
    const data = e.active.data.current as DragData | undefined;
    if (data?.type === "guest" && data.guest) setActiveGuest(data.guest);
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveGuest(null);
    const data = e.active.data.current as DragData | undefined;
    if (readOnly || !data) return;

    if (data.type === "guest" && data.guest) {
      const overId = e.over?.id as string | undefined;
      if (!overId) return;

      // Dropped on pool → unseat
      if (overId === "unassigned-pool") {
        if (!data.guest.table_id) return;
        startTransition(async () => {
          const r = await assignGuest({ guestId: data.guest!.id, tableId: null });
          if (r?.error) toast("error", r.error);
        });
        return;
      }

      // Dropped on a seat
      if (overId.startsWith("seat-")) {
        const parts = overId.split("-");
        const targetTableId = parts[1];
        const targetGuestId = parts[2] === "empty" ? null : parts[2];

        if (targetGuestId) {
          toast("warning", "That seat is taken");
          return;
        }

        if (data.guest.table_id === targetTableId) return;

        const table = tables.find((t) => t.id === targetTableId);
        const current = seatedByTable.get(targetTableId)?.length ?? 0;
        if (table && current >= table.capacity) {
          toast("warning", `${table.label ?? `Table ${table.table_number}`} is full`);
          return;
        }

        startTransition(async () => {
          const r = await assignGuest({ guestId: data.guest!.id, tableId: targetTableId });
          if (r?.error) toast("error", r.error);
        });
        return;
      }

      // Dropped on a table (backwards compat)
      if (overId.startsWith("table-")) {
        const tableId = overId.replace("table-", "");
        if (data.guest.table_id === tableId) return;
        const table = tables.find((t) => t.id === tableId);
        const current = seatedByTable.get(tableId)?.length ?? 0;
        if (table && current >= table.capacity) {
          toast("warning", `${table.label ?? `Table ${table.table_number}`} is full`);
          return;
        }
        startTransition(async () => {
          const r = await assignGuest({ guestId: data.guest!.id, tableId });
          if (r?.error) toast("error", r.error);
        });
      }
    }

    if (data.type === "table" && data.table && e.delta) {
      const t = data.table;
      const nx = Math.max(0, Math.round(t.pos_x + e.delta.x));
      const ny = Math.max(0, Math.round(t.pos_y + e.delta.y));
      if (nx === t.pos_x && ny === t.pos_y) return;
      startTransition(async () => {
        await moveTable({ id: t.id, pos_x: nx, pos_y: ny });
      });
    }
  }

  function handleRemoveGuest(guestId: string) {
    if (readOnly) return;
    startTransition(async () => {
      const r = await assignGuest({ guestId, tableId: null });
      if (r?.error) toast("error", r.error);
    });
  }

  async function handleAutoSeat() {
    if (unassigned.length === 0) {
      toast("info", "Everyone already has a seat");
      return;
    }
    let placed = 0;
    const capacityUsed = new Map<string, number>();
    for (const guest of unassigned) {
      for (const table of tables) {
        const used = capacityUsed.get(table.id) ?? (seatedByTable.get(table.id)?.length ?? 0);
        if (used < table.capacity) {
          const r = await assignGuest({ guestId: guest.id, tableId: table.id });
          if (!r?.error) {
            placed++;
            capacityUsed.set(table.id, used + 1);
          }
          break;
        }
      }
    }
    toast("success", placed > 0 ? `Seated ${placed} guests` : "No room available");
    startTransition(async () => {
      router.refresh();
    });
  }

  function handleDeleteTable(id: string, num: number) {
    if (!confirm(`Delete Table ${num}?`)) return;
    startTransition(async () => {
      const r = await deleteTable({ id });
      if (r?.error) toast("error", r.error);
    });
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex flex-col h-[calc(100dvh-8rem)]">
        {/* ── Header ── */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="font-heading text-2xl lg:text-3xl font-bold text-ink-700">
              Seating
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-ink-500">
                {guests.length > 0 ? (
                  <>
                    <span className="font-semibold text-ink-700">{totalSeated}</span>
                    {" of "}
                    <span className="font-semibold text-ink-700">{guests.length}</span>
                    {" guests seated"}
                  </>
                ) : (
                  "No guests yet"
                )}
              </p>
              {guests.length > 0 && (
                <>
                  <span className="text-ink-300">·</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-ink-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          complete ? "bg-success-500" : "bg-bordeaux-400",
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        complete ? "text-success-600" : "text-ink-400",
                      )}
                    >
                      {pct}%
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {!readOnly && (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAutoSeat}
                disabled={unassigned.length === 0 || tables.length === 0}
              >
                <Sparkles className="w-4 h-4" />
                Auto-seat
              </Button>
              <Button size="sm" onClick={() => setShowAdd(true)}>
                <Plus className="w-4 h-4" />
                Add table
              </Button>
            </div>
          )}
        </div>

        {/* ── Main area ── */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
          {/* Sidebar */}
          <GuestSidebar
            guests={unassigned}
            allCount={guests.length}
            readOnly={readOnly}
          />

          {/* Canvas */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            {tables.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState
                  icon={Table2}
                  title="No tables yet"
                  description="Add your first table to start planning the floor layout."
                  action={
                    !readOnly ? (
                      <Button onClick={() => setShowAdd(true)}>Add Tables</Button>
                    ) : undefined
                  }
                />
              </div>
            ) : (
              <div className="relative flex-1 min-h-0 rounded-xl border border-stone-200 bg-white overflow-auto touch-none">
                {/* Dot grid background */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-30"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, #c4beb5 0.7px, transparent 0.7px)",
                    backgroundSize: "28px 28px",
                  }}
                />

                {/* Tables layer */}
                <div
                  className="relative"
                  style={{
                    width: Math.max(...tables.map((t) => t.pos_x + 300), 900),
                    height: Math.max(...tables.map((t) => t.pos_y + 280), 600),
                    minWidth: "100%",
                    minHeight: "100%",
                  }}
                >
                  {tables.map((t) => (
                    <TableVisual
                      key={t.id}
                      table={t}
                      guests={seatedByTable.get(t.id) ?? []}
                      readOnly={readOnly}
                      onRemoveGuest={handleRemoveGuest}
                      onDelete={() => handleDeleteTable(t.id, t.table_number)}
                    />
                  ))}
                </div>

                {/* Floating summary bar */}
                {tables.length > 0 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/90 backdrop-blur-sm border border-stone-200 rounded-full shadow-lg px-4 py-2 text-xs text-ink-500">
                    <span className="font-medium text-ink-700">
                      {tables.length} {tables.length === 1 ? "table" : "tables"}
                    </span>
                    <span className="text-ink-300">·</span>
                    <span>
                      <span className="font-medium text-ink-700">{totalSeated}</span>
                      /
                      <span className="font-medium text-ink-700">{totalCapacity}</span>
                      {" seats"}
                    </span>
                    <span className="text-ink-300">·</span>
                    <span>
                      <span
                        className={cn(
                          "font-medium",
                          unassigned.length > 0
                            ? "text-bordeaux-600"
                            : "text-success-600",
                        )}
                      >
                        {unassigned.length} remaining
                      </span>
                    </span>
                  </div>
                )}
              </div>
            )}

            {isPending && (
              <p className="text-xs text-ink-400 mt-2 text-center">Saving…</p>
            )}
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeGuest && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-bordeaux-500 text-white text-xs font-medium shadow-2xl">
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-bold">
              {activeGuest.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)}
            </span>
            {activeGuest.name}
          </div>
        )}
      </DragOverlay>

      <AddTableModal open={showAdd} onClose={() => setShowAdd(false)} />
    </DndContext>
  );
}
