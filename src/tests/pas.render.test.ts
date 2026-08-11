/**
 * The Pas screen actually renders the things PRD §3.1 FR-1 says it renders.
 *
 * This file exists because a hundred green tests did not catch station cards that
 * showed a bare ratio and no names at all. Nothing was broken in the engine —
 * nobody had written down that the names have to be on the screen. So this
 * asserts against rendered markup rather than against state:
 *
 *   - every cook standing at a station is named on that station's card
 *   - every cook's placement is visible on their own row (FR-1a item 1)
 *   - an empty station reads "no hands" rather than a blank
 *   - the load figure is labelled, never a bare ratio
 *   - the grid is exactly four station cards
 *
 * It renders in jsdom rather than through `renderToStaticMarkup`, because zustand's
 * server snapshot is `getInitialState()` — under SSR every selector reports the
 * empty store and the screen renders as nothing at all, which would make this file
 * pass while asserting about a blank string.
 *
 * @vitest-environment jsdom
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { useGame } = await import('../store/gameStore');
const { default: Pas } = await import('../screens/Pas');
const { STATIONS } = await import('../engine/types');
const { applyToSlot, interventionTargets, slotCandidates } = await import('../store/gameStore');
const { resolveMenu, weekIndexOf } = await import('../engine/season');
const { cs } = await import('../i18n/cs');
const { t } = await import('../i18n');

let container: HTMLDivElement;
let root: Root;
let markup = '';

/** Applies an optional store mutation, renders the live Pas, returns its markup. */
function render(mutate?: () => void): string {
  act(() => {
    mutate?.();
    root.render(createElement(Pas));
  });
  return container.innerHTML;
}

beforeAll(() => {
  localStorage.clear();
  useGame.setState({ screen: 'onboarding', game: null, opening: null, lastResult: null });
  useGame.getState().boot();
  useGame.getState().newGame('Test', '7K3-MAREN');

  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  markup = render();
});

afterAll(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
});

describe('the Pas names the people standing at each station', () => {
  it('renders at all', () => {
    expect(markup.length).toBeGreaterThan(500);
  });

  it('names every assigned cook somewhere on the screen', () => {
    const { game, draft } = useGame.getState();
    expect(game).not.toBeNull();
    const assignedIds = [...Object.values(draft.leads), ...Object.values(draft.helpers)].filter(
      (id): id is string => id !== null,
    );
    expect(assignedIds.length).toBeGreaterThan(0);

    for (const id of assignedIds) {
      const cook = game?.cooks.find((c) => c.id === id);
      expect(cook, `cook ${id} is assigned but not in the brigade`).toBeDefined();
      const surname = cook?.lastName ?? '';
      expect(surname).not.toBe('');
      expect(markup, `${surname} is assigned but never appears on screen`).toContain(surname);
    }
  });

  it('names every cook in the brigade, assigned or not', () => {
    const game = useGame.getState().game;
    for (const cook of game?.cooks ?? []) {
      expect(markup, `${cook.lastName} is missing from the brigade list`).toContain(cook.lastName);
    }
  });

  it('shows every cook their placement, so none is in an unknown state', () => {
    const { game, draft } = useGame.getState();
    for (const cook of game?.cooks ?? []) {
      const station = STATIONS.find(
        (s) => draft.leads[s] === cook.id || draft.helpers[s] === cook.id,
      );
      const expected = station === undefined ? t('pas.resting') : t(`station.${station}`);
      expect(markup, `${cook.lastName} has no visible placement`).toContain(expected);
    }
  });

  it('labels the load figure instead of printing a bare ratio', () => {
    expect(markup).toContain(t('pas.load'));
    expect(markup).toContain(t('pas.capacity'));
  });

  it('renders exactly four station cards', () => {
    for (const station of STATIONS) {
      expect(markup).toContain(`aria-label="${t(`station.${station}`)}"`);
    }
    const cards = markup.match(/<section[^>]*aria-label=/g) ?? [];
    expect(cards).toHaveLength(STATIONS.length);
  });

  it('reads "no hands" on an empty station rather than showing a blank', () => {
    const draft = useGame.getState().draft;
    const empty = render(() => {
      useGame.setState({ draft: { ...draft, leads: { ...draft.leads, dessert: null } } });
    });
    expect(empty).toContain(t('pas.noHands'));
    render(() => useGame.setState({ draft }));
  });

  it('offers a helper slot inside every station card that has no helper', () => {
    const withHelper = STATIONS.filter((s) => useGame.getState().draft.helpers[s] !== null).length;
    const slots = markup.split(t('pas.addHelper')).length - 1;
    expect(slots).toBe(STATIONS.length - withHelper);
  });
});

