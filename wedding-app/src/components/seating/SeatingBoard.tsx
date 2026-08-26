"use client";

/* eslint-disable react-hooks/refs -- @dnd-kit's API exposes ref-derived values for render */

import { useMemo, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Plus, Table2, Trash2, AlertTriangle, GripHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import {
  addTable,
  moveTable,
  deleteTable,
  assignGuest,
} from "@/app/(app)/seating/actions";

interface TableView {
  id: string;
  table_number: number;
  shape: "round" | "banquet" | "square";
  capacity: number;
  pos_x: number;
  pos_y: number;
  label: string | null;
}

interface GuestView {
  id: string;
  name: string;
  table_id: string | null;
  tags: string[];
}

const CONFLICT_TAGS = ["divorced-parents", "conflict", "ex"];

function hasConflict(guest: GuestView): boolean {
  return guest.tags.some((t) => CONFLICT_TAGS.includes(t.toLowerCase()));
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

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

  function onDragStart(e: DragStartEvent) {
    const data = e.active.data.current as
      | { type: "guest"; guest: GuestView }
      | { type: "table" }
      | undefined;
    if (data?.type === "guest") setActiveGuest(data.guest);
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveGuest(null);
    const data = e.active.data.current as
      | { type: "guest"; guest: GuestView }
      | { type: "table"; table: TableView }
      | undefined;

    if (readOnly || !data) return;

    if (data.type === "guest") {
      const overId = e.over?.id as string | undefined;

      if (!overId || overId === "unassigned-pool") {
        if (data.guest.table_id === null) return;
        startTransition(async () => {
          const result = await assignGuest({ guestId: data.guest.id, tableId: null });
          if (result?.error) toast("error", result.error);
        });
        return;
      }

      if (overId.startsWith("table-")) {
        const tableId = overId.replace("table-", "");
        if (data.guest.table_id === tableId) return;
        const table = tables.find((t) => t.id === tableId);
        const current = seatedByTable.get(tableId)?.length ?? 0;
        const isMovingOut =
          data.guest.table_id && data.guest.table_id !== tableId ? 0 : 0;
        void isMovingOut;
        if (table && current >= table.capacity) {
          toast(
            "warning",
            `Table ${table.table_number} is full (${current}/${table.capacity})`
          );
          return;
        }
        startTransition(async () => {
          const result = await assignGuest({
            guestId: data.guest.id,
            tableId,
          });
          if (result?.error) toast("error", result.error);
        });
      }
      return;
    }

    if (data.type === "table" && e.delta) {
      const t = data.table;
      const nx = Math.max(0, Math.round(t.pos_x + e.delta.x));
      const ny = Math.max(0, Math.round(t.pos_y + e.delta.y));
      if (nx === t.pos_x && ny === t.pos_y) return;
      // Optimistic-free: server action then refresh via revalidatePath
      startTransition(async () => {
        await moveTable({ id: t.id, pos_x: nx, pos_y: ny });
      });
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-heading text-2xl lg:text-3xl font-bold text-slate-700">
            Seating Chart
          </h1>
          {!readOnly && (
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4" /> Add table
            </Button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Unassigned pool */}
          <UnassignedPool
            guests={unassigned}
            countLabel={`${unassigned.length}`}
            readOnly={readOnly}
          />

          {/* Canvas */}
          <div className="flex-1 min-w-0">
            {tables.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 h-64 flex items-center justify-center">
                <EmptyState
                  icon={Table2}
                  title="No tables configured"
                  description="Add your reception tables to start seating guests."
                  action={
                    !readOnly ? (
                      <Button onClick={() => setShowAdd(true)}>Add Tables</Button>
                    ) : undefined
                  }
                />
              </div>
            ) : (
              <div className="relative bg-white rounded-lg border border-gray-200 overflow-auto h-[560px] touch-none">
                <div
                  className="relative"
                  style={{
                    width: Math.max(...tables.map((t) => t.pos_x + 220), 800),
                    height: Math.max(...tables.map((t) => t.pos_y + 200), 520),
                    minWidth: "100%",
                  }}
                >
                  {tables.map((t) => (
                    <TableCard
                      key={t.id}
                      table={t}
                      guests={seatedByTable.get(t.id) ?? []}
                      readOnly={readOnly}
                      onDelete={() =>
                        startTransition(async () => {
                          if (!confirm(`Delete table ${t.table_number}?`)) return;
                          const result = await deleteTable({ id: t.id });
                          if (result?.error) toast("error", result.error);
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            )}
            {isPending && (
              <p className="text-xs text-slate-400 mt-2">Saving…</p>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeGuest && (
            <span className="inline-flex items-center px-3 py-2 rounded-full bg-rose-500 text-white text-xs font-medium shadow-lg">
              {activeGuest.name}
            </span>
          )}
        </DragOverlay>
      </div>

      <AddTableModal open={showAdd} onClose={() => setShowAdd(false)} />
    </DndContext>
  );
}

function UnassignedPool({
  guests,
  readOnly,
}: {
  guests: GuestView[];
  countLabel?: string;
  readOnly?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "unassigned-pool" });
  return (
    <aside
      ref={setNodeRef}
      className={cn(
        "lg:w-64 flex-shrink-0 bg-white rounded-lg border p-3 max-h-[420px] lg:max-h-none overflow-y-auto",
        isOver ? "border-rose-400 bg-rose-50" : "border-gray-200"
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2 sticky top-0 bg-white pb-1">
        Unassigned ({guests.length})
      </p>
      {guests.length === 0 ? (
        <p className="text-xs text-slate-400 py-4 text-center">
          Everyone has a seat!
        </p>
      ) : (
        <ul className="space-y-1.5">
          {guests.map((g) => (
            <GuestChip key={g.id} guest={g} readOnly={readOnly} />
          ))}
        </ul>
      )}
    </aside>
  );
}

function GuestChip({
  guest,
  small = false,
  readOnly = false,
}: {
  guest: GuestView;
  small?: boolean;
  readOnly?: boolean;
}) {
  const draggable = useDraggable({
    id: `guest-${guest.id}`,
    disabled: readOnly,
    data: { type: "guest", guest },
  });

  const conflict = hasConflict(guest);

  return (
    <span
      ref={draggable.setNodeRef}
      {...draggable.listeners}
      {...draggable.attributes}
      style={draggable.transform ? { transform: `translate(${draggable.transform.x}px, ${draggable.transform.y}px)` } : undefined}
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium cursor-grab active:cursor-grabbing select-none touch-none",
        small ? "max-w-[150px]" : "",
        conflict ? "bg-yellow-100 text-yellow-800" : "bg-slate-100 text-slate-700",
        draggable.isDragging && "opacity-40"
      )}
      title={conflict ? "Has a conflict tag" : undefined}
    >
      {conflict && <AlertTriangle className="w-3 h-3 flex-shrink-0" />}
      <span className="truncate">{guest.name}</span>
    </span>
  );
}

function TableCard({
  table,
  guests,
  readOnly,
  onDelete,
}: {
  table: TableView;
  guests: GuestView[];
  readOnly: boolean;
  onDelete: () => void;
}) {
  const droppable = useDroppable({ id: `table-${table.id}` });
  const draggable = useDraggable({
    id: `table-${table.id}`,
    disabled: readOnly,
    data: { type: "table", table },
  });

  const full = guests.length >= table.capacity;

  return (
    <div
      ref={(node) => {
        droppable.setNodeRef(node);
        draggable.setNodeRef(node);
      }}
      {...(!readOnly ? draggable.listeners : {})}
      {...draggable.attributes}
      style={{
        position: "absolute",
        left: table.pos_x + (draggable.transform?.x ?? 0),
        top: table.pos_y + (draggable.transform?.y ?? 0),
      }}
      className={cn(
        "select-none",
        !readOnly && "cursor-grab active:cursor-grabbing touch-none"
      )}
    >
      <div
        className={cn(
          "rounded-lg border-2 bg-white shadow-sm transition-colors",
          table.shape === "round" ? "rounded-full w-36 h-36" : "w-44 min-h-28",
          full ? "border-red-300" : "border-slate-300",
          droppable.isOver && "border-rose-500 bg-rose-50",
          draggable.isDragging && "opacity-60"
        )}
      >
        <div className="p-2 text-center">
          <p className="font-heading text-sm font-bold text-slate-700 leading-tight">
            {table.label ?? `Table ${table.table_number}`}
          </p>
          <p
            className={cn(
              "text-xs mt-0.5",
              full ? "text-red-500 font-semibold" : "text-slate-400"
            )}
          >
            {guests.length}/{table.capacity}
          </p>
        </div>
        <div className="px-2 pb-2 flex flex-wrap gap-1 justify-center max-h-20 overflow-hidden">
          {guests.map((g) => (
            <GuestChip key={g.id} guest={g} small readOnly={readOnly} />
          ))}
        </div>
      </div>
      {!readOnly && (
        <button
          onClick={onDelete}
          aria-label={`Delete ${table.label ?? `table ${table.table_number}`}`}
          className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center text-slate-400 hover:text-red-600"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
      {!readOnly && (
        <GripHorizontal className="absolute -bottom-1 -right-1 w-4 h-4 text-slate-300" />
      )}
    </div>
  );
}

function AddTableModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [shape, setShape] = useState("round");
  const [capacity, setCapacity] = useState("8");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const cap = Number(capacity);
    if (!cap || cap < 1) {
      toast("warning", "Enter a capacity of at least 1");
      return;
    }
    setLoading(true);
    const result = await addTable({ capacity: cap, shape });
    setLoading(false);
    if (result?.error) {
      toast("error", result.error);
      return;
    }
    toast("success", "Table added");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Add table">
      <form onSubmit={submit} className="space-y-4">
        <Select
          label="Shape"
          options={[
            { value: "round", label: "Round" },
            { value: "banquet", label: "Banquet" },
            { value: "square", label: "Square" },
          ]}
          value={shape}
          onChange={(e) => setShape(e.target.value)}
        />
        <Input
          label="Seats (capacity)"
          type="number"
          min="1"
          max="24"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
        />
        <Button type="submit" loading={loading} className="w-full">
          Add table
        </Button>
      </form>
    </Modal>
  );
}
