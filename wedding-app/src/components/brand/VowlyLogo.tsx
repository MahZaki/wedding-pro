import { cn } from "@/lib/utils";

type Tone = "brand" | "ink" | "ivory" | "bordeaux";

const toneColors: Record<Tone, { symbol: string; text: string }> = {
  brand: { symbol: "#6E2F3A", text: "#1C1B1A" },
  ink: { symbol: "#1C1B1A", text: "#1C1B1A" },
  ivory: { symbol: "#FAF8F5", text: "#FAF8F5" },
  bordeaux: { symbol: "#FAF8F5", text: "#FAF8F5" },
};

/** The Vow — two paths converging into one point. Brand PRD §2-3. */
export function VowlySymbol({
  tone = "brand",
  size = 32,
  animated = false,
  className,
}: {
  tone?: Tone;
  size?: number;
  animated?: boolean;
  className?: string;
}) {
  const c = toneColors[tone];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Vowly"
      className={cn(animated && "vowly-draw", className)}
    >
      {animated ? (
        <g stroke={c.symbol} strokeWidth={13} fill="none" strokeLinecap="round">
          <path className="vowly-arm-l" d="M16 28 C22 48, 35 73, 50 91" />
          <path className="vowly-arm-r" d="M84 28 C78 48, 65 73, 50 91" />
          <circle className="vowly-dot-l" cx="31" cy="15" r="7" fill={c.symbol} stroke="none" />
          <circle className="vowly-dot-r" cx="69" cy="15" r="7" fill={c.symbol} stroke="none" />
        </g>
      ) : (
        <g fill={c.symbol}>
          <path d="M13.5 26 C20 50, 34 76, 50 94 C39.5 74, 30.2 48, 28.5 26 Z" />
          <path d="M86.5 26 C80 50, 66 76, 50 94 C60.5 74, 69.8 48, 71.5 26 Z" />
          <circle cx="31" cy="15" r="7" />
          <circle cx="69" cy="15" r="7" />
        </g>
      )}
    </svg>
  );
}

/**
 * Horizontal lockup: symbol + wordmark (PRD §6).
 * `tone="ivory"` renders the REVERSE version for dark surfaces.
 */
export function VowlyLogo({
  tone = "brand",
  size = 28,
  animated = false,
  className,
}: {
  tone?: Tone;
  size?: number;
  animated?: boolean;
  className?: string;
}) {
  const c = toneColors[tone];
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <VowlySymbol tone={tone} size={size} animated={animated} />
      <span
        className="font-heading font-bold lowercase leading-none tracking-tight"
        style={{ color: c.text, fontSize: size * 1.08 }}
      >
        vowly
      </span>
    </span>
  );
}
