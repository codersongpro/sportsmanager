import type { Player } from "@/lib/types";
import type { RNG } from "@/lib/sim/rng";
import { POSITION_WEIGHTS, SOCCER_TRAINING_FOCUSES } from "./constants";
import { calcOverall, playerValue, playerWage } from "./ratings";

// -----------------------------------------------------------------------------
// Player growth model
//
//   age <= 24   : GROWTH  — climbs toward `potential`, fastest when youngest and
//                 boosted by playing time (`apps`). Speed scaled by hidden
//                 `devFactor` (lower = faster developer).
//   25 .. 29    : PEAK    — stable, small random fluctuation.
//   age >= 30   : DECLINE — physical attributes fade first, accelerating with age.
//
// Attributes are kept as floats internally (weekly training adds fractions) and
// only rounded for display.
// -----------------------------------------------------------------------------

const PHYSICAL_ATTRS = ["pace", "agility", "stamina", "strength"];

function clampAttr(v: number): number {
  return Math.max(1, Math.min(99, v));
}

function scaleWeightedAttrs(player: Player, pos: string, factor: number) {
  const weights = POSITION_WEIGHTS[pos] ?? POSITION_WEIGHTS.CM;
  for (const key in weights) {
    player.attributes[key] = clampAttr((player.attributes[key] ?? 0) * factor);
  }
}

function refreshDerived(player: Player) {
  const ovr = calcOverall(player);
  player.value = playerValue(ovr, player.potential, player.age);
  player.wage = playerWage(player.value);
}

/** Applied once per season at rollover. Increments age and develops/declines. */
export function ageAndDevelop(player: Player, rng: RNG): Player {
  const p: Player = { ...player, attributes: { ...player.attributes } };
  p.age += 1;
  const apps = player.apps ?? 0;
  p.apps = 0;

  const ovr = calcOverall(p);
  const pos = p.positions[0] ?? "CM";

  if (p.age <= 24 && ovr < p.potential) {
    // GROWTH
    const gap = p.potential - ovr;
    const ageMult = p.age <= 19 ? 1.0 : p.age <= 21 ? 0.7 : 0.45;
    const playMult = 0.5 + Math.min(1, apps / 25) * 0.7; // more apps -> faster
    let budget = (gap * ageMult * playMult) / p.devFactor;
    budget *= rng.range(0.7, 1.15);
    budget = Math.min(budget, gap);
    if (budget > 0.05) {
      const target = Math.min(p.potential, ovr + budget);
      scaleWeightedAttrs(p, pos, target / Math.max(1, ovr));
    }
  } else if (p.age >= 30) {
    // DECLINE
    const rate =
      p.age <= 31 ? 0.015 : p.age <= 33 ? 0.03 : p.age <= 35 ? 0.05 : 0.075;
    const jitter = rng.range(0.8, 1.2);
    for (const key in p.attributes) {
      const isPhysical = PHYSICAL_ATTRS.includes(key);
      const drop = rate * (isPhysical ? 1.6 : 0.5) * jitter;
      p.attributes[key] = clampAttr(p.attributes[key] * (1 - drop));
    }
  } else {
    // PEAK — minor fluctuation, tiny gains if still below potential
    if (ovr < p.potential) scaleWeightedAttrs(p, pos, 1 + rng.range(0, 0.01));
    for (const key in p.attributes) {
      p.attributes[key] = clampAttr(p.attributes[key] + rng.range(-0.5, 0.5));
    }
  }

  refreshDerived(p);
  return p;
}

/** Weekly training step. Returns a NEW player with developed attributes. */
export function weeklyTrain(player: Player, focusKey: string, rng: RNG): Player {
  const ovr = calcOverall(player);
  // No meaningful gains once a player has reached their ceiling.
  const headroom = player.potential - ovr;

  const youthMult =
    player.age <= 21 ? 1.4 : player.age <= 24 ? 1.0 : player.age <= 28 ? 0.45 : 0.12;
  if (headroom <= 0 && player.age > 28) return player; // veteran at ceiling: maintain

  const focus =
    SOCCER_TRAINING_FOCUSES.find((f) => f.key === focusKey) ??
    SOCCER_TRAINING_FOCUSES[SOCCER_TRAINING_FOCUSES.length - 1];

  const p: Player = { ...player, attributes: { ...player.attributes } };
  for (const key of focus.attributes) {
    if (!(key in p.attributes)) continue;
    const gain = (rng.range(0.04, 0.22) * youthMult) / p.devFactor;
    // allow a little overshoot of the implied ceiling, capped at 99
    p.attributes[key] = clampAttr(p.attributes[key] + Math.max(0, gain) * (headroom > 0 ? 1 : 0.2));
  }
  refreshDerived(p);
  return p;
}
