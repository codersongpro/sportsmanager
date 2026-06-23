import type { ReactNode } from "react";

/**
 * FM25-style "tile / card" primitive: a titled info panel. Small tiles tease a
 * little information; larger ones (cards) hold more. Same component, many sizes.
 */
export function Tile({
  title,
  action,
  className = "",
  bodyClassName = "",
  children,
}: {
  title?: ReactNode;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950 ${className}`}>
      {(title || action) && (
        <div className="mb-2 flex items-center justify-between gap-2">
          {title ? <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{title}</h3> : <span />}
          {action}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

/** Heart-style condition pip color (FM uses green→red hearts). */
export function conditionColor(condition: number): string {
  if (condition >= 85) return "text-emerald-500";
  if (condition >= 70) return "text-lime-500";
  if (condition >= 55) return "text-amber-500";
  return "text-rose-500";
}

/** Rating pill background, matching FM's green/olive/red scale. */
export function ratingColor(rating: number): string {
  if (rating >= 7.5) return "bg-emerald-600 text-white";
  if (rating >= 6.8) return "bg-lime-600 text-white";
  if (rating >= 6.0) return "bg-amber-600/90 text-white";
  return "bg-rose-600 text-white";
}
