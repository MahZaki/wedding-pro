"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { acceptInvite } from "@/app/(app)/settings/actions";

export function AcceptInviteButton({
  token,
  weddingId,
}: {
  token: string;
  weddingId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [joined, setJoined] = useState(false);
  const { toast } = useToast();

  function accept() {
    startTransition(async () => {
      const result = await acceptInvite({ token });
      if (result?.error) {
        toast("error", result.error);
        return;
      }
      setJoined(true);
      toast("success", `Welcome to ${result.weddingTitle ?? "the workspace"}!`);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 800);
    });
  }

  if (joined) {
    return (
      <p className="text-sm font-medium text-green-600">Joined! Taking you there…</p>
    );
  }

  void weddingId;

  return (
    <Button onClick={accept} loading={isPending} className="w-full" size="lg">
      Accept invitation
    </Button>
  );
}
