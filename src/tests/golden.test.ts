/**
 * THE gate (CLAUDE.md rule 4). PRD §8.2: 500 seasons × the four bot policies from
 * §1.2, star rates within ±3 pp of
 *   NAIVE 18.0/0.8 · ROTA 36.8/4.4 · REVISE 46.8/10.8 · SMART 60.6/26.4
 * and a career of 57 / 57 / 53 with Σhand 14 → ~22.
 *
 * Written in Phase 2, before any UI. Until then this file only records what it
 * owes — `it.todo` reports as pending, not as a pass.
 */
import { describe, it } from 'vitest';

describe('golden — reproduces sim-final.js', () => {
  it.todo('NAIVE / ROTA / REVISE / SMART star rates within ±3 pp over 500 seasons');
  it.todo('career over 3 seasons declines mildly: 57 / 57 / 53, Sum(hand) 14 -> ~22');
});
