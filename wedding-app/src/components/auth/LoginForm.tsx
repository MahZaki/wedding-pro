"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback`
              : undefined,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      toast(
        "error",
        err instanceof Error ? err.message : "Failed to send login link."
      );
    }
  }

  if (sent) {
    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <MailCheck className="w-7 h-7 text-green-600" />
        </div>
        <h2 className="font-heading text-lg font-semibold text-slate-700 mb-2">
          Check your email
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          We sent a sign-in link to{" "}
          <span className="font-semibold">{getValues("email")}</span>. Click the
          link to log in.
        </p>
        <Button variant="secondary" onClick={() => setSent(false)}>
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Email address"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <Button type="submit" loading={isSubmitting} className="w-full">
        Send magic link
      </Button>
    </form>
  );
}
