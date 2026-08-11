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

  it('every cook row offers five placements: four stations and rest', () => {
    const { draft, game } = useGame.getState();
    const cookId = game?.cooks[0]?.id ?? '';
    const expanded = render(() => useGame.getState().expandCook(cookId));
    for (const station of STATIONS) {
      expect(expanded).toContain(t(`station.${station}`));
    }
    expect(expanded).toContain(t('pas.resting'));
    expect(expanded).toContain(t('pas.placement'));
    render(() => {
      useGame.getState().expandCook(null);
      useGame.setState({ draft });
    });
  });
});
