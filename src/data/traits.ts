/**
 * The twelve traits. PRD §2.3, §4.1; the first six are the canonical starting
 * brigade's from PRD §4.2.
 *
 * A trait changes a rule, not a stat (v4 §5). Every magnitude lives in
 * `C.traits` — nothing numeric is written inline here (CLAUDE.md rule 2).
 *
 * Three hooks, all optional:
 *   `apply`                     — a quality delta, applied inside computePlateQuality
 *   `varianceMultiplier`        — scales the plate noise before it is added
 *   `growthThresholdMultiplier` — scales the 14 / 30 / 60 clean-evening thresholds
 *
 * `apply` runs once per plate for the lead's trait and once for the helper's, with
 * `ctx.role` naming which. A trait that only makes sense in one role must check it.
 */
import { C } from '../engine/constants';
import type { Trait } from '../engine/types';

const isLead = (role: 'lead' | 'helper'): boolean => role === 'lead';

export const TRAITS: readonly Trait[] = [
  {
    id: 'nozirka',
    nameKey: 'trait.nozirka.name',
    descKey: 'trait.nozirka.desc',
    apply: (ctx, q) => {
      if (!isLead(ctx.role)) return q;
      return q + (ctx.helper === null ? C.traits.nozirkaSolo : C.traits.nozirkaWithHelper);
    },
  },
  {
    id: 'sampion',
    nameKey: 'trait.sampion.name',
    descKey: 'trait.sampion.desc',
    apply: (ctx, q) => {
      if (!isLead(ctx.role)) return q;
      if (ctx.courseIndex < C.traits.sampionEarlyCourses) return q + C.traits.sampionEarlyBonus;
      if (ctx.courseIndex >= C.menu.courses - C.traits.sampionLateCourses) {
        return q + C.traits.sampionLatePenalty;
      }
      return q;
    },
  },
  {
    id: 'klidnaRuka',
    nameKey: 'trait.klidnaRuka.name',
    descKey: 'trait.klidnaRuka.desc',
    varianceMultiplier: (ctx) => (isLead(ctx.role) ? C.traits.klidnaRukaVariance : 1),
  },
  {
    id: 'ucednice',
    nameKey: 'trait.ucednice.name',
    descKey: 'trait.ucednice.desc',
    growthThresholdMultiplier: C.traits.ucedniceGrowthMultiplier,
  },
  {
    id: 'cteListky',
    nameKey: 'trait.cteListky.name',
    descKey: 'trait.cteListky.desc',
    apply: (ctx, q) => (isLead(ctx.role) && ctx.wave === 1 ? q + C.traits.cteListkyBonus : q),
  },
  {
    id: 'vydrziZar',
    nameKey: 'trait.vydrziZar.name',
    descKey: 'trait.vydrziZar.desc',
    // The plate already subtracted `wear × enduranceCoef × waveWeight`.
    // Immunity to the first 2.0 means handing that slice back.
    apply: (ctx, q) => {
      if (!isLead(ctx.role)) return q;
      const forgiven = Math.min(ctx.cook.wear, C.traits.vydrziZarImmunity);
      return q + forgiven * C.endurance[ctx.cook.endurance] * ctx.waveWeight;
    },
  },
  {
    id: 'raniPtace',
    nameKey: 'trait.raniPtace.name',
    descKey: 'trait.raniPtace.desc',
    apply: (ctx, q) => (isLead(ctx.role) && ctx.wave === 0 ? q + C.traits.raniPtaceBonus : q),
  },
  {
    id: 'perfekcionista',
    nameKey: 'trait.perfekcionista.name',
    descKey: 'trait.perfekcionista.desc',
    apply: (ctx, q) => {
      if (!isLead(ctx.role)) return q;
      if (ctx.course.difficulty >= C.traits.perfekcionistaHardThreshold) {
        return q + C.traits.perfekcionistaHardBonus;
      }
      if (ctx.course.difficulty <= C.traits.perfekcionistaEasyThreshold) {
        return q + C.traits.perfekcionistaEasyPenalty;
      }
      return q;
    },
  },
  {
    id: 'tahoun',
    nameKey: 'trait.tahoun.name',
    descKey: 'trait.tahoun.desc',
    apply: (ctx, q) => (isLead(ctx.role) ? q : q + C.traits.tahounHelperBonus),
  },
  {
    id: 'hazardniHrac',
    nameKey: 'trait.hazardniHrac.name',
    descKey: 'trait.hazardniHrac.desc',
    apply: (ctx, q) => (isLead(ctx.role) ? q + C.traits.hazardniHracBonus : q),
    varianceMultiplier: (ctx) => (isLead(ctx.role) ? C.traits.hazardniHracVariance : 1),
  },
  {
    id: 'domaZustava',
    nameKey: 'trait.domaZustava.name',
    descKey: 'trait.domaZustava.desc',
    apply: (ctx, q) => {
      if (!isLead(ctx.role)) return q;
      const home = ctx.cook.homeStation === ctx.station;
      return q + (home ? C.traits.domaZustavaHome : C.traits.domaZustavaAway);
    },
  },
  {
    id: 'tichaVoda',
    nameKey: 'trait.tichaVoda.name',
    descKey: 'trait.tichaVoda.desc',
    apply: (ctx, q) =>
      isLead(ctx.role) && ctx.overload > 0 ? q + C.traits.tichaVodaOverloadBonus : q,
  },
];

const BY_ID = new Map(TRAITS.map((trait) => [trait.id, trait]));

/** Throws rather than silently cooking a plate without the trait it was promised. */
export function getTrait(id: string): Trait {
  const trait = BY_ID.get(id);
  if (trait === undefined) throw new Error(`Unknown trait: ${id}`);
  return trait;
}

export function findTrait(id: string): Trait | undefined {
  return BY_ID.get(id);
}
