import { requireWedding } from "@/lib/wedding";
import { createClient } from "@/lib/supabase/server";
import { SeatingBoard } from "@/components/seating/SeatingBoard";

export const metadata = { title: "Seating Chart" };

export default async function SeatingPage() {
  const { wedding, role } = await requireWedding();
  const supabase = await createClient();

  const [{ data: tables }, { data: guests }] = await Promise.all([
    supabase
      .from("tables")
      .select("id, table_number, shape, capacity, pos_x, pos_y, label")
      .eq("wedding_id", wedding.id)
      .order("table_number"),
    supabase
      .from("guests")
      .select("id, first_name, last_name, table_id, tags")
      .eq("wedding_id", wedding.id)
      .order("last_name"),
  ]);

  return (
    <SeatingBoard
      tables={(tables ?? []).map((t) => ({
        id: t.id,
        table_number: t.table_number ?? 0,
        shape: (t.shape ?? "round") as "round" | "banquet" | "square",
        capacity: t.capacity,
        pos_x: Number(t.pos_x ?? 0),
        pos_y: Number(t.pos_y ?? 0),
        label: t.label,
      }))}
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
