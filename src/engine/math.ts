/**
 * Numeric helpers shared across the engine. Pure, and holds no numbers of its own —
 * every tunable still lives in `constants.ts` (CLAUDE.md rule 2).
 *
 * Not listed in PRD §2.3; it exists because `clamp` is needed by five modules and
 * duplicating it five times is how rounding rules quietly drift apart.
 */

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/** Wear is carried to one decimal (PRD §4.1), so it must not accumulate float dust. */
export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
