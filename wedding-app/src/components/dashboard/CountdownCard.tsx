import Link from "next/link";
import type { Wedding } from "@/lib/wedding";

const DAY = 24 * 60 * 60 * 1000;

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function CountdownCard({ wedding }: { wedding: Wedding }) {
  const dateStr = wedding.wedding_date;

  if (!dateStr) {
    return (
      <div className="bg-ink-900 rounded-xl border border-ink-800 p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
          Wedding countdown
        </p>
        <p className="mt-2 text-lg font-semibold">
          Set your wedding date to see the countdown
        </p>
        <Link
          href="/setup"
          className="inline-flex items-center justify-center min-h-[44px] px-4 mt-4 rounded-lg bg-bordeaux-500 text-white text-sm font-medium hover:bg-bordeaux-600"
        >
          Set your wedding date
        </Link>
      </div>
    );
  }

  const today = new Date();
  const todayMs = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();
  const weddingMs = new Date(dateStr + "T00:00:00").getTime();
  const days = Math.round((weddingMs - todayMs) / DAY);

  return (
    <div className="bg-ink-900 rounded-xl border border-ink-800 p-6 text-white">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
        Wedding countdown
      </p>

      {days > 1 && (
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-heading text-4xl lg:text-5xl font-bold">
            {days}
          </span>
          <span className="text-ink-300 font-medium">days to go</span>
        </div>
      )}
      {days === 1 && (
        <p className="mt-2 text-lg font-semibold">Tomorrow is the big day!</p>
      )}
      {days === 0 && (
        <p className="mt-2 text-lg font-semibold">Today is your wedding day!</p>
      )}
      {days < 0 && (
        <div className="mt-2">
          <p className="text-lg font-semibold">Congratulations!</p>
          <p className="text-sm text-ink-300">
            married {Math.abs(days)} day{Math.abs(days) === 1 ? "" : "s"} ago
          </p>
        </div>
      )}

      <p className="mt-2 text-sm text-ink-400">{formatDate(dateStr)}</p>
    </div>
  );
}
