/**
 * Monday planning — PRD §6.8, followed literally because it has no mockup and
 * playtesting flagged it as the highest-risk mechanic in the game.
 *
 * Six physical tickets dealt onto five evenings. NOT a 5 × 6 grid of checkboxes:
 * that is a shift roster in Excel, and by week 3 the player clicks "same as last
 * week" and half the game switches off. Target is 5–7 taps for a whole week.
 */
import { useState } from 'react';

import { C } from '../engine/constants';
import { buildStationSetup } from '../engine/plate';
import { autoAssign } from '../engine/season';
import { coversFor, weeklyOutlook } from '../engine/economy';
import { STATIONS, type Station } from '../engine/types';
import { cookLast, formatCurrency, formatNumber, t } from '../i18n';
import { currentMenu, useGame } from '../store/gameStore';
import BarIndicator from '../components/BarIndicator';
import BrassDivider from '../components/BrassDivider';

const DAY_KEYS = ['day.tue', 'day.wed', 'day.thu', 'day.fri', 'day.sat'] as const;

export default function MondayPlan(): React.JSX.Element | null {
  const game = useGame((s) => s.game);
  const toggleRestTicket = useGame((s) => s.toggleRestTicket);
  const togglePremium = useGame((s) => s.togglePremium);
  const lockKitchen = useGame((s) => s.lockKitchen);
  const goto = useGame((s) => s.goto);
  const refusal = useGame((s) => s.refusal);
  const [selectedCookId, setSelectedCookId] = useState<string | null>(null);
  const [focusEvening, setFocusEvening] = useState<number | null>(null);

  if (game === null) return null;

  const menu = currentMenu(game);
  const weekIndex = Math.floor(game.eveningIndex / C.season.eveningsPerWeek);
  const tickets = game.weekPlan.restTickets;

  const outlook = weeklyOutlook(game.reputation, menu, game.weekPlan.premiumIngredients);
  const premiumCost =
    weeklyOutlook(game.reputation, menu, true).costs -
    weeklyOutlook(game.reputation, menu, false).costs;
  const netTone =
    game.cash + outlook.net < 0 ? 'var(--bad)' : outlook.net < 0 ? 'var(--warn)' : 'var(--ok)';

  /** The forecast under the finger: what this evening's kitchen will look like. */
  function forecast(
    eveningInWeek: number,
  ): { station: Station; capacity: number; load: number } | null {
    const resting = tickets.filter((x) => x.eveningIndex === eveningInWeek).map((x) => x.cookId);
    const assignment = autoAssign(game!.cooks, resting);
    const byId = new Map(game!.cooks.map((c) => [c.id, c]));
    let worst: { station: Station; capacity: number; load: number } | null = null;
    for (const station of STATIONS) {
      const setup = buildStationSetup(
        station,
        menu,
        byId.get(assignment.leads[station] ?? '') ?? null,
        byId.get(assignment.helpers[station] ?? '') ?? null,
      );
      if (worst === null || setup.overload > 0) {
        if (
          worst === null ||
          setup.load / Math.max(setup.capacity, 0.1) > worst.load / Math.max(worst.capacity, 0.1)
        ) {
          worst = { station, capacity: setup.capacity, load: setup.load };
        }
      }
    }
    return worst;
  }

  return (
    <>
      <header className="spread">
        <div>
          <h1 className="h2" style={{ margin: 0 }}>
            {t('monday.title')}
          </h1>
          <div className="mono muted" style={{ fontSize: 'var(--fs-small)' }}>
            {t('monday.week', { n: weekIndex + 1, total: C.season.weeksPerSeason })}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="mono" style={{ fontSize: 'var(--fs-small)' }}>
            {formatCurrency(game.cash)}
          </div>
          <div className="mono muted" style={{ fontSize: 'var(--fs-small)' }}>
            {t('common.reputation')} {formatNumber(game.reputation, 0)}
          </div>
        </div>
      </header>

      <div style={{ marginTop: 12 }}>
        <BarIndicator
          menu={menu}
          weekIndex={weekIndex}
          reputation={game.reputation}
          seasonNumber={game.seasonNumber}
        />
      </div>

      <BrassDivider />
      <div className="spread">
        <span className="label">{t('monday.rail')}</span>
        <span className="mono muted" style={{ fontSize: 'var(--fs-small)' }}>
          {t('monday.ticketsLeft', {
            n: C.planning.restTicketsPerWeek - tickets.length,
            total: C.planning.restTicketsPerWeek,
          })}
        </span>
      </div>
      <div className="row" style={{ marginTop: 8, flexWrap: 'wrap', gap: 6 }}>
        {/* Wear on the chip. This is the screen where you decide who rests, and
            until now it was the one screen that did not say who was tired. */}
        {game.cooks.map((cook) => {
          const tone =
            cook.wear >= C.wear.warningThreshold
              ? 'var(--bad)'
              : cook.wear >= C.wear.max * 0.6
                ? 'var(--warn)'
                : 'var(--ok)';
          return (
            <button
              key={cook.id}
              type="button"
              className={selectedCookId === cook.id ? 'chip chip--brass tap' : 'chip tap'}
              style={{ gap: 7 }}
              // The whole chip carries the sentence. An aria-label on the figure
              // alone replaced it with the bare word "wear" and the number was
              // never read out — the same mistake as on the station cards.
              aria-label={`${cookLast(cook.id)} · ${t('common.wear')} ${formatNumber(cook.wear, 1)}`}
              onClick={() => setSelectedCookId(selectedCookId === cook.id ? null : cook.id)}
            >
              {cookLast(cook.id)} <span style={{ color: tone }}>{formatNumber(cook.wear, 1)}</span>
            </button>
          );
        })}
      </div>

      <div className="stack" style={{ marginTop: 12 }}>
        {DAY_KEYS.map((dayKey, eveningInWeek) => {
          const dealt = tickets.filter((x) => x.eveningIndex === eveningInWeek);
          const view = forecast(eveningInWeek);
          const overloaded = view !== null && view.capacity > 0 && view.load / view.capacity > 1;
          return (
            /* A div, not a button. The dealt tickets have to be removable, and a
               button inside a button is invalid markup — which is why they were a
               span with a click handler and no keyboard path at all. */
            <div key={dayKey} className="card" style={{ textAlign: 'left', padding: 10 }}>
              <button
                type="button"
                className="spread"
                style={{ width: '100%' }}
                onClick={() => {
                  setFocusEvening(eveningInWeek);
                  if (selectedCookId !== null) {
                    toggleRestTicket(selectedCookId, eveningInWeek);
                    setSelectedCookId(null);
                  }
                }}
              >
                <span className="display" style={{ fontSize: 'var(--fs-dish)' }}>
                  {t(dayKey)}
                </span>
                <span className="mono muted" style={{ fontSize: 'var(--fs-small)' }}>
                  {t('pas.covers', { n: coversFor(game.reputation, eveningInWeek) })}
                </span>
              </button>

              <div
                className="row"
                style={{ marginTop: 6, flexWrap: 'wrap', gap: 6, minHeight: 24 }}
              >
                {dealt.map((ticket) => {
                  const cook = game.cooks.find((c) => c.id === ticket.cookId);
                  const name = cook === undefined ? ticket.cookId : cookLast(cook.id);
                  return (
                    <button
                      key={ticket.cookId}
                      type="button"
                      className="chip chip--ok"
                      aria-label={`${name} — ${t('common.resting')}`}
                      onClick={() => toggleRestTicket(ticket.cookId, eveningInWeek)}
                    >
                      {name} ✕
                    </button>
                  );
                })}
              </div>

              {focusEvening === eveningInWeek && view !== null ? (
                <div
                  className="mono"
                  style={{
                    fontSize: 'var(--fs-small)',
                    marginTop: 6,
                    color: overloaded ? 'var(--bad)' : 'var(--ok)',
                  }}
                >
                  {t('monday.forecast', {
                    day: t(dayKey),
                    station: t(`station.${view.station}`),
                    capacity: formatNumber(view.capacity, 1),
                    load: formatNumber(view.load, 1),
                  })}
                  {overloaded ? ` → ${t('pas.overloaded')}` : ''}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {refusal !== null ? (
        <p className="bad" style={{ fontSize: 'var(--fs-small)', marginTop: 10 }} role="alert">
          {t(refusal)}
        </p>
      ) : null}

      <BrassDivider />

      {/* The strongest lever in the game, and until now a bare toggle reading
          "vypnuto". Measured over 200 seasons it roughly doubles the star rate and
          costs about a third of the season's profit — a weak brigade that leaves
          it on goes bankrupt in one season out of twelve. Both halves of that
          trade belong on the switch, in money the player can check. */}
      <div className="spread tap">
        <span className="label">{t('monday.premium')}</span>
        <button
          type="button"
          className={game.weekPlan.premiumIngredients ? 'chip chip--brass' : 'chip'}
          onClick={togglePremium}
        >
          {game.weekPlan.premiumIngredients ? t('monday.premiumOn') : t('monday.premiumOff')}
        </button>
      </div>
      <p className="quote" style={{ marginTop: 4, fontSize: 'var(--fs-small)' }}>
        {t('monday.premiumTrade', {
          q: formatNumber(C.plate.premiumBonus, 1),
          cost: formatCurrency(premiumCost),
        })}
      </p>

      {/* Compute before you commit — the same rule the Pas follows for a push. The
          investor ending used to arrive with no warning at all. */}
      <div className="card" style={{ marginTop: 10 }}>
        <div className="spread">
          <span className="label">{t('monday.outlook')}</span>
          {/* No hand-written '+': Czech puts the symbol after the number and
              English before it, so the sign landed as "+CZK 67,144". A losing week
              already carries a minus in both locales, which is the case that has
              to be unmistakable. */}
          <span className="mono" style={{ fontSize: 'var(--fs-num-sm)', color: netTone }}>
            {formatCurrency(outlook.net)}
          </span>
        </div>
        <div className="spread" style={{ marginTop: 4 }}>
          <span className="mono muted" style={{ fontSize: 'var(--fs-small)' }}>
            {t('monday.outlookAfter', { cash: formatCurrency(game.cash + outlook.net) })}
          </span>
        </div>
        {game.cash + outlook.net < 0 ? (
          <p className="bad" style={{ marginTop: 6, fontSize: 'var(--fs-small)' }}>
            {t('monday.outlookRisk')}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        className="btn-ghost"
        style={{ marginTop: 8 }}
        onClick={() => goto('menu')}
      >
        {t('monday.editMenu')}
      </button>

      <div className="dock">
        <button type="button" className="cta" onClick={lockKitchen}>
          {t('monday.lock')}
        </button>
      </div>
    </>
  );
}
