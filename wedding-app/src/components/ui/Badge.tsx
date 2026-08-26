import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type BadgeVariant =
  | "success"
  | "pending"
  | "danger"
  | "premium"
  | "neutral";

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-success-100 text-success-700",
  pending: "bg-warning-100 text-warning-700",
  danger: "bg-error-100 text-error-700",
  premium: "bg-bordeaux-500 text-white",
  neutral: "bg-ink-100 text-ink-600",
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
