const CONFLICT_TAGS = ["divorced-parents", "conflict", "ex"];

export interface GuestView {
  id: string;
  name: string;
  table_id: string | null;
  tags: string[];
}

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

export function getTableFootprint(
  shape: "round" | "banquet" | "square",
  capacity: number,
): Footprint {
  const body = tableBodySize(shape);

  // Tight footprint that exactly wraps the table body + all seats.
  // Seats sit at max(72, cap*5.5) radius from center (round) or on the
  // body perimeter (banquet/square) with a SEAT_R + 4 offset.
  if (shape === "round") {
    const r = Math.max(72, Math.ceil(capacity * 5.5));
    const d = 2 * (r + SEAT_R) + 2 * SAFETY;
    return { width: d, height: d };
  }

  const extentW = body.w + 2 * (SEAT_R + 4);
  const extentH = body.h + 2 * (SEAT_R + 4);
  return {
    width: extentW + 2 * SAFETY,
    height: extentH + 2 * SAFETY,
  };
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

/* ── Grid layout (auto-placement) ────────────────────────────────── */

export interface LayoutTableInput {
  id: string;
  shape: "round" | "banquet" | "square";
  capacity: number;
  table_number?: number | null;
}

export interface CanvasLayout {
  positions: Map<string, { x: number; y: number }>;
  width: number;
  height: number;
}

/**
 * Deterministically arrange tables into a non-overlapping grid.
 * Order (by table_number) maps to grid slots. Uses the largest
 * footprint as a uniform cell so rows align cleanly.
 */
export function computeTableLayout(
  tables: LayoutTableInput[],
  canvasWidth = 1000,
): CanvasLayout {
  const PAD = 60;
  const GAP_X = 54;
  const GAP_Y = 72;

  const sorted = [...tables].sort(
    (a, b) => (a.table_number ?? 0) - (b.table_number ?? 0),
  );

  const positions = new Map<string, { x: number; y: number }>();

  if (sorted.length === 0) {
    return { positions, width: 900, height: 600 };
  }

  let cellW = 0;
  let cellH = 0;
  for (const t of sorted) {
    const fp = getTableFootprint(t.shape, t.capacity);
    cellW = Math.max(cellW, fp.width);
    cellH = Math.max(cellH, fp.height);
  }

  let x = PAD;
  let y = PAD;
  let maxX = PAD;
  let maxY = PAD;

  for (const t of sorted) {
    const fp = getTableFootprint(t.shape, t.capacity);

    positions.set(t.id, { x, y });
    maxX = Math.max(maxX, x + fp.width);
    maxY = Math.max(maxY, y + fp.height);

    x += cellW + GAP_X;
    if (x + cellW > canvasWidth - PAD) {
      x = PAD;
      y += cellH + GAP_Y;
    }
  }

  return {
    positions,
    width: Math.max(maxX + PAD, 900),
    height: Math.max(maxY + PAD, 600),
  };
}
