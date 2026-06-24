import { describe, expect, it } from "vitest";
import type { MatchPresentation } from "@/lib/types";
import { progressPerSecond } from "./playback";

function presentation(endProgress: number, regulationMinutes: number): MatchPresentation {
  return {
    venue: "pitch",
    regulationMinutes,
    endProgress,
    breaks: [],
    clockLabel: () => "",
    eventMeta: () => ({ emoji: "", label: { ko: "", en: "" } }),
    scoreOf: () => 0,
    liveStats: () => [],
  };
}

describe("match playback pacing", () => {
  it("uses real regulation minutes to pace each sport timeline at 1x", () => {
    expect(progressPerSecond(presentation(90, 90), 1)).toBe(1);
    expect(progressPerSecond(presentation(48, 48), 1)).toBe(1);
    expect(progressPerSecond(presentation(9, 180), 1)).toBe(0.05);
  });

  it("scales the real-time pacing by user speed", () => {
    expect(progressPerSecond(presentation(90, 90), 4)).toBe(4);
    expect(progressPerSecond(presentation(9, 180), 4)).toBe(0.2);
  });
});
