/**
 * Wedding day timeline auto-generator.
 * Logic reference: docs/ai-prompts.md §4
 */

export interface TimelineAnchor {
  venue_access_time: string; // "HH:MM"
  ceremony_start: string;
  golden_hour_time: string;
  reception_dinner_start: string;
  venue_end_time: string;
}

export interface TimelineBlock {
  sort_order: number;
  start_time: string;
  end_time: string | null;
  title: string;
  is_anchor: boolean;
  assigned_roles: string[];
}

const DEFAULT_ROLES: Record<number, string[]> = {
  1: ["Coordinator", "Caterer"],
  2: ["Bridal party"],
  3: ["Bridal party"],
  4: ["Photographer", "Bridal party"],
  5: ["DJ/Band", "Coordinator", "Bridal party"],
  6: ["Coordinator"],
  7: ["Photographer", "Coordinator"],
  8: ["Photographer"],
  9: ["DJ/Band", "Coordinator"],
  10: ["Caterer"],
  11: ["Caterer", "Coordinator"],
  12: ["Coordinator"],
  13: ["DJ/Band"],
  14: ["DJ/Band"],
  15: ["DJ/Band", "Coordinator"],
};

export const TIMELINE_ROLES = [
  "Photographer",
  "Caterer",
  "Coordinator",
  "DJ/Band",
  "Bridal party",
] as const;

function toMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(total: number): string {
  // Wrap around midnight for safety
  const wrapped = ((total % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function generateTimeline(
  anchors: TimelineAnchor,
  ceremonyDurationMinutes = 60
): TimelineBlock[] {
  const v = toMinutes(anchors.venue_access_time);
  const c = toMinutes(anchors.ceremony_start);
  const g = toMinutes(anchors.golden_hour_time);
  const d = toMinutes(anchors.reception_dinner_start);
  const e = toMinutes(anchors.venue_end_time);

  const block = (
    sortOrder: number,
    start: number,
    end: number | null,
    title: string,
    isAnchor: boolean
  ): TimelineBlock => ({
    sort_order: sortOrder,
    start_time: fromMinutes(start),
    end_time: end === null ? null : fromMinutes(end),
    title,
    is_anchor: isAnchor,
    assigned_roles: DEFAULT_ROLES[sortOrder],
  });

  const cd = ceremonyDurationMinutes;

  return [
    block(1, v, v + 180, "Vendor Setup & Decoration", true),
    block(2, c - 180, c - 90, "Bridal Hair & Makeup Begins", false),
    block(3, c - 90, c - 45, "Bridal Party Gets Ready", false),
    block(4, c - 45, c - 15, "First Look Photos", false),
    block(5, c - 15, c, "Guests Seated / Pre-Ceremony Music", false),
    block(6, c, c + cd, "Ceremony", true),
    block(7, c + cd, c + cd + 60, "Cocktail Hour Begins", false),
    block(8, g, g + 45, "Golden Hour / Couple Photos", false),
    block(9, d, d + 15, "Grand Entrance & First Dance", false),
    block(10, d + 15, d + 90, "Dinner Service Begins", false),
    block(11, d + 90, d + 120, "Toasts & Speeches", false),
    block(12, d + 120, d + 135, "Cake Cutting", false),
    block(13, d + 150, e - 30, "Open Dancing", false),
    block(14, e - 30, e - 5, "Last Song Warning", false),
    block(15, e, null, "Event End / Venue Cleared", true),
  ];
}

/** Filters timeline items down to a single role's view. */
export function generateRoleSchedule<T extends { assigned_roles: string[] }>(
  items: T[],
  role: string
): T[] {
  return items.filter((item) => item.assigned_roles.includes(role));
}
