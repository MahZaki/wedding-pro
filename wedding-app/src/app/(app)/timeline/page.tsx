import { requireWedding } from "@/lib/wedding";
import { createClient } from "@/lib/supabase/server";
import { TimelineView } from "@/components/timeline/TimelineView";

export const metadata = { title: "Timeline" };

export default async function TimelinePage() {
  const { wedding, role } = await requireWedding();
  const supabase = await createClient();

  // Primary event + its timeline items
  const { data: event } = await supabase
    .from("events")
    .select("id, name")
    .eq("wedding_id", wedding.id)
    .order("date")
    .limit(1)
    .maybeSingle();

  let items: Array<{
    id: string;
    start_time: string;
    end_time: string | null;
    title: string;
    is_anchor: boolean;
    sort_order: number;
    assigned_roles: string[];
  }> = [];

  if (event) {
    const { data: rows } = await supabase
      .from("timeline_items")
      .select(
        "id, start_time, end_time, title, is_anchor, sort_order, assigned_roles"
      )
      .eq("event_id", event.id)
      .order("sort_order");
    items = (rows ?? []).map((i) => ({
      id: i.id,
      start_time: i.start_time,
      end_time: i.end_time,
      title: i.title,
      is_anchor: i.is_anchor ?? false,
      sort_order: i.sort_order ?? 0,
      assigned_roles: i.assigned_roles ?? [],
    }));
  }

  return (
    <TimelineView
      items={items}
      readOnly={role === "viewer"}
    />
  );
}
