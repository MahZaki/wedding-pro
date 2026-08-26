"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function RsvpForm({
  token,
  initial,
}: {
  token: string;
  initial: { status: string; dietary: string; plus_one_name: string };
}) {
  const [status, setStatus] = useState(initial.status);
  const [dietary, setDietary] = useState(initial.dietary);
  const [plusOne, setPlusOne] = useState(initial.plus_one_name);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status !== "attending" && status !== "declined") {
      setError("Please choose accept or decline first.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/rsvp/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          dietary,
          plus_one_name: plusOne,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not send your RSVP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-4">
        <CheckCircle2 className="w-12 h-12 mx-auto text-success-600 mb-3" />
        <h2 className="font-heading text-lg font-semibold text-ink-700">
          Response received!
        </h2>
        <p className="text-sm text-ink-500 mt-1">Thank you.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink-700 mb-1">
          Your response
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setStatus("attending")}
            aria-pressed={status === "attending"}
            className={`min-h-[48px] rounded-lg border text-sm font-semibold transition-colors ${
              status === "attending"
                ? "bg-success-600 border-success-600 text-white"
                : "border-ink-300 text-ink-600 hover:bg-ink-50"
            }`}
          >
            Joyfully accept
          </button>
          <button
            type="button"
            onClick={() => setStatus("declined")}
            aria-pressed={status === "declined"}
            className={`min-h-[48px] rounded-lg border text-sm font-semibold transition-colors ${
              status === "declined"
                ? "bg-ink-600 border-ink-600 text-white"
                : "border-ink-300 text-ink-600 hover:bg-ink-50"
            }`}
          >
            Regretfully decline
          </button>
        </div>
      </div>

      {status === "attending" && (
        <>
          <Input
            label="Dietary needs (optional)"
            placeholder="Allergies, vegetarian, etc."
            value={dietary}
            onChange={(e) => setDietary(e.target.value)}
          />
          <Input
            label="Plus one's name (if approved)"
            value={plusOne}
            onChange={(e) => setPlusOne(e.target.value)}
          />
        </>
      )}

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-error-600">
          <AlertCircle className="w-4 h-4" /> {error}
        </p>
      )}

      <Button type="submit" loading={loading} className="w-full">
        Send RSVP
      </Button>
    </form>
  );
}
