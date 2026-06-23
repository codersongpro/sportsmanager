import type { BracketRound, Club } from "@/lib/types";
import { useI18n } from "@/lib/i18n/I18nProvider";

function ClubLabel({ id, clubs, winnerId }: { id: string | null; clubs: Record<string, Club>; winnerId: string | null }) {
  if (!id) return <span className="text-zinc-400">TBD</span>;
  const club = clubs[id];
  const isWinner = winnerId === id;
  return <span className={isWinner ? "font-semibold" : ""}>{club?.shortName ?? club?.name ?? id}</span>;
}

export function BracketView({ bracket, clubs, userClubId }: { bracket: BracketRound[]; clubs: Record<string, Club>; userClubId?: string }) {
  const { tl } = useI18n();
  return (
    <div className="flex gap-6 overflow-x-auto pb-2">
      {bracket.map((round) => (
        <div key={round.roundIndex} className="flex min-w-[160px] flex-col gap-3">
          <div className="text-xs font-semibold uppercase text-zinc-500">{tl(round.name)}</div>
          {round.matches.map((m, i) => {
            const involvesUser = m.homeId === userClubId || m.awayId === userClubId;
            return (
              <div
                key={i}
                className={`rounded border px-2 py-1.5 text-sm ${involvesUser ? "border-blue-400 bg-blue-50 dark:bg-blue-950/40" : "border-zinc-200 dark:border-zinc-800"}`}
              >
                <div className="flex justify-between gap-2">
                  <ClubLabel id={m.homeId} clubs={clubs} winnerId={m.winnerId} />
                </div>
                <div className="flex justify-between gap-2">
                  <ClubLabel id={m.awayId} clubs={clubs} winnerId={m.winnerId} />
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
