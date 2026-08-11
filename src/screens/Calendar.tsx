/**
 * Two weeks ahead. PRD §6.4.
 *
 * Covers belong here in the footer of an evening rather than at the top of the
 * Pas: they affect revenue and never quality, and putting them anywhere prominent
 * makes the player expect an influence that does not exist (v4 §15).
 */
import { C } from '../engine/constants';
import { coversFor } from '../engine/economy';
import { eveningInWeekOf, weekIndexOf } from '../engine/season';
import { formatNumber, t } from '../i18n';
import { useGame } from '../store/gameStore';

const DAY_KEYS = [
  'day.tueShort',
  'day.wedShort',
  'day.thuShort',
  'day.friShort',
  'day.satShort',
] as const;

export default function Calendar(): React.JSX.Element | null {
  const game = useGame((s) => s.game);
  if (game === null) return null;

  const currentWeek = weekIndexOf(game.eveningIndex);
  const weeks = [currentWeek, currentWeek + 1].filter((w) => w < C.season.weeksPerSeason);

  return (
    <>
      <h1 className="display" style={{ fontSize: 'var(--fs-h2)', margin: 0 }}>
        {t('calendar.title')}
      </h1>

      {weeks.map((week) => (
        <section key={week} style={{ marginTop: 14 }}>
          <div className="label">
            {t('monday.week', { n: week + 1, total: C.season.weeksPerSeason })}
          </div>
          <div className="stack" style={{ marginTop: 8, gap: 4 }}>
            {DAY_KEYS.map((dayKey, eveningInWeek) => {
              const index = week * C.season.eveningsPerWeek + eveningInWeek;
              const played = index < game.eveningIndex;
              const isNow = index === game.eveningIndex;
              const record = game.history[index];
              return (
                <div
                  key={dayKey}
                  className={isNow ? 'card card--lifted' : 'card'}
                  style={{ padding: '8px 10px', opacity: played ? 0.6 : 1 }}
                >
                  <div className="spread">
                    <span className="row" style={{ gap: 8 }}>
                      <span className="mono">{t(dayKey)}</span>
                      <span className="muted" style={{ fontSize: 'var(--fs-small)' }}>
                        {t('calendar.evening', { n: index + 1 })}
                      </span>
                    </span>
                    <span className="mono muted" style={{ fontSize: 'var(--fs-small)' }}>
                      {played && record !== undefined
                        ? `${t('service.defects')} ${record.defects} · ★ ${record.starPlates}`
                        : t('pas.covers', { n: coversFor(game.reputation, eveningInWeek) })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div className="card" style={{ padding: '8px 10px', opacity: 0.55 }}>
              <div className="spread">
                <span className="mono">{t('day.sun')}</span>
                <span className="muted" style={{ fontSize: 'var(--fs-small)' }}>
                  {t('calendar.report')}
                </span>
              </div>
            </div>
          </div>
        </section>
      ))}

      <p className="quote" style={{ marginTop: 14, fontSize: 'var(--fs-small)' }}>
        {t('common.reputation')} {formatNumber(game.reputation, 1)} ·{' '}
        {t('pas.evening', {
          n: eveningInWeekOf(game.eveningIndex) + 1,
          total: C.season.eveningsPerWeek,
        })}
      </p>
    </>
  );
}
