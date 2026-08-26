import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div>
      <h1 className="font-heading text-xl font-bold text-slate-700 mb-1">
        Welcome back
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        Enter your email and we&apos;ll send you a magic link to sign in.
      </p>
      <LoginForm />
    </div>
  );
}
