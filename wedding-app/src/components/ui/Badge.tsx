import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type BadgeVariant =
  | "success"
  | "pending"
  | "danger"
  | "premium"
  | "neutral";

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  danger: "bg-red-100 text-red-700",
  premium: "bg-gold-500 text-white",
  neutral: "bg-slate-100 text-slate-600",
};

export function Badge({
  variant = "neutral",
  children,
  className,
}: {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
