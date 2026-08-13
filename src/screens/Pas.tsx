/**
 * The Pas — assignment plus exactly one intervention. PRD §3.1 FR-1.
 *
 * Top to bottom: header with the suspicion dial, the maître's line, the bar,
 * four station cards, the six interventions, and a bottom dock whose first line
 * says what is wrong before service starts rather than after.
 *
 * The intervention list carries a checkbox rather than a "✓" after the name: a
 * tick trailing a label reads as decoration, a box reads as state. Ticking the
 * chosen one again clears it — §3.5 allows choosing none, and the counter says so.
 */
import { C } from '../engine/constants';
import { buildSetups } from '../engine/service';
import { STATIONS, type InterventionId } from '../engine/types';
import { SIGNALS } from '../data/signals';
import { cookLast, t } from '../i18n';
import {
  currentMenu,
  eveningVerdict,
  interventionTargets,
  slotCandidates,
  useGame,
} from '../store/gameStore';
import type { Intervention } from '../engine/types';
import BarIndicator from '../components/BarIndicator';
import Glossary from '../components/Glossary';
import SlotPicker from '../components/SlotPicker';
import StationDisk from '../components/StationDisk';
import SuspicionDial from '../components/SuspicionDial';

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
  const verdictDot =
    verdict.tone === 'bad' ? 'var(--bad)' : verdict.tone === 'warn' ? 'var(--warn)' : 'var(--ok)';
  const resting = game.cooks.filter((cook) => draft.resting.includes(cook.id));
  const atCap = game.cooks.filter((cook) => cook.wear >= C.wear.warningThreshold);

  const targets =
    interventionOpen === null
      ? []
      : interventionTargets(interventionOpen, game, draft, menu, opening.weekIndex);

  const maitre = SIGNALS.filter((definition) =>
    opening.signals.some((signal) => signal.id === definition.id && signal.present),
  );

  /**
   * Rendered directly under the card that opened it, not at the end of the list:
   * appearing where the finger landed is what tells the player anything happened.
   * The ref callback scrolls it into view because the bottom dock covers the last
   * two cards — found in the browser, tapping "Přitlačit" looked like a no-op.
   */
  const targetPanel =
    interventionOpen === null ? null : (
      <div
        className="card card--lifted"
        // 'center', not 'nearest': the sticky dock is outside the scroll
        // calculation, so 'nearest' parks the panel underneath it.
        // Optional call: jsdom has no scrollIntoView, and the render tests mount
        // this for real rather than stubbing it.
        ref={(el) => el?.scrollIntoView?.({ block: 'center' })}
        style={{ animation: 'rozlozeni var(--dur-base) var(--ease-out) both', overflow: 'hidden' }}
      >
        <div className="label">{t('iv.pickTarget')}</div>

        {targets.length === 0 ? (
          <p className="muted" style={{ fontSize: 'var(--fs-small)', marginTop: 6 }}>
            {t('iv.noTargets')}
          </p>
        ) : (
          <div className="stack" style={{ marginTop: 8, gap: 6 }}>
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
    );

  return (
    <>
      <header className="spread" style={{ alignItems: 'flex-start' }}>
        <div style={{ paddingTop: 2 }}>
          <h1
            className="display"
            style={{ fontSize: 'var(--fs-title)', margin: 0, lineHeight: 1.15 }}
          >
            {game.venueName === '' ? t('app.title') : game.venueName}
          </h1>
          <div
            className="mono muted"
            style={{ fontSize: 'var(--fs-small)', marginTop: 5, letterSpacing: 'var(--ls-mono)' }}
          >
            {t('pas.evening', {
              n: opening.eveningIndex + 1,
              total: C.season.eveningsPerSeason,
            })}{' '}
            · {t(dayKey)} · {t('pas.covers', { n: opening.covers })}
          </div>
        </div>
        <SuspicionDial value={opening.suspicion} />
      </header>

      {/* The maître's tell gets a card of its own with a brass rule down its left
          edge, because it is the one line on the Pas that is not a number. */}
      <div
        className="card"
        style={{
          marginTop: 14,
          borderLeft: '2px solid var(--brass-a55)',
          borderRadius: 'var(--radius-chip)',
        }}
      >
        <p
          className="quote"
          style={{ fontSize: 'var(--fs-dish)', color: 'var(--ink)', lineHeight: 1.4 }}
        >
          {maitre.length === 0 ? t('consequence.quiet') : maitre.map((s) => t(s.textKey)).join(' ')}
        </p>
      </div>
      <div className="label" style={{ fontSize: 'var(--fs-micro)', marginTop: 5 }}>
        {t('suspicion.maitre')}
      </div>

      <div style={{ marginTop: 14 }}>
        <BarIndicator
          menu={menu}
          weekIndex={opening.weekIndex}
          reputation={game.reputation}
          seasonNumber={game.seasonNumber}
        />
      </div>

      <div className="spread" style={{ marginTop: 18 }}>
        <span className="h2">{t('pas.stations')}</span>
        <span className="row" style={{ gap: 2 }}>
          <span className="label" style={{ fontSize: 'var(--fs-micro)' }}>
            {t('pas.load')} / {t('pas.capacity')}
          </span>
          <Glossary of="pretizeni" />
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginTop: 10,
          alignItems: 'stretch',
        }}
      >
        {STATIONS.map((station) => (
          <StationDisk
            key={station}
            station={station}
            setup={setups[station]}
            openSlot={openSlot}
            targeted={intervention?.station === station}
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
      <div className="row" style={{ gap: 2, marginTop: 12, flexWrap: 'wrap' }}>
        <span className="mono muted" style={{ fontSize: 'var(--fs-small)' }}>
          {t('pas.restTag', {
            names:
              resting.length === 0
                ? t('pas.nobodyResting')
                : resting.map((c) => cookLast(c.id)).join(', '),
          })}
          {atCap.length === 0 ? null : (
            <>
              {'  ·  '}
              <span className="bad">
                {t('pas.capTag', { names: atCap.map((c) => cookLast(c.id)).join(', ') })}
              </span>
            </>
          )}
        </span>
        <Glossary of="opotrebeni" />
      </div>

      <div className="spread" style={{ marginTop: 16, alignItems: 'baseline' }}>
        <span className="h2 row" style={{ gap: 0 }}>
          {t('pas.intervention')}
          <Glossary of="pritlacit" />
        </span>
        <span className="mono muted" style={{ fontSize: 'var(--fs-micro)' }}>
          {intervention === null
            ? t('pas.interventionNone')
            : t('pas.interventionCount', { n: 1, total: INTERVENTIONS.length })}
        </span>
      </div>

      <div className="stack" style={{ gap: 8, marginTop: 10 }}>
        {INTERVENTIONS.map((id, index) => {
          const chosen = intervention?.id === id;
          const open = interventionOpen === id;
          return (
            <div key={id} className="stack" style={{ gap: 8 }}>
              <button
                type="button"
                className={chosen ? 'card card--lifted' : 'card'}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 11,
                  minHeight: 62,
                  padding: 12,
                  borderRadius: 'var(--radius-docket)',
                  borderColor: chosen ? 'var(--brass)' : open ? 'var(--brass-a35)' : undefined,
                  textAlign: 'left',
                  animation: `vstup var(--dur-docket) var(--ease-out) calc(var(--stagger) * ${index}) both`,
                }}
                // Step 1: tapping expands. It never confirms. Tapping the chosen
                // one again clears it — "no intervention" needs no tile of its own.
                onClick={() => (chosen ? clearIntervention() : openIntervention(open ? null : id))}
              >
                <span className={chosen ? 'box box--on' : 'box'} aria-hidden="true">
                  ✓
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="spread" style={{ alignItems: 'baseline', gap: 8 }}>
                    <span
                      className="display"
                      style={{ fontSize: 'var(--fs-dish)', color: 'var(--ink)', lineHeight: 1.15 }}
                    >
                      {t(`intervention.${id}.name`)}
                    </span>
                    {id === 'push' ? (
                      <span
                        className="mono brass"
                        style={{
                          flex: 'none',
                          fontSize: 'var(--fs-micro)',
                          border: '1px solid var(--brass-a35)',
                          borderRadius: 'var(--radius-pill)',
                          padding: '2px 7px',
                        }}
                      >
                        {t('common.pushTokens')} {game.pushTokens}
                      </span>
                    ) : null}
                  </span>
                  {/* The trade, on the card, before any tap. A bare label teaches nothing. */}
                  <span
                    className="muted"
                    style={{
                      display: 'block',
                      marginTop: 4,
                      fontSize: 'var(--fs-body)',
                      lineHeight: 1.4,
                    }}
                  >
                    {t(`intervention.${id}.desc`)}
                  </span>
                </span>
              </button>

              {open ? targetPanel : null}
            </div>
          );
        })}
      </div>

      {refusal !== null ? (
        <p className="bad" style={{ fontSize: 'var(--fs-small)', marginTop: 10 }} role="alert">
          {t(refusal)}
        </p>
      ) : null}

      <div className="dock">
        <div
          className="verdict-line"
          style={{ '--dot': verdictDot } as React.CSSProperties}
          role="status"
        >
          {t(verdict.key, verdict.params)}
        </div>
        <button type="button" className="cta" onClick={() => startService()}>
          {t('pas.start')}
          <span className="cta__note">{t('pas.covers', { n: opening.covers })}</span>
        </button>
        {/* The speed choice belongs here, before the evening runs — not as a
            control inside a cascade the player is already sitting through. */}
        <button type="button" className="btn-ghost" onClick={() => startService(true)}>
          {t('service.straightToResult')}
        </button>
      </div>
    </>
  );
}
