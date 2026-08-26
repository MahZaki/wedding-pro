import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  status: z.enum(["attending", "declined"]),
  dietary: z.string().max(500).optional().default(""),
  plus_one_name: z.string().max(120).optional().default(""),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!/^[a-f0-9]{32}$/.test(token)) {
    return NextResponse.json({ error: "Invalid link." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Resolve guest by secret token
  const { data: guest, error: guestError } = await admin
    .from("guests")
    .select("id, wedding_id")
    .eq("token", token)
    .maybeSingle();

  if (guestError || !guest || !guest.wedding_id) {
    return NextResponse.json({ error: "Invalid link." }, { status: 404 });
  }

  // Find the primary event for this guest's wedding; lazily create
  // one if the couple never set events up so RSVPs always work.
  let { data: event } = await admin
    .from("events")
    .select("id")
    .eq("wedding_id", guest.wedding_id)
    .order("date")
    .limit(1)
    .maybeSingle();

  if (!event) {
    const { data: createdEvent, error: eventErr } = await admin
      .from("events")
      .insert({ wedding_id: guest.wedding_id, name: "Wedding Day" })
      .select("id")
      .single();
    if (eventErr || !createdEvent) {
      console.error("rsvp lazy-event:", eventErr);
      return NextResponse.json(
        { error: "RSVPs are not open yet. Check back soon!" },
        { status: 409 }
      );
    }
    event = createdEvent;
  }

  const { error: upsertError } = await admin.from("rsvps").upsert(
    {
      guest_id: guest.id,
      event_id: event.id,
      status: parsed.data.status,
      dietary: parsed.data.dietary || null,
      plus_one_name: parsed.data.plus_one_name || null,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: "guest_id,event_id" }
  );

  if (upsertError) {
    console.error("rsvp upsert:", upsertError);
    return NextResponse.json(
      { error: "Could not save your response. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
