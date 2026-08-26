import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <div>
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-ink-700 mb-1"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={cn(
          "w-full min-h-[44px] px-3 border rounded-lg text-sm bg-white text-ink-700 focus:outline-none focus:ring-2 focus:border-transparent",
          error
            ? "border-error-600 focus:ring-error-600"
            : "border-ink-300 focus:ring-bordeaux-500",
          className
        )}
        aria-invalid={!!error}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-error-600">{error}</p>}
    </div>
  );
}
