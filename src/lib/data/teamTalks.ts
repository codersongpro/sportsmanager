import type { LocalizedText } from "@/lib/types";

/** Halftime team talk: a one-time-per-match morale nudge for the user's squad. */
export interface TeamTalkOption {
  key: string;
  label: LocalizedText;
  description: LocalizedText;
  /** applied to every fielded player's morale (0-100 scale), clamped on use */
  moraleDelta: number;
}

export const TEAM_TALK_OPTIONS: TeamTalkOption[] = [
  {
    key: "calm",
    label: { ko: "침착하게", en: "Stay calm" },
    description: { ko: "차분하게 지시를 전달해 선수들을 안정시킵니다.", en: "Keep things steady and settle the players' nerves." },
    moraleDelta: 2,
  },
  {
    key: "fire_up",
    label: { ko: "독려하기", en: "Fire them up" },
    description: { ko: "강하게 동기부여하여 사기를 끌어올립니다.", en: "Pump up the squad with a rousing pep talk." },
    moraleDelta: 5,
  },
  {
    key: "demand_more",
    label: { ko: "강하게 질책", en: "Demand more" },
    description: { ko: "더 나은 경기를 요구하며 압박을 줍니다. 받아들이는 선수도, 위축되는 선수도 있습니다.", en: "Push them hard for a better performance — some respond, others wilt." },
    moraleDelta: -1,
  },
];
