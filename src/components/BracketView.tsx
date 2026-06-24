import type { BracketRound, Club } from "@/lib/types";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { clubDisplayName } from "@/lib/utils/format";

function ClubRow({
  id,
  clubs,
  winnerId,
  isUser,
}: {
  id: string | null;
  clubs: Record<string, Club>;
  winnerId: string | null;
  isUser: boolean;
}) {
  if (!id) {
    return <span className="text-[12px]" style={{ color: "var(--muted-3)" }}>TBD</span>;
  }
  const club = clubs[id];
  const isWinner = winnerId === id;
  return (
    <span
      className="truncate text-[12.5px]"
      style={{ color: isWinner ? "var(--mint)" : isUser ? "var(--text)" : "#b6bfcf", fontWeight: isWinner ? 700 : 500 }}
    >
      {club ? clubDisplayName(club) : id}
    </span>
  );
}

export function BracketView({
  bracket,
  clubs,
  userClubId,
}: {
  bracket: BracketRound[];
  clubs: Record<string, Club>;
  userClubId?: string;
}) {
  const { tl } = useI18n();
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {bracket.map((round) => (
        <div key={round.roundIndex} className="flex min-w-[180px] flex-col gap-2.5">
          <div className="text-[10.5px] font-bold uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
            {tl(round.name)}
          </div>
          {round.matches.map((m, i) => {
            const involvesUser = m.homeId === userClubId || m.awayId === userClubId;
            return (
              <div
                key={i}
                className="flex flex-col gap-1.5 rounded-xl border px-3 py-2.5"
                style={
                  involvesUser
                    ? { borderColor: "color-mix(in srgb, var(--mint) 40%, transparent)", background: "color-mix(in srgb, var(--mint) 8%, transparent)" }
                    : { borderColor: "var(--border-soft)", background: "var(--panel-2)" }
                }
              >
                <ClubRow id={m.homeId} clubs={clubs} winnerId={m.winnerId} isUser={m.homeId === userClubId} />
                <ClubRow id={m.awayId} clubs={clubs} winnerId={m.winnerId} isUser={m.awayId === userClubId} />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
