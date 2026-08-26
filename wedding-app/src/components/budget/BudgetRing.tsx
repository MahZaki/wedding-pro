import { formatMoney } from "@/lib/utils";

export function BudgetRing({
  spent,
  total,
  size = 120,
}: {
  spent: number;
  total: number;
  size?: number;
}) {
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? Math.min(spent / total, 1) : 0;
  const over = total > 0 && spent > total;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="flex-shrink-0"
      role="img"
      aria-label={`${formatMoney(spent)} of ${formatMoney(total)} spent`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={12}
        stroke="#EFEAE4"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={12}
        strokeLinecap="round"
        stroke={over ? "#A83A32" : "#6E2F3A"}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - pct)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="47%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-ink-700"
        fontSize={size / 7}
        fontWeight="700"
        fontFamily="Georgia, serif"
      >
        {Math.round(pct * 100)}%
      </text>
      <text
        x="50%"
        y="62%"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#A0AEC0"
        fontSize={size / 14}
      >
        spent
      </text>
    </svg>
  );
}
