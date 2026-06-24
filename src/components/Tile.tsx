import type { ReactNode } from "react";

/**
 * "Tile / card" primitive: a titled info panel matching the PRO MANAGER
 * design system (rounded-2xl dark panel, Barlow Condensed title).
 */
export function Tile({
  title,
  subtitle,
  action,
  className = "",
  bodyClassName = "",
  children,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className={`surface-panel rounded-2xl border p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            {title ? <h3 className="font-display text-base font-bold tracking-wide text-foreground">{title}</h3> : null}
            {subtitle ? <p className="mt-0.5 text-xs text-soft">{subtitle}</p> : null}
          </div>
          {action}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

/** Condition % threshold color (design source `condColor`). */
export function conditionColor(condition: number): string {
  if (condition >= 90) return "var(--mint)";
  if (condition >= 75) return "var(--gold)";
  return "var(--red)";
}

/** 0-10 match rating threshold color (design source `ratColor`). */
export function ratingColorHex(rating: number): string {
  if (rating >= 7.3) return "var(--mint)";
  if (rating >= 6.8) return "var(--gold)";
  return "var(--red)";
}

/** Tailwind-class rating pill, kept for call sites expecting a className. */
export function ratingColor(rating: number): string {
  if (rating >= 7.5) return "bg-emerald-600 text-white";
  if (rating >= 6.8) return "bg-lime-600 text-white";
  if (rating >= 6.0) return "bg-amber-600/90 text-white";
  return "bg-rose-600 text-white";
}

/** 0-20 attribute threshold color (design source `attrColor`). */
export function attrColor(value: number): string {
  if (value >= 16) return "var(--mint)";
  if (value >= 13) return "var(--gold)";
  if (value >= 10) return "#9aa4b8";
  return "var(--red)";
}

/** 0-100 attribute tier color for the player-detail attributes legend (우수/양호/약점). */
export function attributeTierColor(value: number): string {
  if (value >= 75) return "var(--mint)";
  if (value >= 55) return "var(--gold)";
  return "var(--red)";
}

/** 0-100 overall/potential threshold color (design source `ovrColor`). */
export function overallColor(value: number): string {
  if (value >= 80) return "var(--mint)";
  if (value >= 65) return "var(--blue)";
  return "#9aa4b8";
}

/** Position-group accent color (GK=gold, DEF=blue, MID=mint, FWD=red). */
export function groupColor(group: string): string {
  switch (group) {
    case "GK": return "var(--gold)";
    case "DEF": return "var(--blue)";
    case "MID": return "var(--mint)";
    case "FWD": return "var(--red)";
    default: return "var(--muted-2)";
  }
}

/** Gradient avatar tile used for players/clubs across the app. */
export function Avatar({
  initials,
  color = "var(--mint)",
  size = 34,
  rounded = "0.5rem",
}: {
  initials: string;
  color?: string;
  size?: number;
  rounded?: string;
}) {
  return (
    <div
      className="font-display flex shrink-0 items-center justify-center border font-bold"
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        fontSize: Math.max(11, size * 0.42),
        color,
        background: `color-mix(in srgb, ${color} 16%, var(--panel-2))`,
        borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
      }}
    >
      {initials}
    </div>
  );
}

/** Small colored pill, e.g. position or status badge. */
export function Badge({ children, color = "var(--muted-2)" }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="rounded-md px-2 py-0.5 text-[11px] font-bold"
      style={{ color, background: `color-mix(in srgb, ${color} 16%, transparent)` }}
    >
      {children}
    </span>
  );
}

/** Big Barlow Condensed number with threshold coloring (OVR/rating/etc). */
export function RatingNumber({ value, color, size = "text-lg" }: { value: ReactNode; color: string; size?: string }) {
  return (
    <span className={`font-display font-bold ${size}`} style={{ color }}>
      {value}
    </span>
  );
}

/** Thin progress bar matching the design's stat/attribute bars. */
export function StatBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-white/[0.06]">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

/** W/D/L square chip used for recent-form strips. */
export function FormChip({ result }: { result: "W" | "D" | "L" }) {
  const styles: Record<typeof result, { bg: string; color: string }> = {
    W: { bg: "var(--mint)", color: "#06140e" },
    D: { bg: "color-mix(in srgb, var(--gold) 90%, transparent)", color: "#1a1305" },
    L: { bg: "var(--red)", color: "#fff" },
  };
  const s = styles[result];
  return (
    <div
      className="font-display flex h-[30px] w-[30px] items-center justify-center rounded-lg text-sm font-bold"
      style={{ background: s.bg, color: s.color }}
    >
      {result}
    </div>
  );
}
