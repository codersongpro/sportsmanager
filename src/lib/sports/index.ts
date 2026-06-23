import type { SportId, SportModule } from "@/lib/types";
import { soccerModule } from "./soccer";
import { basketballModule } from "./basketball";
import { baseballModule } from "./baseball";
import { volleyballModule } from "./volleyball";
import { pickleballModule } from "./pickleball";

export const SPORTS: Record<SportId, SportModule> = {
  soccer: soccerModule,
  basketball: basketballModule,
  baseball: baseballModule,
  volleyball: volleyballModule,
  pickleball: pickleballModule,
};

export const SPORT_ORDER: SportId[] = ["soccer", "basketball", "baseball", "volleyball", "pickleball"];

export function getSport(id: SportId): SportModule {
  return SPORTS[id];
}
