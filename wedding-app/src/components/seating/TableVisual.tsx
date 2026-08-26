"use client";

import { useState } from "react";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TableView, GuestView } from "./SeatingBoard";
import {
  getTableFootprint,
  getSeatPositions,
  tableBodyOffset,
  tableBodyDimensions,
} from "./helpers";

export function TableVisual({
  table,
  guests,
  readOnly,
  onRemoveGuest,
  onDelete,
}: {
  table: TableView;
  guests: GuestView[];
  readOnly: boolean;
  onRemoveGuest: (guestId: string) => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const full = guests.length >= table.capacity;

  const footprint = getTableFootprint(table.shape, table.capacity);
  const seats = getSeatPositions(
    table.shape,
    table.capacity,
    footprint.width,
    footprint.height,
    guests,
  );
  const bodyOff = tableBodyOffset(table.shape, footprint.width, footprint.height);
  const bodyDim = tableBodyDimensions(table.shape);

  const droppable = useDroppable({ id: `table-${table.id}` });
  const draggable = useDraggable({
    id: `table-${table.id}`,
    disabled: readOnly,
    data: { type: "table", table },
  });

  const shapeClass =
    table.shape === "round"
      ? "rounded-full"
      : table.shape === "square"
        ? "rounded-lg"
        : "rounded-xl";

  const isOver = droppable.isOver;
  const isDragging = draggable.isDragging;

  return (
    <div
      ref={(node) => {
        droppable.setNodeRef(node);
        draggable.setNodeRef(node);
      }}
      {...(!readOnly ? draggable.listeners : {})}
      {...draggable.attributes}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute",
        left: table.pos_x + (draggable.transform?.x ?? 0),
        top: table.pos_y + (draggable.transform?.y ?? 0),
        width: footprint.width,
        height: footprint.height,
      }}
      className={cn(
        "select-none group",
        !readOnly && "cursor-grab active:cursor-grabbing touch-none",
      )}
    >
      {/* Table body — centered inside footprint */}
      <div
        className={cn(
          "absolute border-2 shadow-sm transition-all duration-150",
          shapeClass,
          isOver
            ? "border-bordeaux-500 bg-bordeaux-50/60 shadow-md scale-[1.02]"
            : full
              ? "border-stone-300 bg-stone-50"
              : "border-stone-200 bg-white",
          hovered && !isOver && "border-bordeaux-300 shadow-md",
          isDragging && "opacity-50 scale-95",
        )}
        style={{
          left: bodyOff.x,
          top: bodyOff.y,
          width: bodyDim.w,
          height: bodyDim.h,
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <span className="font-heading text-sm font-bold text-ink-700 leading-tight">
            {table.label ?? `Table ${table.table_number}`}
          </span>
          <span
            className={cn(
              "text-[11px] font-medium mt-0.5",
              full ? "text-error-600" : "text-ink-400",
            )}
          >
            {guests.length} / {table.capacity}
          </span>
        </div>
      </div>

      {/* Seats — positioned relative to footprint top-left */}
      {seats.map((s, i) => (
        <SeatCircle
          key={i}
          x={s.x}
          y={s.y}
          guest={s.guest}
          seatIndex={i}
          tableId={table.id}
          readOnly={readOnly}
          onRemoveGuest={onRemoveGuest}
        />
      ))}

      {/* Contextual toolbar */}
      {!readOnly && hovered && (
        <div
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white border border-stone-200 rounded-lg shadow-lg px-2 py-1 z-30"
          style={{ bottom: -36 }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 rounded text-ink-300 hover:text-error-600 hover:bg-error-50 transition-colors"
            title="Delete table"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Empty seat (droppable only) ─────────────────────────────── */

function EmptySeat({
  x,
  y,
  tableId,
  seatIndex,
}: {
  x: number;
  y: number;
  tableId: string;
  seatIndex: number;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `seat-${tableId}-empty-${seatIndex}`,
    data: { type: "seat", tableId, guest: null },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ position: "absolute", left: x - 14, top: y - 14 }}
      className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 select-none",
        "border-2 border-dashed border-stone-300 bg-white",
        isOver && "ring-2 ring-bordeaux-400 ring-offset-1 scale-110 border-bordeaux-300 bg-bordeaux-50",
      )}
      title="Drop a guest here"
    />
  );
}

/* ── Occupied seat (droppable + draggable) ────────────────────── */

function OccupiedSeat({
  x,
  y,
  guest,
  tableId,
  readOnly,
  onRemoveGuest,
}: {
  x: number;
  y: number;
  guest: GuestView;
  tableId: string;
  readOnly: boolean;
  onRemoveGuest: (guestId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `seat-${tableId}-${guest.id}`,
    data: { type: "seat", tableId, guest },
  });

  const draggable = useDraggable({
    id: `guest-${guest.id}`,
    disabled: readOnly,
    data: { type: "guest", guest, fromSeat: true },
  });

  const initials = guest.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        draggable.setNodeRef(node);
      }}
      {...draggable.listeners}
      {...draggable.attributes}
      style={{
        position: "absolute",
        left: x - 14,
        top: y - 14,
        ...(draggable.transform
          ? { transform: `translate(${draggable.transform.x}px, ${draggable.transform.y}px)` }
          : {}),
      }}
      className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-150 select-none",
        "bg-bordeaux-100 text-bordeaux-700 border-2 border-bordeaux-300 cursor-grab active:cursor-grabbing touch-none",
        isOver && "ring-2 ring-bordeaux-400 ring-offset-1 scale-110",
        draggable.isDragging && "opacity-30",
      )}
      onMouseDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (!readOnly) onRemoveGuest(guest.id);
      }}
      title={`${guest.name} — double-click to remove`}
    >
      {initials}
    </div>
  );
}

/* ── Seat dispatcher ─────────────────────────────────────────── */

function SeatCircle({
  x,
  y,
  guest,
  seatIndex,
  tableId,
  readOnly,
  onRemoveGuest,
}: {
  x: number;
  y: number;
  guest: GuestView | null;
  seatIndex: number;
  tableId: string;
  readOnly: boolean;
  onRemoveGuest: (guestId: string) => void;
}) {
  return guest ? (
    <OccupiedSeat
      x={x}
      y={y}
      guest={guest}
      tableId={tableId}
      readOnly={readOnly}
      onRemoveGuest={onRemoveGuest}
    />
  ) : (
    <EmptySeat x={x} y={y} tableId={tableId} seatIndex={seatIndex} />
  );
}
