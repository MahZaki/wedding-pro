/**
 * "Two paths" secondary graphic — branding PRD §18.
 * Two fine lines that begin apart and converge. Static, low opacity.
 */
export function ConvergingPaths({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 420"
      preserveAspectRatio="xMidYMin slice"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M-40 -20 C 260 120, 480 200, 600 330"
        fill="none"
        stroke="#6E2F3A"
        strokeWidth="1.5"
        opacity="0.10"
      />
      <path
        d="M1240 -20 C 940 120, 720 200, 600 330"
        fill="none"
        stroke="#6E2F3A"
        strokeWidth="1.5"
        opacity="0.10"
      />
      <circle cx="600" cy="330" r="3" fill="#6E2F3A" opacity="0.16" />
    </svg>
  );
}
