import type { GuestView } from "./SeatingBoard";

const CONFLICT_TAGS = ["divorced-parents", "conflict", "ex"];

export function hasConflict(guest: GuestView): boolean {
  return guest.tags.some((t) => CONFLICT_TAGS.includes(t.toLowerCase()));
}

const SEAT_R = 14;
const SAFETY = 24;

/* ── Raw seat positions (relative to footprint top-left) ────────── */

function seatCircle(cx: number, cy: number, r: number, n: number) {
  return Array.from({ length: n }, (_, i) => {
    const a = (2 * Math.PI * i) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
}

function seatBanquet(cx: number, cy: number, w: number, h: number, n: number) {
  if (n === 0) return [];
  const perim = 2 * (w + h);
  return Array.from({ length: n }, (_, i) => {
    const d = ((i + 0.5) / n) * perim;
    if (d < w) return { x: cx - w / 2 + d, y: cy - h / 2 - SEAT_R - 4 };
    if (d < w + h) return { x: cx + w / 2 + SEAT_R + 4, y: cy - h / 2 + (d - w) };
    if (d < 2 * w + h) return { x: cx + w / 2 - (d - w - h), y: cy + h / 2 + SEAT_R + 4 };
    return { x: cx - w / 2 - SEAT_R - 4, y: cy + h / 2 - (d - 2 * w - h) };
  });
}

function seatSquare(cx: number, cy: number, s: number, n: number) {
  if (n === 0) return [];
  const perim = 4 * s;
  return Array.from({ length: n }, (_, i) => {
    const d = ((i + 0.5) / n) * perim;
    if (d < s) return { x: cx - s / 2 + d, y: cy - s / 2 - SEAT_R - 4 };
    if (d < 2 * s) return { x: cx + s / 2 + SEAT_R + 4, y: cy - s / 2 + (d - s) };
    if (d < 3 * s) return { x: cx + s / 2 - (d - 2 * s), y: cy + s / 2 + SEAT_R + 4 };
    return { x: cx - s / 2 - SEAT_R - 4, y: cy + s / 2 - (d - 3 * s) };
  });
}

/* ── Public: seat positions relative to footprint top-left ──────── */

export interface SeatPos {
  x: number;
  y: number;
  guest: GuestView | null;
}

export function getSeatPositions(
  shape: "round" | "banquet" | "square",
  capacity: number,
  footprintW: number,
  footprintH: number,
  seated: GuestView[],
): SeatPos[] {
  const cx = footprintW / 2;
  const cy = footprintH / 2;

  let pts: { x: number; y: number }[];
  switch (shape) {
    case "round": {
      const r = Math.max(72, Math.ceil(capacity * 5.5));
      pts = seatCircle(cx, cy, r, capacity);
      break;
    }
    case "banquet":
      pts = seatBanquet(cx, cy, 188, 108, capacity);
      break;
    case "square":
      pts = seatSquare(cx, cy, 112, capacity);
      break;
  }

  return pts.map((p, i) => ({ ...p, guest: seated[i] ?? null }));
}

/* ── Footprint dimensions ───────────────────────────────────────── */

export interface Footprint {
  width: number;
  height: number;
}

function tableBodySize(shape: "round" | "banquet" | "square") {
  switch (shape) {
    case "round": return { w: 160, h: 160 };
    case "banquet": return { w: 200, h: 120 };
    case "square": return { w: 140, h: 140 };
  }
}

function seatBounds(
  shape: "round" | "banquet" | "square",
  capacity: number,
  fw: number,
  fh: number,
) {
  const seats = getSeatPositions(shape, capacity, fw, fh, []);
  if (seats.length === 0) return { minX: fw / 2, maxX: fw / 2, minY: fh / 2, maxY: fh / 2 };
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const s of seats) {
    minX = Math.min(minX, s.x);
    maxX = Math.max(maxX, s.x);
    minY = Math.min(minY, s.y);
    maxY = Math.max(maxY, s.y);
  }
  return { minX, maxX, minY, maxY };
}

export function getTableFootprint(
  shape: "round" | "banquet" | "square",
  capacity: number,
): Footprint {
  const body = tableBodySize(shape);
  const minW = body.w + 2 * (SEAT_R + SAFETY);
  const minH = body.h + 2 * (SEAT_R + SAFETY);

  // Iterative: grow footprint until seats fit inside
  let fw = minW;
  let fh = minH;
  for (let i = 0; i < 5; i++) {
    const b = seatBounds(shape, capacity, fw, fh);
    const needW = b.maxX + SEAT_R + SAFETY - (fw - b.minX - SEAT_R - SAFETY);
    const needH = b.maxY + SEAT_R + SAFETY - (fh - b.minY - SEAT_R - SAFETY);
    if (needW <= 0 && needH <= 0) break;
    fw = Math.max(fw, fw + Math.ceil(needW / 2) * 2);
    fh = Math.max(fh, fh + Math.ceil(needH / 2) * 2);
  }

  return { width: fw, height: fh };
}

/* ── AABB overlap test ──────────────────────────────────────────── */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

/* ── Table body offset inside footprint ─────────────────────────── */

export function tableBodyOffset(
  shape: "round" | "banquet" | "square",
  footprintW: number,
  footprintH: number,
): { x: number; y: number } {
  const body = tableBodySize(shape);
  return {
    x: (footprintW - body.w) / 2,
    y: (footprintH - body.h) / 2,
  };
}

export function tableBodyDimensions(shape: "round" | "banquet" | "square") {
  return tableBodySize(shape);
}
