"use client";

import { useState } from "react";
import { UserPlus, Copy, SkipForward, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

export function InvitePartner({
  weddingId,
  onSkip,
}: {
  weddingId: string;
  onSkip: () => void;
}) {
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [link] = useState(
    () =>
      `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${weddingId}`
  );
  const { toast } = useToast();

  function send() {
    const target = email.trim() || undefined;
    void navigator.clipboard
      .writeText(link)
      .then(() => {
        setCopied(true);
        toast("success", target ? `Invite link ready — share it with ${target}` : "Invite link copied");
      })
      .catch(() => toast("error", "Could not copy invite link"));
  }

  return (
    <div>
      <h2 className="font-heading text-lg font-semibold text-ink-700 mb-1">
        Invite your partner
      </h2>
      <p className="text-sm text-ink-500 mb-5">
        Share a link so they can plan the wedding alongside you. You can skip
        this for now.
      </p>

      <div className="space-y-4">
        <Input
          label="Partner's email (optional)"
          type="email"
          placeholder="partner@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="rounded-lg border border-stone-200 bg-ink-50 p-3">
          <p className="text-xs text-ink-500 mb-2">
            Your invite link (copy &amp; share it with your partner):
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-h-[44px] px-3 flex items-center bg-white border border-ink-300 rounded-lg text-xs text-ink-500 truncate">
              {link}
            </div>
            <Button variant="secondary" onClick={send}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={send}>
            <UserPlus className="w-4 h-4" /> Send invite
          </Button>
          <Button variant="ghost" onClick={onSkip}>
            <SkipForward className="w-4 h-4" /> Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}
