/**
 * One cook on the Pas, and the thing you actually touch. PRD §3.1 FR-1a.
 *
 * The rejected design was "tap a cook to select, then tap a station": it hides
 * state the player cannot see, makes a station tap a silent no-op when nobody is
 * selected, and leaves removal with nowhere to live. Here the cook is what you
 * touch and the station is what you read.
 *
 *   · the row always shows where this cook stands — there is no unknown state
 *   · tapping the row opens an inline picker directly beneath it, not a modal
 *   · removal is just choosing Volno, a named option rather than a gesture
 *   · an occupied station offers a SWAP rather than a refusal, so every one of
 *     the five rows is always actionable (FR-1a item 4)
 */
import { C } from '../engine/constants';
import { getTrait } from '../data/traits';
import { formatNumber, t } from '../i18n';
import CookTriptych from './CookTriptych';
import { placementOf, placementOptions, type Placement } from '../store/gameStore';
import type { Assignment, Cook } from '../engine/types';

interface Props {
  cook: Cook;
  /** The whole brigade, so a swap row can name the cook standing there. */
  cooks: readonly Cook[];
  assignment: Assignment;
  expanded: boolean;
  onToggle: () => void;
  onPlace: (target: Placement) => void;
  onOpenCard: () => void;
}

export default function CookRow({
  cook,
  cooks,
  assignment,
  expanded,
  onToggle,
  onPlace,
  onOpenCard,
}: Props): React.JSX.Element {
  const trait = getTrait(cook.traitId);
  const here = placementOf(assignment, cook.id);
  const station = here.target === 'rest' ? null : here.target;
  const resting = station === null;
  const wearRatio = cook.wear / C.wear.max;
  const nearCap = cook.wear >= C.wear.warningThreshold;
  const wearTone = nearCap
    ? 'var(--bad)'
    : cook.wear >= C.wear.max * 0.6
      ? 'var(--warn)'
      : 'var(--ok)';

  const placementLabel =
    station === null
      ? t('pas.resting')
      : `${t(`station.${station}`)} · ${here.role === 'helper' ? t('pas.helper') : t('pas.lead')}`;

  return (
    <div className={expanded ? 'card card--lifted' : 'card'} style={{ padding: 10 }}>
      <button
        type="button"
        onClick={onToggle}
        style={{ width: '100%', textAlign: 'left' }}
        aria-expanded={expanded}
      >
        <div className="spread">
          <div style={{ minWidth: 0, opacity: resting ? 0.65 : 1 }}>
            <div className="display" style={{ fontSize: 'var(--fs-dish)' }}>
              {cook.firstName} {cook.lastName}
            </div>
            {/* Placement is always visible. FR-1a item 1. */}
            <span
              className={resting ? 'chip' : 'chip chip--brass'}
              style={{ display: 'inline-block', marginTop: 4 }}
            >
              {placementLabel}
            </span>
          </div>
          <div style={{ width: 150 }}>
            <CookTriptych cook={cook} station={station} />
          </div>
        </div>
      </button>

      {expanded ? (
        <div style={{ marginTop: 10 }}>
          <div className="label">{t('pas.placement')}</div>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 6 }}
            role="group"
          >
            {placementOptions(assignment, cooks, cook.id).map((option) => {
              const where =
                option.target === 'rest' ? t('pas.resting') : t(`station.${option.target}`);
              const how = option.current
                ? t('pas.here')
                : option.kind === 'lead'
                  ? t('pas.asLead')
                  : option.kind === 'helper'
                    ? t('pas.asHelper')
                    : option.kind === 'swap'
                      ? t('pas.swapWith', { name: option.swapWith?.lastNameIns ?? '' })
                      : '';
              return (
                <button
                  key={option.target}
                  type="button"
                  className={option.current ? 'chip chip--brass tap' : 'chip tap'}
                  style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}
                  onClick={() => onPlace(option.target)}
                >
                  <span>{where}</span>
                  {how === '' ? null : (
                    <span className="label" style={{ fontSize: 'var(--fs-micro)' }}>
                      {how}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="row" style={{ marginTop: 8, gap: 8 }}>
        <div
          aria-hidden="true"
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            background: 'var(--line)',
            overflow: 'hidden',
          }}
        >
          <div style={{ width: `${wearRatio * 100}%`, height: '100%', background: wearTone }} />
        </div>
        <span className="mono muted" style={{ fontSize: 'var(--fs-small)' }}>
          {formatNumber(cook.wear, 1)}
        </span>
        <button type="button" className="chip" onClick={onOpenCard}>
          {t(trait.nameKey)}
        </button>
      </div>

      {nearCap && !resting ? (
        <div className="bad" style={{ fontSize: 'var(--fs-small)', marginTop: 6 }}>
          {t('pas.wearWarning')}
        </div>
      ) : null}
    </div>
  );
}
