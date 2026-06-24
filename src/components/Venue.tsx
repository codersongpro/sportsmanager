import type { MatchPresentation } from "@/lib/types";

interface Props {
  venue: MatchPresentation["venue"];
  ballX: number;
  ballY: number;
  homeShort: string;
  awayShort: string;
  flash: string | null;
}

/** Per-sport playing surface for the live match viewer. */
export function Venue({ venue, ballX, ballY, homeShort, awayShort, flash }: Props) {
  return (
    <div className={`relative aspect-[16/10] w-full overflow-hidden rounded-lg border ${venueFrameClass(venue)}`}>
      <VenueSurface venue={venue} />

      {/* ball / play marker */}
      <div
        className="absolute z-10 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md ring-2 ring-black/20 transition-all duration-500 ease-out"
        style={{ left: `${ballX}%`, top: `${ballY}%` }}
      />

      <div className="absolute left-2 top-2 rounded bg-black/30 px-2 py-0.5 text-xs font-medium text-white">{homeShort}</div>
      <div className="absolute right-2 top-2 rounded bg-black/30 px-2 py-0.5 text-xs font-medium text-white">{awayShort}</div>

      {flash && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="animate-bounce rounded-lg bg-black/55 px-6 py-3 text-2xl font-extrabold tracking-widest text-white">{flash}!</div>
        </div>
      )}
    </div>
  );
}

export function VenueSurface({ venue }: { venue: Props["venue"] }) {
  return <>{SURFACE[venue]}</>;
}

export function venueFrameClass(venue: Props["venue"]): string {
  return BG[venue];
}

const BG: Record<Props["venue"], string> = {
  pitch: "border-emerald-900/30 bg-gradient-to-r from-green-600 to-green-700",
  hardwood: "border-amber-900/40 bg-gradient-to-r from-amber-500 to-amber-600",
  diamond: "border-emerald-900/30 bg-gradient-to-br from-green-600 to-green-700",
  volleyballCourt: "border-sky-900/30 bg-gradient-to-r from-sky-500 to-orange-400",
  pickleballCourt: "border-teal-900/30 bg-gradient-to-r from-teal-500 to-blue-500",
};

const line = "absolute bg-white/40";
const ring = "absolute rounded-full border border-white/40";

const SURFACE: Record<Props["venue"], React.ReactNode> = {
  pitch: (
    <>
      <div className={`${line} left-1/2 top-0 h-full w-px -translate-x-1/2`} />
      <div className={`${ring} left-1/2 top-1/2 h-[28%] w-[16%] -translate-x-1/2 -translate-y-1/2`} />
      <div className="absolute left-0 top-1/2 h-[55%] w-[12%] -translate-y-1/2 border border-l-0 border-white/40" />
      <div className="absolute right-0 top-1/2 h-[55%] w-[12%] -translate-y-1/2 border border-r-0 border-white/40" />
      <div className={`${line} left-0 top-1/2 h-[20%] w-[2%] -translate-y-1/2 !bg-white/30`} />
      <div className={`${line} right-0 top-1/2 h-[20%] w-[2%] -translate-y-1/2 !bg-white/30`} />
    </>
  ),
  hardwood: (
    <>
      <div className={`${line} left-1/2 top-0 h-full w-px -translate-x-1/2`} />
      <div className={`${ring} left-1/2 top-1/2 h-[30%] w-[18%] -translate-x-1/2 -translate-y-1/2`} />
      {/* keys + hoops */}
      <div className="absolute left-0 top-1/2 h-[40%] w-[16%] -translate-y-1/2 border border-l-0 border-white/40" />
      <div className="absolute right-0 top-1/2 h-[40%] w-[16%] -translate-y-1/2 border border-r-0 border-white/40" />
      <div className={`${ring} left-[3%] top-1/2 h-[10%] w-[5%] -translate-y-1/2 !border-orange-200`} />
      <div className={`${ring} right-[3%] top-1/2 h-[10%] w-[5%] -translate-y-1/2 !border-orange-200`} />
    </>
  ),
  volleyballCourt: (
    <>
      {/* center net */}
      <div className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-white/70" />
      <div className="absolute left-1/2 top-0 h-full w-[14%] -translate-x-1/2 bg-[repeating-linear-gradient(0deg,transparent,transparent_6px,rgba(255,255,255,0.25)_6px,rgba(255,255,255,0.25)_8px)]" />
      {/* attack lines */}
      <div className={`${line} left-[35%] top-0 h-full w-px`} />
      <div className={`${line} right-[35%] top-0 h-full w-px`} />
      <div className="absolute inset-2 border border-white/40" />
    </>
  ),
  pickleballCourt: (
    <>
      {/* center net */}
      <div className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-white/75" />
      <div className="absolute inset-3 border border-white/45" />
      {/* non-volley zones */}
      <div className={`${line} left-[42%] top-3 h-[calc(100%-1.5rem)] w-px`} />
      <div className={`${line} right-[42%] top-3 h-[calc(100%-1.5rem)] w-px`} />
      {/* service boxes */}
      <div className={`${line} left-3 top-1/2 h-px w-[39%]`} />
      <div className={`${line} right-3 top-1/2 h-px w-[39%]`} />
    </>
  ),
  diamond: (
    <>
      {/* infield diamond */}
      <div className="absolute left-1/2 top-1/2 h-[46%] w-[46%] -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-white/50 bg-amber-700/40" />
      {/* bases */}
      <div className="absolute left-1/2 top-[27%] h-2 w-2 -translate-x-1/2 rotate-45 bg-white" />
      <div className="absolute left-[73%] top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 bg-white" />
      <div className="absolute left-1/2 top-[73%] h-2 w-2 -translate-x-1/2 rotate-45 bg-white" />
      <div className="absolute left-[27%] top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 bg-white" />
      {/* pitcher's mound */}
      <div className={`${ring} left-1/2 top-1/2 h-[8%] w-[8%] -translate-x-1/2 -translate-y-1/2`} />
    </>
  ),
};
