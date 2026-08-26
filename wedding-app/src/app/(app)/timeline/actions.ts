"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireWedding } from "@/lib/wedding";
import { generateTimeline } from "@/lib/timeline/generate";
import type { ActionResult } from "@/lib/action-result";

const anchorsSchema = z.object({
  venue_access_time: z.string().regex(/^\d{2}:\d{2}$/),
  ceremony_start: z.string().regex(/^\d{2}:\d{2}$/),
  golden_hour_time: z.string().regex(/^\d{2}:\d{2}$/),
  reception_dinner_start: z.string().regex(/^\d{2}:\d{2}$/),
  venue_end_time: z.string().regex(/^\d{2}:\d{2}$/),
});

async function ensureEvent(weddingId: string): Promise<
  { id: string } | { error: string }
> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("events")
    .select("id")
    .eq("wedding_id", weddingId)
    .order("date")
    .limit(1)
    .maybeSingle();

  if (existing) return existing;

  const { data: created, error } = await supabase
    .from("events")
    .insert({ wedding_id: weddingId, name: "Wedding Day" })
    .select("id")
    .single();

  if (error || !created) return { error: "Could not create event." };
  return created;
}

/** Regenerates all non-anchor timeline items from the 5 anchors. */
export async function regenerateTimeline(input: unknown): Promise<ActionResult> {
  const parsed = anchorsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "All five anchor times are required." };
  }

  const { wedding } = await requireWedding();
  const eventResult = await ensureEvent(wedding.id);
  if ("error" in eventResult) return eventResult;
  const eventId = eventResult.id;

  const supabase = await createClient();
  const blocks = generateTimeline(parsed.data);

  // Remove old items and insert fresh set (regeneration semantics)
  const { error: delError } = await supabase
    .from("timeline_items")
    .delete()
    .eq("event_id", eventId);

  if (delError) {
    console.error("regenerateTimeline delete:", delError);
    return { error: "Failed to update the timeline." };
  }

  const { error: insError } = await supabase
    .from("timeline_items")
    .insert(blocks.map((b) => ({ ...b, event_id: eventId })));

  if (insError) {
    console.error("regenerateTimeline insert:", insError);
    return { error: "Failed to generate the timeline." };
  }

  revalidatePath("/timeline");
  return { ok: true };
}

const updateItemSchema = z.object({
  id: z.string().uuid(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  title: z.string().min(1).max(160).optional(),
});

export async function updateTimelineItem(input: unknown): Promise<ActionResult> {
  const parsed = updateItemSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid item" };

  const { id, ...fields } = parsed.data;
  await requireWedding();
  const supabase = await createClient();

  const { error } = await supabase
    .from("timeline_items")
    .update(fields)
    .eq("id", id);

  if (error) {
    console.error("updateTimelineItem:", error);
    return { error: "Failed to save." };
  }

  revalidatePath("/timeline");
  return { ok: true };
}

export async function deleteTimelineItem(input: unknown): Promise<ActionResult> {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { error: "Invalid item" };

  await requireWedding();
  const supabase = await createClient();

  const { error } = await supabase
    .from("timeline_items")
    .delete()
    .eq("id", parsed.data.id);

  if (error) {
    console.error("deleteTimelineItem:", error);
    return { error: "Failed to delete." };
  }

  revalidatePath("/timeline");
  return { ok: true };
}
