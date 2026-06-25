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
    <div className={`relative aspect-[16/10] w-full overflow-hidden rounded-lg border ${venueFrameClass(venue)}`} style={venueBgStyle(venue)}>
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
  return VENUE_BORDER[venue];
}

/** Inline background gradient (design source exact hex values) for a given venue. */
export function venueBgStyle(venue: Props["venue"]): { background: string } {
  return { background: VENUE_BG[venue] };
}

/** Per-sport aspect ratio for the vertical formation board, matching the design source exactly. */
export function venueAspectVertical(venue: Props["venue"]): string {
  return VENUE_ASPECT[venue];
}

const VENUE_BORDER: Record<Props["venue"], string> = {
  pitch: "border-[rgba(255,255,255,.1)]",
  hardwood: "border-[rgba(255,235,200,.12)]",
  diamond: "border-[rgba(255,255,255,.1)]",
  volleyballCourt: "border-[rgba(255,255,255,.12)]",
  pickleballCourt: "border-[rgba(255,255,255,.12)]",
};

const VENUE_BG: Record<Props["venue"], string> = {
  pitch: "linear-gradient(180deg,#0f3b28,#0c2e20)",
  hardwood: "linear-gradient(180deg,#3a2a18,#2a1f12)",
  diamond: "linear-gradient(180deg,#1a4a30,#103322)",
  volleyballCourt: "linear-gradient(180deg,#14283a,#1d3a52 50%,#14283a)",
  pickleballCourt: "linear-gradient(180deg,#0f2f24,#103a2c 50%,#0f2f24)",
};

const VENUE_ASPECT: Record<Props["venue"], string> = {
  pitch: "68/100",
  diamond: "1/1",
  hardwood: "74/100",
  volleyballCourt: "62/100",
  pickleballCourt: "60/100",
};

const lineH = "absolute bg-white/40";

const SURFACE: Record<Props["venue"], React.ReactNode> = {
  pitch: (
    <>
      <div className={`${lineH} left-1/2 top-0 h-full w-px -translate-x-1/2`} />
      <div className="absolute left-1/2 top-1/2 h-[28%] w-[16%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40" />
      <div className="absolute left-0 top-1/2 h-[55%] w-[12%] -translate-y-1/2 border border-l-0 border-white/40" />
      <div className="absolute right-0 top-1/2 h-[55%] w-[12%] -translate-y-1/2 border border-r-0 border-white/40" />
      <div className={`${lineH} left-0 top-1/2 h-[20%] w-[2%] -translate-y-1/2 !bg-white/30`} />
      <div className={`${lineH} right-0 top-1/2 h-[20%] w-[2%] -translate-y-1/2 !bg-white/30`} />
    </>
  ),
  hardwood: (
    <>
      <div className={`${lineH} left-1/2 top-0 h-full w-px -translate-x-1/2`} />
      <div className="absolute left-1/2 top-1/2 h-[30%] w-[18%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40" />
      <div className="absolute left-0 top-1/2 h-[40%] w-[16%] -translate-y-1/2 border border-l-0 border-white/40" />
      <div className="absolute right-0 top-1/2 h-[40%] w-[16%] -translate-y-1/2 border border-r-0 border-white/40" />
      <div className="absolute left-[3%] top-1/2 h-[10%] w-[5%] -translate-y-1/2 rounded-full border border-orange-200/70" />
      <div className="absolute right-[3%] top-1/2 h-[10%] w-[5%] -translate-y-1/2 rounded-full border border-orange-200/70" />
    </>
  ),
  volleyballCourt: (
    <>
      <div className="absolute left-1/2 top-0 h-full w-0 -translate-x-1/2 border-l-[3px] border-dashed border-white/55" />
      <div className={`${lineH} left-[35%] top-0 h-full w-px`} />
      <div className={`${lineH} right-[35%] top-0 h-full w-px`} />
      <div className="absolute inset-2 border border-white/40" />
    </>
  ),
  pickleballCourt: (
    <>
      <div className="absolute left-[36%] right-[36%] top-0 h-full bg-[rgba(76,141,255,.13)]" />
      <div className="absolute left-1/2 top-0 h-full w-0 -translate-x-1/2 border-l-[3px] border-white/60" />
      <div className="absolute inset-3 border border-white/45" />
      <div className={`${lineH} left-[7%] top-0 h-full w-px`} style={{ right: "64%" }} />
      <div className={`${lineH} right-[7%] top-0 h-full w-px`} style={{ left: "64%" }} />
    </>
  ),
  diamond: (
    <>
      <div className="absolute left-1/2 top-1/2 h-[46%] w-[46%] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-md border-2 border-white/50 bg-[#7a5230]" />
      <div className="absolute left-1/2 top-[27%] h-2 w-2 -translate-x-1/2 rotate-45 bg-white" />
      <div className="absolute left-[73%] top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 bg-white" />
      <div className="absolute left-1/2 top-[73%] h-2 w-2 -translate-x-1/2 rotate-45 bg-white" />
      <div className="absolute left-[27%] top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 bg-white" />
      <div className="absolute left-1/2 top-1/2 h-[8%] w-[8%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40 bg-[#8a5e38]" />
    </>
  ),
};