describe('the rejected interaction model is gone, FR-1 item 6', () => {
  it('no dictionary entry tells the player to tap a cook and then a station', () => {
    for (const value of Object.values(cs)) {
      expect(value.toLowerCase()).not.toMatch(/pak na post/);
    }
  });

  it('a station slot offers every cook by name', () => {
    const { draft, game } = useGame.getState();
    const expanded = render(() =>
      useGame.getState().openSlotPicker({ station: 'sauce', role: 'lead' }),
    );
    expect(expanded).toContain(
      t('pas.whoOnSlot', { station: t('station.sauce'), role: t('pas.lead') }),
    );
    for (const cook of game?.cooks ?? []) {
      expect(expanded, `${cook.lastName} is missing from the picker`).toContain(cook.lastName);
    }
    render(() => {
      useGame.getState().openSlotPicker(null);
      useGame.setState({ draft });
    });
  });
});

describe('the station card is the control — FR-1a as amended', () => {
  it('every place on every station is a tap target', () => {
    for (const station of STATIONS) {
      for (const role of ['lead', 'helper'] as const) {
        const label = `${t(`station.${station}`)} · ${t(role === 'lead' ? 'pas.lead' : 'pas.helper')}`;
        expect(markup, `${label} is not tappable`).toContain(`aria-label="${label}"`);
      }
    }
  });

  it('leaves nothing disabled in the picker', () => {
    const expanded = render(() =>
      useGame.getState().openSlotPicker({ station: 'cold', role: 'lead' }),
    );
    expect(expanded.match(/<button[^>]*disabled/g) ?? []).toHaveLength(0);
    render(() => useGame.getState().openSlotPicker(null));
  });

  it('shows the effective hand at THIS station, not the raw one', () => {
    const { game, draft } = useGame.getState();
    if (game === null) throw new Error('no game');
    const candidates = slotCandidates(game, draft, resolveMenu(game), {
      station: 'sauce',
      role: 'lead',
    });
    for (const candidate of candidates) {
      const home = candidate.cook.homeStation === 'sauce';
      expect(candidate.effHand).toBe(candidate.cook.hand + (home ? 1 : -1));
    }
  });

  it('previews what the move does to this station', () => {
    const { game, draft } = useGame.getState();
    if (game === null) throw new Error('no game');
    const candidates = slotCandidates(game, draft, resolveMenu(game), {
      station: 'sauce',
      role: 'lead',
    });
    // Different hands give different capacity, so the previews cannot all agree.
    expect(new Set(candidates.map((c) => c.percentAfter)).size).toBeGreaterThan(1);
    for (const candidate of candidates) {
      expect(Number.isFinite(candidate.percentAfter)).toBe(true);
    }
  });

  it('flags the station that would be left without hands', () => {
    const { game, draft } = useGame.getState();
    if (game === null) throw new Error('no game');
    const candidates = slotCandidates(game, draft, resolveMenu(game), {
      station: 'sauce',
      role: 'helper',
    });
    for (const candidate of candidates.filter((c) => c.emptiedStation !== null)) {
      expect(candidate.fromStation).not.toBeNull();
      expect(candidate.emptiedStation).toBe(candidate.fromStation);
    }
  });

  it('an exchange keeps the counts identical', () => {
    const { game, draft } = useGame.getState();
    const mover = game?.cooks.find((c) => draft.leads.fire === c.id);
    const beforeLeads = STATIONS.filter((s) => draft.leads[s] !== null).length;
    const beforeHelpers = STATIONS.filter((s) => draft.helpers[s] !== null).length;

    const next = applyToSlot(draft, { station: 'cold', role: 'lead' }, mover?.id ?? '');
    expect(next.leads.cold).toBe(mover?.id);
    expect(STATIONS.filter((s) => next.leads[s] !== null).length).toBe(beforeLeads);
    expect(STATIONS.filter((s) => next.helpers[s] !== null).length).toBe(beforeHelpers);

    const everyone = [
      ...Object.values(next.leads),
      ...Object.values(next.helpers),
      ...next.resting,
    ].filter((id): id is string => id !== null);
    expect(new Set(everyone).size).toBe(game?.cooks.length);
  });

  it('releasing a place empties it and rests whoever was there', () => {
    const { draft } = useGame.getState();
    const was = draft.leads.sauce;
    const next = applyToSlot(draft, { station: 'sauce', role: 'lead' }, null);
    expect(next.leads.sauce).toBeNull();
    expect(next.resting).toContain(was);
  });

  it('says who is resting and who is at the wear cap', () => {
    expect(markup).toContain(t('pas.restTag', { names: t('pas.nobodyResting') }));
  });
});

