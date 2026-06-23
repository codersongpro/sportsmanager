import type { GenPlayerOpts, Player, PositionKey } from "@/lib/types";
import type { RNG } from "@/lib/sim/rng";
import { POSITION_WEIGHTS, SOCCER_ATTRIBUTE_KEYS } from "./constants";
import { playstylesForPosition } from "./playstyles";
import { calcOverall, playerValue, playerWage } from "./ratings";

const GK_ATTRS = ["reflexes", "handling", "kicking", "command"];

function clampAttr(v: number): number {
  return Math.max(1, Math.min(99, Math.round(v)));
}

/** Generate a soccer player whose overall lands near `targetOverall`. */
export function generatePlayer(opts: GenPlayerOpts, rng: RNG): Player {
  const pos: PositionKey = opts.position ?? "CM";
  const age = opts.age ?? rng.int(17, 34);
  const target = Math.max(35, Math.min(94, opts.targetOverall));

  // Potential: youngsters have headroom above their current ability.
  let potential = opts.potential ?? target;
  if (opts.potential === undefined) {
    if (age <= 19) potential = target + Math.max(0, rng.gaussian(9, 5));
    else if (age <= 22) potential = target + Math.max(0, rng.gaussian(4, 3));
    else potential = target + Math.max(0, rng.gaussian(1, 1.5));
  }
  potential = Math.round(Math.max(target, Math.min(99, potential)));

  // Base attributes scattered around the target.
  const attributes: Record<string, number> = {};
  for (const key of SOCCER_ATTRIBUTE_KEYS) {
    attributes[key] = clampAttr(rng.gaussian(target, 8));
  }
  // Keep goalkeeping/outfield profiles believable.
  if (pos === "GK") {
    for (const key of SOCCER_ATTRIBUTE_KEYS) {
      if (!GK_ATTRS.includes(key) && key !== "positioning" && key !== "composure" && key !== "passing") {
        attributes[key] = rng.int(8, 24);
      }
    }
  } else {
    for (const key of GK_ATTRS) attributes[key] = rng.int(6, 22);
  }

  // Play styles from the position pool: better players carry more.
  const pool = playstylesForPosition(pos);
  const count = target >= 82 ? 3 : target >= 70 ? 2 : 1;
  const styles = rng.shuffle(pool).slice(0, Math.min(count, pool.length));
  for (const ps of styles) {
    for (const k in ps.boosts) {
      if (k in attributes) attributes[k] = clampAttr(attributes[k] + ps.boosts[k]);
    }
  }

  // Lock the weighted overall close to the target after all adjustments.
  const draft: Player = makeDraft(opts, pos, age, potential, attributes, styles.map((s) => s.key), rng);
  const ovr = calcOverall(draft);
  if (ovr > 0) {
    const weights = POSITION_WEIGHTS[pos] ?? POSITION_WEIGHTS.CM;
    const factor = target / ovr;
    for (const key in weights) attributes[key] = clampAttr(attributes[key] * factor);
  }

  const finalOvr = calcOverall({ ...draft, attributes });
  const value = playerValue(finalOvr, potential, age);
  return {
    ...draft,
    attributes,
    value,
    wage: playerWage(value),
  };
}

function makeDraft(
  opts: GenPlayerOpts,
  pos: PositionKey,
  age: number,
  potential: number,
  attributes: Record<string, number>,
  playstyles: string[],
  rng: RNG,
): Player {
  return {
    id: opts.id,
    name: opts.name,
    nameKo: opts.nameKo,
    nationality: opts.nationality,
    age,
    positions: [pos],
    attributes,
    potential,
    morale: rng.int(60, 88),
    condition: rng.int(88, 100),
    form: 0,
    value: 0,
    wage: 0,
    contractUntil: rng.int(1, 4), // years remaining; world builder makes absolute
    clubId: opts.clubId,
    playstyles,
    devFactor: Math.round(rng.range(0.7, 1.35) * 100) / 100,
    apps: 0,
  };
}
