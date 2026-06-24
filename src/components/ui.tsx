import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const styles = {
    primary: "bg-[var(--mint)] text-[#06140e] hover:opacity-90",
    secondary: "border border-[var(--line)] bg-[var(--panel-2)] text-foreground hover:bg-white/[0.04]",
    ghost: "text-soft hover:bg-white/[0.04]",
    danger: "bg-[var(--red)] text-white hover:opacity-90",
  }[variant];

  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center rounded-md px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${styles} ${className}`}
      {...props}
    />
  );
}

export function StatusBadge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  children: ReactNode;
}) {
  const color = {
    neutral: "var(--muted-2)",
    success: "var(--mint)",
    warning: "var(--gold)",
    danger: "var(--red)",
    info: "var(--blue)",
  }[tone];

  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold"
      style={{
        color,
        borderColor: `color-mix(in srgb, ${color} 35%, transparent)`,
        background: `color-mix(in srgb, ${color} 14%, transparent)`,
      }}
    >
      {children}
    </span>
  );
}

export function ProgressBar({ value, tone = "info" }: { value: number; tone?: "info" | "success" | "warning" | "danger" }) {
  const color = {
    info: "var(--blue)",
    success: "var(--mint)",
    warning: "var(--gold)",
    danger: "var(--red)",
  }[tone];
  const width = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
      <div className="h-full rounded-full" style={{ width: `${width}%`, background: color }} />
    </div>
  );
}

export function StatBlock({ label, value, detail }: { label: ReactNode; value: ReactNode; detail?: ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--line)] p-3" style={{ background: "var(--panel-2)" }}>
      <div className="text-xs font-semibold uppercase text-soft">{label}</div>
      <div className="font-display mt-1 text-xl font-bold tabular-nums text-foreground">{value}</div>
      {detail ? <div className="mt-1 text-xs text-soft">{detail}</div> : null}
    </div>
  );
}
