/**
 * The Phase 3 exit criteria, driven through the real store: a full 40-evening
 * season completes, a reload restores exactly (RNG included), a replayed seed
 * gives an identical season, and a corrupt save never crashes and never silently
 * wipes (PRD §7 Phase 3, §8.1, §9 case 13).
 *
 * Not one of the four files in §2.3, and it earned its place: it caught the store
 * persisting the state AFTER `openEvening` had drawn the evening's signals, so a
 * reload rolled a second opening on top of the first and quietly diverged from
 * the season that was saved.
 */
import { beforeEach, describe, expect, it } from 'vitest';

// Minimal localStorage, because the store owns persistence and the engine does not.
const store = new Map<string, string>();
const shim: Storage = {
  getItem: (key) => store.get(key) ?? null,
  setItem: (key, value) => void store.set(key, value),
  removeItem: (key) => void store.delete(key),
  clear: () => store.clear(),
  key: () => null,
  get length() {
    return store.size;
  },
};
(globalThis as unknown as { localStorage: Storage }).localStorage = shim;

const { useGame } = await import('../store/gameStore');
const { C } = await import('../engine/constants');
const { createStartingBrigade } = await import('../engine/draft');

function playEvening(): void {
  const s = useGame.getState();
  s.startService();
  useGame.getState().finishReveal();
  useGame.getState().nextEvening();
  // Sunday can hold a report card before Monday's planning. PRD FR-11
  if (useGame.getState().screen === 'report') useGame.getState().acknowledgeReport();
  if (useGame.getState().screen === 'monday') useGame.getState().lockKitchen();
}

