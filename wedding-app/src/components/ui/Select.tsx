import { cn } from "@/lib/utils";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
};

export function Select({
  label,
  error,
  options,
  className,
  id,
  ...props
}: SelectProps) {
  const selectId = id ?? props.name;
  return (
    <div>
      <label
        htmlFor={selectId}
        className="block text-sm font-medium text-slate-700 mb-1"
      >
        {label}
      </label>
      <select
        id={selectId}
        className={cn(
          "w-full min-h-[44px] px-3 border rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:border-transparent",
          error
            ? "border-red-400 focus:ring-red-400"
            : "border-slate-300 focus:ring-rose-500",
          className
        )}
        aria-invalid={!!error}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