/** Per-sport markings for the vertical (top-to-bottom) formation board on the tactics page. */
export function VenueSurfaceVertical({ venue }: { venue: Props["venue"] }) {
  return <>{SURFACE_VERTICAL[venue]}</>;
}

const lineV = "absolute bg-white/40";

const SURFACE_VERTICAL: Record<Props["venue"], React.ReactNode> = {
  pitch: (
    <>
      <div className="absolute inset-x-[8%] inset-y-[5%] rounded border-2 border-white/[0.16]" />
      <div className={`${lineV} left-0 top-1/2 h-px w-full -translate-y-1/2`} />
      <div className="absolute left-1/2 top-1/2 h-[15%] w-[22%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40" />
      <div className="absolute left-[28%] right-[28%] top-[5%] h-[13%] border border-t-0 border-white/40" />
      <div className="absolute bottom-[5%] left-[28%] right-[28%] h-[13%] border border-b-0 border-white/40" />
    </>
  ),
  hardwood: (
    <>
      <div className="absolute inset-[5%] rounded border-2 border-[rgba(255,235,200,.22)]" />
      <div className={`${lineV} left-0 top-1/2 h-px w-full -translate-y-1/2`} />
      <div className="absolute left-[14%] right-[14%] top-[5%] h-[56%] rounded-b-[50%] border border-t-0 border-[rgba(255,235,200,.22)]" />
      <div className="absolute left-[36%] right-[36%] top-[5%] h-[32%] border border-t-0 border-[rgba(255,235,200,.18)] bg-[rgba(255,150,70,.1)]" />
      <div className="absolute left-1/2 top-[37%] h-[13.2%] w-[17.9%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(255,235,200,.25)]" />
      <div className="absolute left-1/2 top-[8.5%] h-[5.4%] w-[7.2%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-orange-400" />
    </>
  ),
  volleyballCourt: (
    <>
      <div className="absolute left-[6%] right-[6%] top-1/2 bottom-[6%] bg-[rgba(24,226,154,.05)]" />
      <div className="absolute inset-[6%] border-2 border-white/20" />
      <div className="absolute left-0 top-1/2 h-0 w-full -translate-y-1/2 border-t-[3px] border-dashed border-white/55" />
      <div className={`${lineV} left-0 top-[35%] h-px w-full`} />
      <div className={`${lineV} bottom-[35%] left-0 h-px w-full`} />
    </>
  ),
  pickleballCourt: (
    <>
      <div className="absolute inset-[7%] border-2 border-white/[0.22]" />
      <div className="absolute left-0 right-0 top-[36%] h-[14%] bg-[rgba(76,141,255,.13)]" />
      <div className="absolute left-0 right-0 top-1/2 h-[14%] bg-[rgba(76,141,255,.16)]" />
      <div className="absolute left-0 top-1/2 h-0 w-full -translate-y-1/2 border-t-[3px] border-white/60" />
      <div className={`${lineV} left-1/2 top-[7%] h-[29%] w-px`} />
      <div className={`${lineV} left-1/2 top-[64%] h-[29%] w-px`} />
    </>
  ),
  diamond: SURFACE.diamond,
};
