/**
 * The bar (laťka) — PRD §3.3. The most important number in the game.
 *
 *   bar = 12.0
 *       + clamp(1.4 × (3.33 − avgCourseDifficulty), −1.0, 2.5)
 *       + 0.20 × weekIndex          (0-based)
 *       + 0.03 × (reputation − 15)
 *       + 0.4  × (seasonNumber − 1)
 *       + 0.5  × meanHarmony(menu)
 *
 * An ambitious menu lowers the bar, which is what stops timidity from being free.
 * d(bar)/d(own quality) = 0.48 < 1 — success raises the bar but never erases progress.
 */

import { C } from './constants';
import { clamp } from './math';
import { meanHarmony } from './plate';
import type { Course, PlateOutcome } from './types';

export interface BarBreakdown {
  base: number;
  /** Negative when the menu is ambitious. */
  ambition: number;
  week: number;
  reputation: number;
  season: number;
  /** Negative when the menu flows badly, positive when it flows well. */
  harmony: number;
  total: number;
}

export function averageDifficulty(menu: readonly Course[]): number {
  if (menu.length === 0) return 0;
  let total = 0;
  for (const course of menu) total += course.difficulty;
  return total / menu.length;
}

export function computeBarBreakdown(
  menu: readonly Course[],
  weekIndex: number,
  reputation: number,
  seasonNumber: number,
): BarBreakdown {
  const ambition = clamp(
    C.bar.ambitionCoef * (C.bar.ambitionPivot - averageDifficulty(menu)),
    C.bar.ambitionMin,
    C.bar.ambitionMax,
  );
  const week = C.bar.weekCoef * weekIndex;
  const reputationTerm = C.bar.reputationCoef * (reputation - C.bar.reputationPivot);
  const season = C.bar.seasonCoef * (seasonNumber - 1);
  // Harmony is priced for the same reason ambition is: quality the bar does not
  // claw back is a dominant strategy. PRD §3.3.
  const harmony = C.bar.harmonyCoef * meanHarmony(menu);
  return {
    base: C.bar.base,
    ambition,
    week,
    reputation: reputationTerm,
    season,
    harmony,
    total: C.bar.base + ambition + week + reputationTerm + season + harmony,
  };
}

export function computeBar(
  menu: readonly Course[],
  weekIndex: number,
  reputation: number,
  seasonNumber: number,
): number {
  return computeBarBreakdown(menu, weekIndex, reputation, seasonNumber).total;
}

/** Unreachable by menu construction alone — only a push gets a plate here (§3.3). */
export function starPlateThreshold(bar: number): number {
  return bar + C.outcome.starPlateOffset;
}

/** Thresholds are relative to the bar, never absolute. */
export function outcomeFor(q: number, bar: number): PlateOutcome {
  if (q < bar) return 'defect';
  return q >= starPlateThreshold(bar) ? 'star' : 'passed';
}
