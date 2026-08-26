import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  // Only allow same-app relative paths
  const next =
    params.next && params.next.startsWith("/") ? params.next : "/dashboard";

  return (
    <div>
      <h1 className="font-heading text-xl font-bold text-slate-700 mb-1">
        Welcome back
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        Enter your email and we&apos;ll send you a magic link to sign in.
      </p>
      {params.error === "auth_failed" && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Sign-in link was invalid or expired. Please request a new one.
        </p>
      )}
      <LoginForm next={next} />
    </div>
  );
}
