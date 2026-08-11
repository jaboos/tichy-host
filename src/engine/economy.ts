/**
 * Cash, reputation and covers — PRD §3.7.
 *
 * Deliberately minimal: simulation proved a larger economy has zero effect on
 * stars (±20 % on rent, price and covers moved the outcome 0.0 points). Premium
 * ingredients are the only channel through which money touches quality.
 */

import { C } from './constants';
import { clamp } from './math';
import type { Course } from './types';
import { averageDifficulty } from './bar';

/** Covers follow reputation and the weekend. They touch revenue, never quality. */
export function coversFor(reputation: number, eveningInWeek: number): number {
  const weekend = C.season.weekendEveningIndices.includes(
    eveningInWeek as (typeof C.season.weekendEveningIndices)[number],
  );
  const raw =
    C.economy.coversBase +
    reputation / C.economy.coversReputationDivisor +
    (weekend ? C.economy.coversWeekendBonus : 0);
  return clamp(Math.round(raw), C.economy.coversMin, C.economy.coversMax);
}

/** 26 % + 2 % × average difficulty, plus 8 pp if the week is on premium produce. */
export function foodCostRate(menu: readonly Course[], premium: boolean): number {
  return (
    C.economy.foodCostBase +
    C.economy.foodCostDifficultyCoef * averageDifficulty(menu) +
    (premium ? C.economy.premiumFoodCostSurcharge : 0)
  );
}

export function eveningRevenue(covers: number): number {
  return covers * C.economy.pricePerCover;
}

/** Rent is a weekly charge; it lands on the last evening of the week. */
export function eveningCosts(
  covers: number,
  menu: readonly Course[],
  premium: boolean,
  isLastEveningOfWeek: boolean,
): number {
  const food = eveningRevenue(covers) * foodCostRate(menu, premium);
  const fixed = C.economy.wagesPerEvening + C.economy.operationsPerEvening;
  return food + fixed + (isLastEveningOfWeek ? C.economy.rentPerWeek : 0);
}

/**
 * Reputation drives covers and raises the bar. It cannot be spent — only earned
 * and lost. The 0.03 bar coefficient is what stops this loop from running away.
 */
export function updateReputation(
  reputation: number,
  avgQ: number,
  bar: number,
  defects: number,
  starPlates: number,
): number {
  return clamp(
    reputation +
      C.economy.reputationQualityCoef * (avgQ - bar) +
      C.economy.reputationDefectCoef * defects +
      C.economy.reputationStarPlateCoef * starPlates,
    C.economy.reputationMin,
    C.economy.reputationMax,
  );
}

/** Below −150 000 CZK an investor takes over and the season ends (§9 case 19). */
export function isBankrupt(cash: number): boolean {
  return cash < C.economy.bankruptcyThreshold;
}
