import type { Player, TrainingFocus } from "@/lib/types";
import type { RNG } from "@/lib/sim/rng";
import { makeCalcOverall, playerValue, playerWage, type PositionWeights } from "./ratings";

export interface GrowthConfig {
  positionWeights: PositionWeights;
  fallbackPos: string;
  /** attributes that fade fastest with age */
  physicalAttrs: string[];
  trainingFocuses: TrainingFocus[];
}

function clampAttr(v: number): number {
  return Math.max(1, Math.min(99, v));
}

/** Build a sport's ageAndDevelop + weeklyTrain from its config. */
export function makeGrowth(cfg: GrowthConfig) {
  const calcOverall = makeCalcOverall(cfg.positionWeights, cfg.fallbackPos);

  function scaleWeighted(player: Player, pos: string, factor: number) {
    const weights = cfg.positionWeights[pos] ?? cfg.positionWeights[cfg.fallbackPos] ?? {};
    for (const key in weights) player.attributes[key] = clampAttr((player.attributes[key] ?? 0) * factor);
  }
  function refreshDerived(player: Player) {
    const ovr = calcOverall(player);
    player.value = playerValue(ovr, player.potential, player.age);
    player.wage = playerWage(player.value);
  }

  function ageAndDevelop(player: Player, rng: RNG): Player {
    const p: Player = { ...player, attributes: { ...player.attributes } };
    p.age += 1;
    const apps = player.apps ?? 0;
    p.apps = 0;
    const ovr = calcOverall(p);
    const pos = p.positions[0] ?? cfg.fallbackPos;

    if (p.age <= 24 && ovr < p.potential) {
      const gap = p.potential - ovr;
      const ageMult = p.age <= 19 ? 1.0 : p.age <= 21 ? 0.7 : 0.45;
      const playMult = 0.5 + Math.min(1, apps / 25) * 0.7;
      let budget = (gap * ageMult * playMult) / p.devFactor;
      budget *= rng.range(0.7, 1.15);
      budget = Math.min(budget, gap);
      if (budget > 0.05) scaleWeighted(p, pos, Math.min(p.potential, ovr + budget) / Math.max(1, ovr));
    } else if (p.age >= 30) {
      const rate = p.age <= 31 ? 0.015 : p.age <= 33 ? 0.03 : p.age <= 35 ? 0.05 : 0.075;
      const jitter = rng.range(0.8, 1.2);
      for (const key in p.attributes) {
        const drop = rate * (cfg.physicalAttrs.includes(key) ? 1.6 : 0.5) * jitter;
        p.attributes[key] = clampAttr(p.attributes[key] * (1 - drop));
      }
    } else {
      if (ovr < p.potential) scaleWeighted(p, pos, 1 + rng.range(0, 0.01));
      for (const key in p.attributes) p.attributes[key] = clampAttr(p.attributes[key] + rng.range(-0.5, 0.5));
    }
    refreshDerived(p);
    return p;
  }

  function weeklyTrain(player: Player, focusKey: string, rng: RNG): Player {
    const ovr = calcOverall(player);
    const headroom = player.potential - ovr;
    const youthMult = player.age <= 21 ? 1.4 : player.age <= 24 ? 1.0 : player.age <= 28 ? 0.45 : 0.12;
    if (headroom <= 0 && player.age > 28) return player;

    const focus = cfg.trainingFocuses.find((f) => f.key === focusKey) ?? cfg.trainingFocuses[cfg.trainingFocuses.length - 1];
    const p: Player = { ...player, attributes: { ...player.attributes } };
    for (const key of focus.attributes) {
      if (!(key in p.attributes)) continue;
      const gain = (rng.range(0.04, 0.22) * youthMult) / p.devFactor;
      p.attributes[key] = clampAttr(p.attributes[key] + Math.max(0, gain) * (headroom > 0 ? 1 : 0.2));
    }
    refreshDerived(p);
    return p;
  }

  return { ageAndDevelop, weeklyTrain };
}
