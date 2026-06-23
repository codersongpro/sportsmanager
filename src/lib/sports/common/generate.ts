import type { GenPlayerOpts, PlayStyleDef, Player, PositionKey } from "@/lib/types";
import type { RNG } from "@/lib/sim/rng";
import { makeCalcOverall, playerValue, playerWage, type PositionWeights } from "./ratings";

/** A set of attributes that only some positions should be good at. */
export interface SpecialistGroup {
  positions: string[];
  ownAttrs: string[];
}

export interface GenConfig {
  attributeKeys: string[];
  positionWeights: PositionWeights;
  fallbackPos: string;
  playstylesFor: (pos: PositionKey) => PlayStyleDef[];
  /** e.g. soccer GK, baseball pitcher — players outside a group dump its attrs */
  specialistGroups?: SpecialistGroup[];
}

function clampAttr(v: number): number {
  return Math.max(1, Math.min(99, Math.round(v)));
}

/** Build a sport's generatePlayer from its attribute/position config. */
export function makeGenerator(cfg: GenConfig) {
  const calcOverall = makeCalcOverall(cfg.positionWeights, cfg.fallbackPos);
  const specialistAttrs = new Set((cfg.specialistGroups ?? []).flatMap((g) => g.ownAttrs));

  return function generatePlayer(opts: GenPlayerOpts, rng: RNG): Player {
    const pos: PositionKey = opts.position ?? cfg.fallbackPos;
    const age = opts.age ?? rng.int(17, 34);
    const target = Math.max(35, Math.min(94, opts.targetOverall));

    let potential = opts.potential ?? target;
    if (opts.potential === undefined) {
      if (age <= 19) potential = target + Math.max(0, rng.gaussian(9, 5));
      else if (age <= 22) potential = target + Math.max(0, rng.gaussian(4, 3));
      else potential = target + Math.max(0, rng.gaussian(1, 1.5));
    }
    potential = Math.round(Math.max(target, Math.min(99, potential)));

    const attributes: Record<string, number> = {};
    for (const key of cfg.attributeKeys) attributes[key] = clampAttr(rng.gaussian(target, 8));

    // Keep specialist profiles believable: a player dumps the exclusive attrs of
    // every specialist group it does not belong to.
    const myGroup = (cfg.specialistGroups ?? []).find((g) => g.positions.includes(pos));
    for (const key of specialistAttrs) {
      const ownsIt = myGroup?.ownAttrs.includes(key);
      if (!ownsIt) attributes[key] = rng.int(6, 22);
    }

    const pool = cfg.playstylesFor(pos);
    const count = target >= 82 ? 3 : target >= 70 ? 2 : 1;
    const styles = rng.shuffle(pool).slice(0, Math.min(count, pool.length));
    for (const ps of styles) {
      for (const k in ps.boosts) if (k in attributes) attributes[k] = clampAttr(attributes[k] + ps.boosts[k]);
    }

    const draft: Player = {
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
      contractUntil: rng.int(1, 4),
      clubId: opts.clubId,
      playstyles: styles.map((s) => s.key),
      devFactor: Math.round(rng.range(0.7, 1.35) * 100) / 100,
      apps: 0,
    };

    // Lock the weighted overall close to the target.
    const ovr = calcOverall(draft);
    if (ovr > 0) {
      const weights = cfg.positionWeights[pos] ?? cfg.positionWeights[cfg.fallbackPos] ?? {};
      const factor = target / ovr;
      for (const key in weights) attributes[key] = clampAttr(attributes[key] * factor);
    }

    const finalOvr = calcOverall({ ...draft, attributes });
    const value = playerValue(finalOvr, potential, age);
    return { ...draft, attributes, value, wage: playerWage(value) };
  };
}
