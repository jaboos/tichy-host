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
import {
  currentMenu,
  eveningVerdict,
  interventionTargets,
  slotCandidates,
  useGame,
} from '../store/gameStore';
import type { Intervention } from '../engine/types';

/** Two intervention targets are the same when they name the same thing. */
function sameTarget(a: Intervention | null, b: Intervention): boolean {
  return (
    a !== null &&
    a.id === b.id &&
    a.cookId === b.cookId &&
    a.station === b.station &&
    a.courseId === b.courseId
  );
}
import BarIndicator from '../components/BarIndicator';
import BrassDivider from '../components/BrassDivider';
import Glossary from '../components/Glossary';
import SlotPicker from '../components/SlotPicker';
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
  const openSlot = useGame((s) => s.openSlot);
  const refusal = useGame((s) => s.refusal);
  const openSlotPicker = useGame((s) => s.openSlotPicker);
  const assignToSlot = useGame((s) => s.assignToSlot);
  const interventionOpen = useGame((s) => s.interventionOpen);
  const interventionPick = useGame((s) => s.interventionPick);
  const openIntervention = useGame((s) => s.openIntervention);
  const pickInterventionTarget = useGame((s) => s.pickInterventionTarget);
  const confirmIntervention = useGame((s) => s.confirmIntervention);
  const clearIntervention = useGame((s) => s.clearIntervention);
  const startService = useGame((s) => s.startService);

  if (game === null || opening === null) return null;

  const menu = currentMenu(game);
  const setups = buildSetups(game.cooks, draft, menu);
  const dayKey = DAY_KEYS[opening.eveningInWeek] ?? DAY_KEYS[0];

  const verdict = eveningVerdict(game, draft, menu, opening.suspicion, intervention);
  const resting = game.cooks.filter((cook) => draft.resting.includes(cook.id));
  const atCap = game.cooks.filter((cook) => cook.wear >= C.wear.warningThreshold);

  const targets =
    interventionOpen === null
      ? []
      : interventionTargets(interventionOpen, game, draft, menu, opening.weekIndex);

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
      <div className="label row" style={{ gap: 0 }}>
        {t('pas.stations')}
        <Glossary of="pretizeni" />
      </div>
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
            openSlot={openSlot}
            onOpenSlot={openSlotPicker}
          />
        ))}
      </div>

      {openSlot === null ? null : (
        <SlotPicker
          slot={openSlot}
          candidates={slotCandidates(game, draft, menu, openSlot)}
          occupied={
            (openSlot.role === 'lead' ? draft.leads : draft.helpers)[openSlot.station] !== null
          }
          onChoose={(cookId) => assignToSlot(openSlot, cookId)}
          onCancel={() => openSlotPicker(null)}
        />
      )}

      {/* The two things the station cards cannot say: who is not on one, and who
          is about to break. FR-1 requires the wear warning to be visible. */}
      <div className="mono muted" style={{ fontSize: 'var(--fs-small)', marginTop: 10 }}>
        {t('pas.restTag', {
          names:
            resting.length === 0
              ? t('pas.nobodyResting')
              : resting.map((c) => c.lastName).join(', '),
        })}
        {atCap.length === 0 ? null : (
          <>
            {'  ·  '}
            <span className="bad">
              {t('pas.capTag', { names: atCap.map((c) => c.lastName).join(', ') })}
            </span>
          </>
        )}
        <Glossary of="opotrebeni" />
      </div>

      <BrassDivider />
      <div className="spread">
        <span className="label row" style={{ gap: 0 }}>
          {t('pas.intervention')}
          <Glossary of="pritlacit" />
        </span>
        <span className="chip chip--brass">
          {t('common.pushTokens')} {game.pushTokens}
        </span>
      </div>
      <div className="stack" style={{ gap: 6, marginTop: 8 }}>
        <button
          type="button"
          className={intervention === null ? 'chip chip--brass tap' : 'chip tap'}
          style={{ justifyContent: 'center' }}
          onClick={clearIntervention}
        >
          {t('pas.noIntervention')}
        </button>

        {INTERVENTIONS.map((id) => {
          const chosen = intervention?.id === id;
          const open = interventionOpen === id;
          return (
            <button
              key={id}
              type="button"
              className={chosen || open ? 'chip chip--brass tap' : 'chip tap'}
              style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 3, width: '100%' }}
              // Step 1: tapping expands. It never confirms.
              onClick={() => openIntervention(open ? null : id)}
            >
              <span className="spread" style={{ width: '100%', gap: 8 }}>
                <span
                  className="display"
                  style={{ fontSize: 'var(--fs-body)', color: 'var(--ink)' }}
                >
                  {t(`intervention.${id}.name`)}
                  {chosen ? ' ✓' : ''}
                </span>
                {id === 'push' ? (
                  <span className="mono brass" style={{ fontSize: 'var(--fs-small)' }}>
                    {game.pushTokens}
                  </span>
                ) : null}
              </span>
              {/* The trade, on the card, before any tap. A bare label teaches nothing. */}
              <span className="muted" style={{ fontSize: 'var(--fs-small)', textAlign: 'left' }}>
                {t(`intervention.${id}.desc`)}
              </span>
            </button>
          );
        })}
      </div>

      {interventionOpen !== null ? (
        <div className="card card--lifted" style={{ marginTop: 8 }}>
          <p className="quote" style={{ fontSize: 'var(--fs-small)' }}>
            {t(`intervention.${interventionOpen}.desc`)}
          </p>
          <div className="label" style={{ marginTop: 8 }}>
            {t('iv.pickTarget')}
          </div>

          {targets.length === 0 ? (
            <p className="muted" style={{ fontSize: 'var(--fs-small)', marginTop: 6 }}>
              {t('iv.noTargets')}
            </p>
          ) : (
            <div className="stack" style={{ marginTop: 6, gap: 6 }}>
              {targets.map((target) => {
                const picked = sameTarget(interventionPick, target.value);
                return (
                  <div key={target.label}>
                    <button
                      type="button"
                      className={picked ? 'chip chip--brass tap' : 'chip tap'}
                      style={{ width: '100%', justifyContent: 'space-between' }}
                      // Step 2 names the target, step 3 shows the effect, and the
                      // SECOND tap on the same target is step 4 — the commit.
                      onClick={() =>
                        picked ? confirmIntervention() : pickInterventionTarget(target.value)
                      }
                    >
                      <span>
                        {t(`intervention.${interventionOpen}.name`)} · {target.label}
                      </span>
                      <span className="label" style={{ fontSize: 'var(--fs-micro)' }}>
                        {picked ? t('iv.confirm') : ''}
                      </span>
                    </button>

                    {picked ? (
                      <div style={{ marginTop: 4, paddingInline: 4 }}>
                        <div className="mono" style={{ fontSize: 'var(--fs-small)' }}>
                          {target.effect}
                        </div>
                        {target.note === undefined ? null : (
                          <div className="mono brass" style={{ fontSize: 'var(--fs-small)' }}>
                            {target.note}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
            className="chip tap"
            style={{ marginTop: 10 }}
            onClick={() => openIntervention(null)}
          >
            {t('iv.cancel')}
          </button>
        </div>
      ) : null}

      {refusal !== null ? (
        <p className="bad" style={{ fontSize: 'var(--fs-small)', marginTop: 10 }} role="alert">
          {t(refusal)}
        </p>
      ) : null}

      <button type="button" className="cta tap" onClick={startService}>
        {t('pas.start')}
        <span className="cta__note">{t(verdict.key, verdict.params)}</span>
      </button>
    </>
  );
}
