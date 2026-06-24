import type { MatchPresentation } from "@/lib/types";

export function progressPerSecond(presentation: MatchPresentation, speed: number): number {
  return (presentation.endProgress / presentation.regulationMinutes) * speed;
}
