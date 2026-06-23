import type { PressItem } from "@/lib/types";

type Outcome = "W" | "D" | "L";

/** Build a post-match press conference prompt for the user, by result. */
export function makePostMatchPress(id: string, day: number, outcome: Outcome, oppShort: string): PressItem {
  if (outcome === "W") {
    return {
      id,
      day,
      question: { ko: `${oppShort} 상대로 값진 승리였습니다. 우승에 도전할 만한가요?`, en: `A fine win over ${oppShort}. Are you challenging for the title?` },
      options: [
        { text: { ko: "당연합니다. 우리가 최강입니다.", en: "Of course — we're the best team here." }, moraleDelta: 3, repDelta: 1, reply: { ko: "감독이 우승을 자신했습니다.", en: "The manager backed his side for the title." } },
        { text: { ko: "한 경기씩 차분히 가겠습니다.", en: "We take it one game at a time." }, moraleDelta: 1, repDelta: 2, reply: { ko: "감독이 신중한 태도를 보였습니다.", en: "The manager stayed measured." } },
        { text: { ko: "선수들이 정말 잘해줬습니다.", en: "The players were magnificent today." }, moraleDelta: 4, repDelta: 0, reply: { ko: "감독이 선수단을 치켜세웠습니다.", en: "The manager praised his squad." } },
      ],
    };
  }
  if (outcome === "L") {
    return {
      id,
      day,
      question: { ko: `${oppShort}에게 패했습니다. 무엇이 문제였나요?`, en: `A defeat to ${oppShort}. What went wrong?` },
      options: [
        { text: { ko: "선수들의 집중력이 부족했습니다.", en: "The players lacked focus." }, moraleDelta: -4, repDelta: 1, reply: { ko: "감독이 선수단을 강하게 질책했습니다.", en: "The manager publicly criticised his players." } },
        { text: { ko: "패배의 책임은 전적으로 제게 있습니다.", en: "This defeat is entirely on me." }, moraleDelta: 2, repDelta: -1, reply: { ko: "감독이 패배의 책임을 자처했습니다.", en: "The manager took the blame himself." } },
        { text: { ko: "판정이 아쉬웠습니다.", en: "The officiating was questionable." }, moraleDelta: 0, repDelta: -2, reply: { ko: "감독이 심판 판정에 불만을 드러냈습니다.", en: "The manager blamed the officials." } },
      ],
    };
  }
  return {
    id,
    day,
    question: { ko: `${oppShort}와 비겼습니다. 만족하십니까?`, en: `A draw with ${oppShort}. Are you satisfied?` },
    options: [
      { text: { ko: "이긴 경기를 놓쳤습니다.", en: "We dropped two points today." }, moraleDelta: -2, repDelta: 1, reply: { ko: "감독이 아쉬움을 드러냈습니다.", en: "The manager rued missed points." } },
      { text: { ko: "값진 승점 1점입니다.", en: "A valuable point earned." }, moraleDelta: 1, repDelta: 0, reply: { ko: "감독이 긍정적으로 평가했습니다.", en: "The manager stayed positive." } },
      { text: { ko: "선수들이 끝까지 싸웠습니다.", en: "The players fought to the end." }, moraleDelta: 2, repDelta: 0, reply: { ko: "감독이 투지를 칭찬했습니다.", en: "The manager praised the effort." } },
    ],
  };
}
