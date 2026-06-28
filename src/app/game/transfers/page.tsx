"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useGameStore, negotiatedFee } from "@/lib/store/gameStore";
import { getSport } from "@/lib/sports";
import { Avatar, Badge, RatingNumber, groupColor, overallColor } from "@/components/Tile";
import { Button } from "@/components/ui";
import { playerDisplayName, playerInitials, clubDisplayName, formatMoney } from "@/lib/utils/format";
import type { LocalizedText } from "@/lib/types";

const COLS = "2.2fr .8fr .6fr 1.1fr 1.4fr .9fr 1.2fr";
const MINE_COLS = "2.2fr .8fr .6fr .9fr .9fr .9fr";

function potentialStars(potential: number): string {
  const filled = Math.max(0, Math.min(5, Math.round((potential / 100) * 5)));
  return "★".repeat(filled) + "☆".repeat(5 - filled);
}

export default function TransfersPage() {
  const { t, tl } = useI18n();
  const state = useGameStore((s) => s.state);
  const buyPlayer = useGameStore((s) => s.buyPlayer);
  const sellPlayer = useGameStore((s) => s.sellPlayer);
  const [query, setQuery] = useState("");
  const [freeAgentsOnly, setFreeAgentsOnly] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: LocalizedText } | null>(null);

  const sport = state ? getSport(state.sportId) : null;
  const myClub = state ? state.clubs[state.manager.clubId] : null;

  const isNational = !!myClub?.isNational;

  const results = useMemo(() => {
    if (!state || !sport || !myClub) return [];
    const q = query.trim().toLowerCase();
    const list = Object.values(state.players).filter((p) => {
      if (p.clubId === myClub.id) return false;
      if (freeAgentsOnly && p.clubId !== null) return false;
      if (q && !p.name.toLowerCase().includes(q) && !(p.nameKo ?? "").includes(q)) return false;
      return true;
    });
    list.sort((a, b) => sport.calcOverall(b) - sport.calcOverall(a));
    return list.slice(0, 60);
  }, [state, sport, myClub, query, freeAgentsOnly]);

  if (!state || !sport || !myClub) return null;

  if (isNational) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-[18px]">
        <h1 className="font-display text-xl font-bold">{t("transferMarket")}</h1>
        <p className="text-sm" style={{ color: "var(--muted-2)" }}>{t("transfersUnavailableNational")}</p>
      </div>
    );
  }

  const rep = state.manager.reputation;
  const mySquad = myClub.squad.map((id) => state.players[id]).filter(Boolean);
  const weeklyWages = mySquad.reduce((sum, p) => sum + p.wage, 0);
  const wageHeadroom = myClub.finances.wageBudget - weeklyWages;

  function attempt(playerId: string) {
    const res = buyPlayer(playerId);
    setFeedback(res);
  }

  const kpis = [
    { label: t("transferBudget"), value: formatMoney(myClub.finances.transferBudget), color: "var(--mint)" },
    { label: t("wageHeadroom"), value: formatMoney(wageHeadroom), color: wageHeadroom >= 0 ? "var(--text)" : "var(--red)" },
    { label: t("candidateCount"), value: results.length, color: "var(--purple)" },
    { label: t("squadSize"), value: mySquad.length, color: "var(--gold)" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-[18px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold">{t("transferMarket")}</h1>
        <div className="flex items-center gap-2 text-[11.5px]" style={{ color: "var(--muted-2)" }}>
          {t("managerReputation")}: <span className="font-display font-bold" style={{ color: "var(--text)" }}>{Math.round(rep)}</span>
          <span style={{ color: "var(--gold)" }}>{rep >= 75 ? "★★★" : rep >= 55 ? "★★" : rep >= 35 ? "★" : "—"}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {kpis.map((k, i) => (
          <div key={i} className="rounded-2xl border p-4" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
            <div className="text-[11px]" style={{ color: "var(--muted-2)" }}>{k.label}</div>
            <div className="font-display mt-[5px] text-[26px] font-bold" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {feedback && (
        <div
          className="rounded-xl border px-3.5 py-2.5 text-sm"
          style={
            feedback.ok
              ? { borderColor: "color-mix(in srgb, var(--mint) 35%, transparent)", background: "color-mix(in srgb, var(--mint) 12%, transparent)", color: "var(--mint)" }
              : { borderColor: "color-mix(in srgb, var(--red) 35%, transparent)", background: "color-mix(in srgb, var(--red) 12%, transparent)", color: "var(--red)" }
          }
        >
          {tl(feedback.message)}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("name")}
          className="rounded-lg border px-3 py-1.5 text-[12.5px] outline-none"
          style={{ borderColor: "var(--border-soft)", background: "var(--panel-2)", color: "var(--text)" }}
        />
        <button
          onClick={() => setFreeAgentsOnly(!freeAgentsOnly)}
          className="rounded-[7px] px-2.5 py-[5px] text-[11px] font-semibold"
          style={freeAgentsOnly ? { color: "#06140e", background: "var(--mint)" } : { color: "var(--muted-2)", background: "rgba(255,255,255,.05)" }}
        >
          {t("freeAgents")}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
        <div className="border-b px-5 py-4 font-display text-base font-bold" style={{ borderColor: "var(--border-soft)" }}>
          {t("scoutTargets")}
        </div>
        <div
          className="grid gap-0 border-b px-5 py-[11px] text-[10.5px] font-semibold tracking-wide"
          style={{ gridTemplateColumns: COLS, color: "var(--muted-3)", borderColor: "rgba(255,255,255,.04)" }}
        >
          <div>{t("name")}</div>
          <div>{t("position")}</div>
          <div>{t("age")}</div>
          <div>{t("club")}</div>
          <div>{t("potential")}</div>
          <div className="text-right">{t("value")}</div>
          <div className="text-right">{t("signChance")}</div>
        </div>
        {results.map((p) => {
          const club = p.clubId ? state.clubs[p.clubId] : null;
          const fee = negotiatedFee(p.value, rep);
          const affordable = myClub.finances.transferBudget >= fee;
          const group = sport.positions.find((meta) => meta.key === p.positions[0])?.group ?? "";
          return (
            <div
              key={p.id}
              className="grid items-center gap-0 border-b px-5 py-[10px]"
              style={{ gridTemplateColumns: COLS, borderColor: "rgba(255,255,255,.035)" }}
            >
              <div className="flex items-center gap-[11px]">
                <Avatar initials={playerInitials(p)} color={groupColor(group)} size={34} rounded="9px" />
                <div>
                  <div className="text-[13px] font-semibold">{playerDisplayName(p)}</div>
                  <div className="mt-px text-[10px]" style={{ color: "var(--muted-3)" }}>
                    {p.nationality} · {t("overall")} {sport.calcOverall(p)}
                  </div>
                </div>
              </div>
              <div><Badge color={groupColor(group)}>{p.positions[0]}</Badge></div>
              <div className="font-display-sm text-sm" style={{ color: "#9aa4b8" }}>{p.age}</div>
              <div className="text-[12px]" style={{ color: "#b6bfcf" }}>{club ? clubDisplayName(club) : t("freeAgents")}</div>
              <div className="text-[13px] tracking-wide" style={{ color: "var(--gold)" }}>{potentialStars(p.potential)}</div>
              <div className="text-right font-display-sm text-xs" style={{ color: "var(--mint)" }}>{formatMoney(fee)}</div>
              <div className="text-right">
                <button
                  disabled={!affordable}
                  onClick={() => attempt(p.id)}
                  className="rounded-md px-2.5 py-1 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  style={affordable ? { color: "var(--mint)", background: "color-mix(in srgb, var(--mint) 14%, transparent)" } : { color: "var(--red)", background: "color-mix(in srgb, var(--red) 14%, transparent)" }}
                >
                  {affordable ? t("available") : t("overBudget")}
                </button>
              </div>
            </div>
          );
        })}
        {results.length === 0 && (
          <div className="px-5 py-6 text-sm" style={{ color: "var(--muted-3)" }}>—</div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
        <div className="border-b px-5 py-4 font-display text-base font-bold" style={{ borderColor: "var(--border-soft)" }}>
          {t("myClub")}
        </div>
        <div
          className="grid gap-0 border-b px-5 py-[11px] text-[10.5px] font-semibold tracking-wide"
          style={{ gridTemplateColumns: MINE_COLS, color: "var(--muted-3)", borderColor: "rgba(255,255,255,.04)" }}
        >
          <div>{t("name")}</div>
          <div>{t("position")}</div>
          <div>{t("age")}</div>
          <div className="text-center">{t("overall")}</div>
          <div className="text-right">{t("value")}</div>
          <div className="text-right">{t("sell")}</div>
        </div>
        {mySquad.map((p) => {
          const overall = sport.calcOverall(p);
          const group = sport.positions.find((meta) => meta.key === p.positions[0])?.group ?? "";
          return (
            <div
              key={p.id}
              className="grid items-center gap-0 border-b px-5 py-[10px]"
              style={{ gridTemplateColumns: MINE_COLS, borderColor: "rgba(255,255,255,.035)" }}
            >
              <div className="flex items-center gap-[11px]">
                <Avatar initials={playerInitials(p)} color={groupColor(group)} size={34} rounded="9px" />
                <div className="text-[13px] font-semibold">{playerDisplayName(p)}</div>
              </div>
              <div><Badge color={groupColor(group)}>{p.positions[0]}</Badge></div>
              <div className="font-display-sm text-sm" style={{ color: "#9aa4b8" }}>{p.age}</div>
              <div className="text-center"><RatingNumber value={overall} color={overallColor(overall)} size="text-base" /></div>
              <div className="text-right font-display-sm text-xs" style={{ color: "#9aa4b8" }}>{formatMoney(p.value)}</div>
              <div className="text-right">
                <Button variant="secondary" className="px-2.5 py-1 text-[11px]" onClick={() => sellPlayer(p.id)}>{t("sell")}</Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
