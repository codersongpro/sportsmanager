import type { ActiveMatchState, LocalizedText } from "@/lib/types";

export interface MatchAdviceTip {
  key: string;
  text: LocalizedText;
}

/** Sums up shots / cards across all segments played so far, from the user's perspective. */
function tally(active: ActiveMatchState, userClubId: string) {
  const isHome = active.homeId === userClubId;
  const oppClubId = isHome ? active.awayId : active.homeId;

  let myShots = 0;
  let myShotsOnTarget = 0;
  let myYellows = 0;
  let myReds = 0;
  let oppReds = 0;

  for (const { result } of active.segments) {
    myShots += isHome ? result.homeShots : result.awayShots;
    myShotsOnTarget += isHome ? result.homeShotsOnTarget : result.awayShotsOnTarget;
    for (const ev of result.events) {
      if (ev.type === "yellow" && ev.clubId === userClubId) myYellows++;
      if (ev.type === "red" && ev.clubId === userClubId) myReds++;
      if (ev.type === "red" && ev.clubId === oppClubId) oppReds++;
    }
  }

  const myScore = isHome ? active.homeScore : active.awayScore;
  const oppScore = isHome ? active.awayScore : active.homeScore;
  return { myShots, myShotsOnTarget, myYellows, myReds, oppReds, diff: myScore - oppScore };
}

/**
 * Rule-based, max-2 situational tips derived only from real `ActiveMatchState`
 * data (score, phase, real discipline events and shot stats) — never from
 * data the engine doesn't actually track (e.g. mid-match condition decay).
 */
export function deriveMatchAdvice(active: ActiveMatchState, userClubId: string): MatchAdviceTip[] {
  const { myShots, myShotsOnTarget, myYellows, myReds, oppReds, diff } = tally(active, userClubId);
  const isLate = active.phase !== "first_half";
  const tips: MatchAdviceTip[] = [];

  if (myReds > 0) {
    tips.push({
      key: "down_a_man",
      text: {
        ko: "한 명 적은 상태입니다. 수비적인 전술로 전환을 고려하세요.",
        en: "You're down to ten men — consider a more defensive setup.",
      },
    });
  } else if (oppReds > 0) {
    tips.push({
      key: "opponent_down_a_man",
      text: {
        ko: "상대가 한 명 부족합니다. 공격적으로 전환해 기회를 만드세요.",
        en: "The opponent is down a man — push forward and capitalize.",
      },
    });
  } else if (myYellows >= 2) {
    tips.push({
      key: "card_risk",
      text: {
        ko: "경고가 누적되고 있습니다. 무리한 태클을 피하도록 지시하세요.",
        en: "Your team has picked up multiple yellow cards — ease off risky tackles.",
      },
    });
  }

  if (tips.length < 2 && isLate && diff < 0) {
    tips.push({
      key: "losing_late",
      text: {
        ko: "지고 있는 상황입니다. 더 공격적인 전술로 전환을 고려하세요.",
        en: "You're behind — consider switching to a more attacking approach.",
      },
    });
  } else if (tips.length < 2 && isLate && diff > 0) {
    tips.push({
      key: "winning_late",
      text: {
        ko: "앞서고 있습니다. 안정적인 운영으로 리드를 지키세요.",
        en: "You're ahead — consider a more conservative approach to protect the lead.",
      },
    });
  }

  if (tips.length < 2 && myShots >= 5 && myShotsOnTarget / myShots < 0.3) {
    tips.push({
      key: "low_shot_accuracy",
      text: {
        ko: "유효슈팅 비율이 낮습니다. 공격 방식에 변화를 주세요.",
        en: "Your shot accuracy is low — try varying your attacking approach.",
      },
    });
  }

  return tips.slice(0, 2);
}
