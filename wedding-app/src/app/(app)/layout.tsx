import { redirect } from "next/navigation";
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
