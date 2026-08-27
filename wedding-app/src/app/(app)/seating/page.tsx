import { requireWedding } from "@/lib/wedding";
import { createClient } from "@/lib/supabase/server";
import { SeatingBoard } from "@/components/seating/SeatingBoard";
import { computeTableLayout } from "@/components/seating/helpers";

export const metadata = { title: "Seating Chart" };

export default async function SeatingPage() {
  const { wedding, role } = await requireWedding();
  const supabase = await createClient();

  const [{ data: tables }, { data: guests }] = await Promise.all([
    supabase
      .from("tables")
      .select("id, table_number, shape, capacity, label")
      .eq("wedding_id", wedding.id)
      .order("table_number"),
    supabase
      .from("guests")
      .select("id, first_name, last_name, table_id, tags")
      .eq("wedding_id", wedding.id)
      .order("last_name"),
  ]);

  const rawTables = (tables ?? []).map((t) => ({
    id: t.id,
    table_number: t.table_number ?? 0,
    shape: (t.shape ?? "round") as "round" | "banquet" | "square",
    capacity: t.capacity,
    label: t.label,
  }));

  // Auto-layout tables into a fixed, non-overlapping grid.
  const layout = computeTableLayout(rawTables);

  return (
    <SeatingBoard
      tables={rawTables.map((t) => ({
        ...t,
        x: layout.positions.get(t.id)?.x ?? 0,
        y: layout.positions.get(t.id)?.y ?? 0,
      }))}
      canvasWidth={layout.width}
      canvasHeight={layout.height}
      guests={(guests ?? []).map((g) => ({
        id: g.id,
        name: `${g.first_name} ${g.last_name}`,
        table_id: g.table_id,
        tags: g.tags ?? [],
      }))}
      readOnly={role === "viewer"}
    />
  );
}
