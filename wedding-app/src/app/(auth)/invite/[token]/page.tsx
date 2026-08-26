import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Heart } from "lucide-react";
import { AcceptInviteButton } from "@/components/auth/AcceptInviteButton";

export const metadata = { title: "Accept invitation" };

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);

  // Validate the invite target exists
  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, title")
    .eq("id", token)
    .maybeSingle();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center">
          <Heart className="w-5 h-5 text-white fill-white" />
        </div>
        <span className="font-heading text-3xl font-bold text-slate-700">
          Vowly
        </span>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 w-full max-w-md text-center">
        {wedding ? (
          <>
            <h1 className="font-heading text-xl font-bold text-slate-700 mb-1">
              You&apos;re invited!
            </h1>
            <p className="text-sm text-slate-500 mb-6">
              Join{" "}
              <span className="font-semibold">
                {(wedding as unknown as { title: string }).title}
              </span>{" "}
              as a co-planner.
            </p>
            <AcceptInviteButton token={token} weddingId={wedding.id} />
          </>
        ) : (
          <>
            <h1 className="font-heading text-xl font-bold text-slate-700 mb-2">
              Invalid invitation
            </h1>
            <p className="text-sm text-slate-500">
              This invite link doesn&apos;t exist or has been revoked.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
