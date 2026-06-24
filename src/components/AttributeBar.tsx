import { StatBar } from "./Tile";

function barColor(value: number): string {
  if (value >= 80) return "var(--mint)";
  if (value >= 60) return "var(--blue)";
  if (value >= 40) return "var(--gold)";
  return "var(--red)";
}

export function AttributeBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-24 shrink-0 text-soft">{label}</span>
      <StatBar value={pct} color={barColor(pct)} />
      <span className="font-display w-8 shrink-0 text-right font-bold tabular-nums text-foreground">{Math.round(value)}</span>
    </div>
  );
}
