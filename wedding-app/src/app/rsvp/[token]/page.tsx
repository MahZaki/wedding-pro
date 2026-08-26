import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { RsvpForm } from "@/components/rsvp/RsvpForm";
import { Heart } from "lucide-react";

export const metadata = { title: "RSVP" };
export const dynamic = "force-dynamic";

export default async function RsvpPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!/^[a-f0-9]{32}$/.test(token)) notFound();

  const admin = createAdminClient();

  // Token is the secret; lookup by exact match only.
  const { data: guest } = await admin
    .from("guests")
    .select("id, first_name, last_name, wedding_id, weddings (title)")
    .eq("token", token)
    .maybeSingle();

  if (!guest || !guest.wedding_id) notFound();

  const { data: events } = await admin
    .from("events")
    .select("id, name, date, location")
    .eq("wedding_id", guest.wedding_id)
    .order("date")
    .limit(1);

  const event = events?.[0] ?? null;

  const { data: existingRsvp } = await admin
    .from("rsvps")
    .select("*")
    .eq("guest_id", guest.id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-full bg-rose-500 flex items-center justify-center">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-heading text-xl font-bold text-slate-700">
            {(guest.weddings as unknown as { title: string } | null)?.title ??
              "Wedding"}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h1 className="font-heading text-xl font-bold text-slate-700 text-center">
            Hi, {guest.first_name}!
          </h1>
          <p className="text-sm text-slate-500 text-center mt-1 mb-6">
            Will you be joining us?
            {event && (
              <>
                <br />
                <span className="text-slate-400 text-xs">
                  {event.name}
                  {event.date &&
                    ` · ${new Date(event.date + "T00:00:00").toLocaleDateString(
                      "en-US",
                      { month: "long", day: "numeric", year: "numeric" }
                    )}`}
                  {event.location && ` · ${event.location}`}
                </span>
              </>
            )}
          </p>

          <RsvpForm
            token={token}
            initial={{
              status: existingRsvp?.status ?? "pending",
              dietary: existingRsvp?.dietary ?? "",
              plus_one_name: existingRsvp?.plus_one_name ?? "",
            }}
          />
        </div>

        <p className="mt-4 text-xs text-slate-400 text-center">
          No account needed. Your response is private.
        </p>
      </div>
    </div>
  );
}
