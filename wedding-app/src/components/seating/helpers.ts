import type { GuestView } from "./SeatingBoard";

const CONFLICT_TAGS = ["divorced-parents", "conflict", "ex"];

export function hasConflict(guest: GuestView): boolean {
  return guest.tags.some((t) => CONFLICT_TAGS.includes(t.toLowerCase()));
}

export interface SeatPos {
  x: number;
  y: number;
  guest: GuestView | null;
}

function round(cx: number, cy: number, r: number, n: number): { x: number; y: number }[] {
  return Array.from({ length: n }, (_, i) => {
    const a = ((2 * Math.PI * i) / n) - Math.PI / 2;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
}

function banquet(cx: number, cy: number, w: number, h: number, n: number): { x: number; y: number }[] {
  if (n === 0) return [];
  const seat = 28;
  const perimeter = 2 * (w + h);
  const positions: { x: number; y: number }[] = [];

  for (let i = 0; i < n; i++) {
    const d = ((i + 0.5) / n) * perimeter;

    if (d < w) {
      positions.push({ x: cx - w / 2 + d, y: cy - h / 2 - seat / 2 - 2 });
    } else if (d < w + h) {
      positions.push({ x: cx + w / 2 + seat / 2 + 2, y: cy - h / 2 + (d - w) });
    } else if (d < 2 * w + h) {
      positions.push({ x: cx + w / 2 - (d - w - h), y: cy + h / 2 + seat / 2 + 2 });
    } else {
      positions.push({ x: cx - w / 2 - seat / 2 - 2, y: cy + h / 2 - (d - 2 * w - h) });
    }
  }
  return positions;
}

function square(cx: number, cy: number, s: number, n: number): { x: number; y: number }[] {
  if (n === 0) return [];
  const seat = 28;
  const perimeter = 4 * s;
  const positions: { x: number; y: number }[] = [];

  for (let i = 0; i < n; i++) {
    const d = ((i + 0.5) / n) * perimeter;

    if (d < s) {
      positions.push({ x: cx - s / 2 + d, y: cy - s / 2 - seat / 2 - 2 });
    } else if (d < 2 * s) {
      positions.push({ x: cx + s / 2 + seat / 2 + 2, y: cy - s / 2 + (d - s) });
    } else if (d < 3 * s) {
      positions.push({ x: cx + s / 2 - (d - 2 * s), y: cy + s / 2 + seat / 2 + 2 });
    } else {
      positions.push({ x: cx - s / 2 - seat / 2 - 2, y: cy + s / 2 - (d - 3 * s) });
    }
  }
  return positions;
}

export function getSeatPositions(
  shape: "round" | "banquet" | "square",
  capacity: number,
  cx: number,
  cy: number,
  seated: GuestView[],
): SeatPos[] {
  let pts: { x: number; y: number }[];

  switch (shape) {
    case "round": {
      const r = Math.max(72, Math.ceil(capacity * 5.5));
      pts = round(cx, cy, r, capacity);
      break;
    }
    case "banquet":
      pts = banquet(cx, cy, 188, 108, capacity);
      break;
    case "square":
      pts = square(cx, cy, 112, capacity);
      break;
  }

  return pts.map((p, i) => ({
    ...p,
    guest: seated[i] ?? null,
  }));
}
