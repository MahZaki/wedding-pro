import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-ink-100 text-ink-400">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="font-heading text-lg font-semibold text-ink-700 mb-2">
        {title}
      </h3>
      <p className="font-body text-sm text-ink-500 mb-6 max-w-sm">
        {description}
      </p>
      {action}
    </div>
  );
}
