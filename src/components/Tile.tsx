import type { ReactNode } from "react";

/**
 * FM25-style "tile / card" primitive: a titled info panel. Small tiles tease a
 * little information; larger ones (cards) hold more. Same component, many sizes.
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
    <div className={`surface-panel rounded-lg border p-3 shadow-sm shadow-zinc-900/5 ${className}`}>
      {(title || action) && (
        <div className="mb-2 flex items-start justify-between gap-2">
          <div>
            {title ? <h3 className="text-xs font-semibold uppercase text-soft">{title}</h3> : null}
            {subtitle ? <p className="mt-0.5 text-xs text-soft">{subtitle}</p> : null}
          </div>
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
