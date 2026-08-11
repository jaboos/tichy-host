/**
 * The Pas — assignment plus exactly one intervention. PRD §3.1 FR-1.
 *
 * Top to bottom: header with the suspicion dial, the maître's line, the bar,
 * four station disks, six cook rows, the intervention row, and a fixed CTA whose
 * status line says what is wrong before service starts rather than after.
 */
import { C } from '../engine/constants';
import { buildSetups } from '../engine/service';
import { STATIONS, type InterventionId } from '../engine/types';
import { SIGNALS } from '../data/signals';
import { t } from '../i18n';
import { currentMenu, useGame } from '../store/gameStore';
import BarIndicator from '../components/BarIndicator';
import BrassDivider from '../components/BrassDivider';
import CookRow from '../components/CookRow';
import StationDisk from '../components/StationDisk';
import SuspicionDial from '../components/SuspicionDial';

const DAY_KEYS = [
  'day.tueShort',
  'day.wedShort',
  'day.thuShort',
  'day.friShort',
  'day.satShort',
] as const;

const INTERVENTIONS: readonly InterventionId[] = [
  'praise',
  'scold',
  'swap',
  'cutCourse',
  'deferRest',
  'push',
];

export default function Pas(): React.JSX.Element | null {
  const game = useGame((s) => s.game);
  const opening = useGame((s) => s.opening);
  const draft = useGame((s) => s.draft);
  const intervention = useGame((s) => s.intervention);
  const expandedCookId = useGame((s) => s.expandedCookId);
  const refusal = useGame((s) => s.refusal);
  const expandCook = useGame((s) => s.expandCook);
  const placeCook = useGame((s) => s.placeCook);
  const setIntervention = useGame((s) => s.setIntervention);
  const startService = useGame((s) => s.startService);
  const openCookCard = useGame((s) => s.openCookCard);

  if (game === null || opening === null) return null;

  const menu = currentMenu(game);
  const setups = buildSetups(game.cooks, draft, menu);
  const overloaded = STATIONS.filter((s) => setups[s].overload > 0 || !setups[s].viable);
  const dayKey = DAY_KEYS[opening.eveningInWeek] ?? DAY_KEYS[0];

  const maitre = SIGNALS.filter((definition) =>
    opening.signals.some((signal) => signal.id === definition.id && signal.present),
  );

  return (
    <>
      <header className="spread">
        <div>
          <h1 className="display" style={{ fontSize: 'var(--fs-h2)', margin: 0 }}>
            {game.venueName === '' ? t('app.title') : game.venueName}
          </h1>
          <div className="mono muted" style={{ fontSize: 'var(--fs-small)', marginTop: 2 }}>
            {t('pas.evening', {
              n: opening.eveningIndex + 1,
              total: C.season.eveningsPerSeason,
            })}{' '}
            · {t(dayKey)} · {t('pas.covers', { n: opening.covers })}
          </div>
        </div>
        <SuspicionDial value={opening.suspicion} />
      </header>

      <p className="quote" style={{ marginTop: 12, minHeight: 20 }}>
        {maitre.length === 0 ? t('consequence.quiet') : maitre.map((s) => t(s.textKey)).join(' ')}
      </p>

      <div style={{ marginTop: 12 }}>
        <BarIndicator
          menu={menu}
          weekIndex={opening.weekIndex}
          reputation={game.reputation}
          seasonNumber={game.seasonNumber}
        />
      </div>

      <BrassDivider />
      <div className="label">{t('pas.stations')}</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          marginTop: 8,
          alignItems: 'stretch',
        }}
      >
        {STATIONS.map((station) => (
          <StationDisk
            key={station}
            station={station}
            setup={setups[station]}
            onPickCook={expandCook}
          />
        ))}
      </div>

      <BrassDivider />
      <div className="spread">
        <span className="label">{t('pas.brigade')}</span>
        <span className="muted" style={{ fontSize: 'var(--fs-small)' }}>
          {t('pas.tapRow')}
        </span>
      </div>
      <div className="stack" style={{ marginTop: 8 }}>
        {game.cooks.map((cook) => (
          <CookRow
            key={cook.id}
            cook={cook}
            assignment={draft}
            expanded={expandedCookId === cook.id}
            onToggle={() => expandCook(expandedCookId === cook.id ? null : cook.id)}
            onPlace={(target) => placeCook(cook.id, target)}
            onOpenCard={() => openCookCard(cook.id)}
          />
        ))}
      </div>

      <BrassDivider />
      <div className="spread">
        <span className="label">{t('pas.intervention')}</span>
        <span className="chip chip--brass">
          {t('common.pushTokens')} {game.pushTokens}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
        <button
          type="button"
          className={intervention === null ? 'chip chip--brass tap' : 'chip tap'}
          style={{ justifyContent: 'center' }}
          onClick={() => setIntervention(null)}
        >
          {t('pas.noIntervention')}
        </button>
        {INTERVENTIONS.map((id) => {
          const active = intervention?.id === id;
          // Every intervention needs a target; the station ones default to the
          // station under the most strain, which is what the disks already show.
          const worst =
            [...STATIONS].sort((a, b) => setups[b].overload - setups[a].overload)[0] ?? 'sauce';
          return (
            <button
              key={id}
              type="button"
              className={active ? 'chip chip--brass tap' : 'chip tap'}
              style={{ justifyContent: 'center' }}
              onClick={() =>
                setIntervention(
                  active
                    ? null
                    : {
                        id,
                        station: worst,
                        cookId: game.cooks[0]?.id,
                        courseId: menu[menu.length - 1]?.id,
                      },
                )
              }
            >
              {t(`intervention.${id}.name`)}
            </button>
          );
        })}
      </div>

      {refusal !== null ? (
        <p className="bad" style={{ fontSize: 'var(--fs-small)', marginTop: 10 }} role="alert">
          {t(refusal)}
        </p>
      ) : null}

      <button type="button" className="cta tap" onClick={startService}>
        {t('pas.start')}
        <span className="cta__note">
          {overloaded.length === 0
            ? t('pas.statusClear')
            : t('pas.statusOverload', {
                stations: overloaded.map((s) => t(`station.${s}`)).join(', '),
              })}{' '}
          ·{' '}
          {intervention === null
            ? t('pas.statusNoIntervention')
            : t('pas.statusIntervention', { name: t(`intervention.${intervention.id}.name`) })}
        </span>
      </button>
    </>
  );
}