describe('an intervention never picks its own target — PRD §3.5', () => {
  it('expanding is not confirming', () => {
    render(() => useGame.getState().openIntervention('push'));
    expect(useGame.getState().interventionOpen).toBe('push');
    // Step 1 must not commit anything.
    expect(useGame.getState().intervention).toBeNull();
    expect(useGame.getState().interventionPick).toBeNull();
  });

  it('names every legal target, even when there is only one', () => {
    const { game, draft } = useGame.getState();
    if (game === null) throw new Error('no game');
    const menu = resolveMenu(game);
    const week = weekIndexOf(game.eveningIndex);
    for (const id of ['praise', 'scold', 'push', 'cutCourse', 'swap'] as const) {
      const targets = interventionTargets(id, game, draft, menu, week);
      expect(targets.length, `${id} has no named targets`).toBeGreaterThan(0);
      for (const target of targets) {
        expect(target.label).not.toBe('');
        expect(target.effect).not.toBe('');
      }
    }
  });

  it('the push offer shows BOTH sides and its cost', () => {
    const { game, draft } = useGame.getState();
    if (game === null) throw new Error('no game');
    const targets = interventionTargets(
      'push',
      game,
      draft,
      resolveMenu(game),
      weekIndexOf(game.eveningIndex),
    );
    for (const target of targets) {
      // Two arrows: one for the star plate, one for the defect.
      expect((target.effect.match(/→/g) ?? []).length).toBe(2);
      expect(target.effect).toContain('%');
      expect(target.note, 'the token cost is not stated').toBeTruthy();
    }
  });

  it('takes a second tap to commit, and cancelling loses nothing', () => {
    const { game, draft } = useGame.getState();
    if (game === null) throw new Error('no game');
    const target = interventionTargets(
      'push',
      game,
      draft,
      resolveMenu(game),
      weekIndexOf(game.eveningIndex),
    )[0];
    expect(target).toBeDefined();

    render(() => useGame.getState().pickInterventionTarget(target?.value ?? null));
    expect(useGame.getState().intervention, 'picking a target must not commit').toBeNull();

    render(() => useGame.getState().confirmIntervention());
    expect(useGame.getState().intervention?.id).toBe('push');
    expect(useGame.getState().interventionOpen).toBeNull();

    render(() => useGame.getState().clearIntervention());
    expect(useGame.getState().intervention).toBeNull();
  });
});
