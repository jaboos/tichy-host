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
import { coversFor } from '../engine/economy';
import { STATIONS, type Station } from '../engine/types';
import { formatCurrency, formatNumber, t } from '../i18n';
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
        {game.cooks.map((cook) => (
          <button
            key={cook.id}
            type="button"
            className={selectedCookId === cook.id ? 'chip chip--brass tap' : 'chip tap'}
            onClick={() => setSelectedCookId(selectedCookId === cook.id ? null : cook.id)}
          >
            {cook.lastName}
          </button>
        ))}
      </div>

      <div className="stack" style={{ marginTop: 12 }}>
        {DAY_KEYS.map((dayKey, eveningInWeek) => {
          const dealt = tickets.filter((x) => x.eveningIndex === eveningInWeek);
          const view = forecast(eveningInWeek);
          const overloaded = view !== null && view.capacity > 0 && view.load / view.capacity > 1;
          return (
            <button
              key={dayKey}
              type="button"
              className="card"
              style={{ textAlign: 'left', padding: 10 }}
              onClick={() => {
                setFocusEvening(eveningInWeek);
                if (selectedCookId !== null) {
                  toggleRestTicket(selectedCookId, eveningInWeek);
                  setSelectedCookId(null);
                }
              }}
            >
              <div className="spread">
                <span className="display" style={{ fontSize: 'var(--fs-dish)' }}>
                  {t(dayKey)}
                </span>
                <span className="mono muted" style={{ fontSize: 'var(--fs-small)' }}>
                  {t('pas.covers', { n: coversFor(game.reputation, eveningInWeek) })}
                </span>
              </div>

              <div
                className="row"
                style={{ marginTop: 6, flexWrap: 'wrap', gap: 6, minHeight: 24 }}
              >
                {dealt.map((ticket) => {
                  const cook = game.cooks.find((c) => c.id === ticket.cookId);
                  return (
                    <span
                      key={ticket.cookId}
                      className="chip chip--ok"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleRestTicket(ticket.cookId, eveningInWeek);
                      }}
                      role="presentation"
                    >
                      {cook?.lastName ?? ticket.cookId} ✕
                    </span>
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
            </button>
          );
        })}
      </div>

      {refusal !== null ? (
        <p className="bad" style={{ fontSize: 'var(--fs-small)', marginTop: 10 }} role="alert">
          {t(refusal)}
        </p>
      ) : null}

      <BrassDivider />
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