describe('a whole season through the store', () => {
  beforeEach(() => {
    store.clear();
    // A fresh device: no save, no prefs, and no season already prepared.
    useGame.setState({
      screen: 'onboarding',
      game: null,
      opening: null,
      lastResult: null,
      pendingSeed: null,
      pendingBrigade: null,
    });
  });

  it('plays 40 evenings and reaches the verdict', () => {
    useGame.getState().boot();
    useGame.getState().newGame('Test', '7K3-MAREN');
    for (let i = 0; i < C.season.eveningsPerSeason; i += 1) {
      expect(useGame.getState().screen, `evening ${i}`).toBe('pas');
      playEvening();
    }
    expect(useGame.getState().screen).toBe('verdict');
    const game = useGame.getState().game;
    expect(game?.eveningIndex).toBe(C.season.eveningsPerSeason);
    expect(game?.history).toHaveLength(C.season.eveningsPerSeason);
    expect(game?.visits).toHaveLength(C.inspector.visitsPerSeason);
    expect([0, 1, 2]).toContain(game?.stars);
  });

  it('a reload mid-season restores exactly, RNG included', () => {
    useGame.getState().boot();
    useGame.getState().newGame('Test', '7K3-MAREN');
    for (let i = 0; i < 12; i += 1) playEvening();

    const before = useGame.getState().game;
    expect(before).not.toBeNull();

    // Close the tab and come back: same storage, fresh store.
    useGame.setState({ screen: 'onboarding', game: null, opening: null, lastResult: null });
    useGame.getState().boot();
    const after = useGame.getState().game;

    expect(after?.rngState).toBe(before?.rngState);
    expect(after?.eveningIndex).toBe(before?.eveningIndex);
    expect(JSON.stringify(after)).toBe(JSON.stringify(before));
  });

  it('replaying the same seed with the same inputs gives the same season', () => {
    const run = (): string => {
      store.clear();
      useGame.setState({ screen: 'onboarding', game: null, opening: null, lastResult: null });
      useGame.getState().boot();
      useGame.getState().newGame('Test', '7K3-MAREN');
      for (let i = 0; i < 15; i += 1) playEvening();
      return JSON.stringify(useGame.getState().game);
    };
    expect(run()).toBe(run());
  });

  /**
   * Found by playing forty evenings, not by a test: a ticket dealt in week 2 was
   * still resting the same cook in week 8. `advanceWeek` defaults the hand to
   * empty, but Monday handed its own tickets straight back to it, so the default
   * never fired and one cook rested free for the rest of the season.
   */
  it('a rest ticket is spent by the end of its week', () => {
    useGame.getState().boot();
    useGame.getState().newGame('Test', '7K3-MAREN');
    // Week 1 is locked (§3.2), so the first Monday to plan on is week 2's.
    for (let i = 0; i < C.season.eveningsPerWeek; i += 1) {
      useGame.getState().startService();
      useGame.getState().finishReveal();
      useGame.getState().nextEvening();
      if (useGame.getState().screen === 'report') useGame.getState().acknowledgeReport();
    }
    expect(useGame.getState().screen).toBe('monday');

    const cook = useGame.getState().game?.cooks[1];
    expect(cook).toBeDefined();
    useGame.getState().toggleRestTicket(cook?.id ?? '', 1);
    expect(useGame.getState().game?.weekPlan.restTickets).toHaveLength(1);

    useGame.getState().lockKitchen();
    // The ticket survives the week it was dealt for…
    expect(useGame.getState().game?.weekPlan.restTickets).toHaveLength(1);
    for (let i = 0; i < C.season.eveningsPerWeek; i += 1) playEvening();
    // …and is gone by the next Monday, so it cannot rest anybody twice.
    expect(useGame.getState().game?.weekPlan.restTickets).toHaveLength(0);
  });

  it('a career runs three seasons and carries the brigade', () => {
    useGame.getState().boot();
    useGame.getState().newGame('Test', '7K3-MAREN');
    for (let season = 1; season <= C.season.seasonsPerCareer; season += 1) {
      expect(useGame.getState().game?.seasonNumber, `season ${season}`).toBe(season);
      for (let i = 0; i < C.season.eveningsPerSeason; i += 1) playEvening();
      expect(useGame.getState().screen).toBe('verdict');
      const before = useGame.getState().game?.cooks.map((cook) => cook.id);
      useGame.getState().nextSeason();
      if (season < C.season.seasonsPerCareer) {
        expect(useGame.getState().game?.cooks.map((cook) => cook.id)).toEqual(before);
        expect(useGame.getState().game?.eveningIndex).toBe(0);
      }
    }
    // The fourth call ran off the end of the career and threw the save away.
    expect(useGame.getState().screen).toBe('onboarding');
    expect(useGame.getState().game).toBeNull();

    // And it has to survive a reload. Sending the player to onboarding while the
    // finished season stayed on disk meant one refresh put them back on the
    // verdict letter with no way out — that was the bug, not the screen.
    useGame.setState({ screen: 'pas' });
    useGame.getState().boot();
    expect(useGame.getState().screen).toBe('onboarding');
    expect(useGame.getState().game).toBeNull();
  });

  /**
   * FR-13, the replayability engine. `draftBrigade` has existed and been tested
   * since Phase 2, but nothing in the game could reach it — `newGame` always dealt
   * the curated six, so every career on a device got the same people. §3.9 measures
   * that variety at 51.6 pp, which makes this the most expensive line of wiring in
   * the project to have left out.
   */
  it('only the first run gets the curated brigade', () => {
    useGame.getState().boot();
    useGame.getState().newGame('Test');
    const first = useGame.getState().game?.cooks.map((cook) => cook.id) ?? [];
    expect(first).toEqual(createStartingBrigade().map((cook) => cook.id));

    // A second career on the same device draws from the pool of 24.
    useGame.getState().startOver();
    useGame.getState().newGame('Test');
    const second = useGame.getState().game?.cooks.map((cook) => cook.id) ?? [];
    expect(second).toHaveLength(C.season.brigadeSize);
    expect(second, 'the second run repeated the curated brigade').not.toEqual(first);
  });

  it('a kitchen code decides the brigade, whoever opens it', () => {
    // The onboarding tells the player "you get the same brigade and the same
    // catalogue". That has to be true for a first-timer too, so a typed code
    // always draws rather than falling back to the curated six.
    const open = (code: string): string[] => {
      store.clear();
      useGame.setState({ screen: 'onboarding', game: null, opening: null, pendingSeed: null });
      useGame.getState().boot();
      useGame.getState().newGame('Test', code);
      return useGame.getState().game?.cooks.map((cook) => cook.id) ?? [];
    };

    const shared = open('7K3-MAREN');
    expect(shared).toHaveLength(C.season.brigadeSize);
    expect(shared, 'a code handed back the curated six').not.toEqual(
      createStartingBrigade().map((cook) => cook.id),
    );
    // Same code, fresh device: the same kitchen.
    expect(open('7K3-MAREN')).toEqual(shared);
    expect(open('D36-LESJT')).not.toEqual(shared);
  });

  it('a corrupt save never crashes and never silently wipes', () => {
    store.set(C.storage.gameKey, '{ not json');
    useGame.setState({ screen: 'onboarding', game: null, opening: null, lastResult: null });
    expect(() => useGame.getState().boot()).not.toThrow();
    expect(useGame.getState().screen).toBe('onboarding');
    expect(store.get(C.storage.backupKey)).toBe('{ not json');
  });
});
