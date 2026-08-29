import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getWeddingForUser } from "@/lib/wedding";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const membership = await getWeddingForUser();
  if (!membership) redirect("/onboarding");

  // First-run setup guard: redirect to the setup wizard until the couples'
  // setup is complete. Legacy rows (null) are treated as complete; only an
  // explicit `false` triggers the wizard. Excludes the `/setup` route itself
  // to avoid a redirect loop.
  if (membership.wedding.setup_complete === false) {
    const pathname = (await headers()).get("x-pathname") ?? "";
    if (!pathname.startsWith("/setup")) {
      redirect("/setup");
    }
  }

  return (
    <Sidebar
      weddingTitle={membership.wedding.title}
      role={membership.role}
      email={user.email ?? ""}
    >
      {children}
    </Sidebar>
  );
}
