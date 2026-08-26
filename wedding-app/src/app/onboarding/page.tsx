import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VowlyLogo } from "@/components/brand/VowlyLogo";
import { ConvergingPaths } from "@/components/brand/ConvergingPaths";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";

export const metadata = { title: "Create your workspace" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("wedding_members")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) redirect("/dashboard");

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-paper p-4 overflow-hidden">
      <ConvergingPaths className="absolute inset-x-0 top-0 h-[420px] pointer-events-none" />
      <div className="relative mb-8">
        <VowlyLogo size={34} animated />
      </div>
      <div className="relative bg-white rounded-xl border border-ink-200 shadow-sm p-6 w-full max-w-md">
        <h1 className="font-heading text-xl font-bold text-ink-700 mb-1">
          Set up your workspace
        </h1>
        <p className="text-sm text-ink-500 mb-6">
          Answer a few questions and we&apos;ll build your budget automatically.
        </p>
        <OnboardingForm />
      </div>
    </div>
  );
}
