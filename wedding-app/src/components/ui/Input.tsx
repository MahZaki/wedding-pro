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
        className="block text-sm font-medium text-slate-700 mb-1"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={cn(
          "w-full min-h-[44px] px-3 border rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:border-transparent",
          error
            ? "border-red-400 focus:ring-red-400"
            : "border-slate-300 focus:ring-rose-500",
          className
        )}
        aria-invalid={!!error}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
