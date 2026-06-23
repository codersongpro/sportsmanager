export function AttributeBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-blue-500" : pct >= 40 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-24 shrink-0 text-zinc-600 dark:text-zinc-400">{label}</span>
      <div className="h-2 flex-1 rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right font-medium tabular-nums">{Math.round(value)}</span>
    </div>
  );
}
