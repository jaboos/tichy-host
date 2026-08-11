/**
 * One cook on the Pas screen. PRD §3.1 FR-1: name, station, the three-slot
 * triptych, the home-station marker, a wear bar, the trait chip, and a warning
 * line when there is something to warn about.
 */
import { C } from '../engine/constants';
import { getTrait } from '../data/traits';
import { formatNumber, t } from '../i18n';
import CookTriptych from './CookTriptych';
import type { Cook, Station } from '../engine/types';

interface Props {
  cook: Cook;
  station: Station | null;
  role: 'lead' | 'helper' | null;
  resting: boolean;
  selected: boolean;
  onSelect: () => void;
  onOpenCard: () => void;
}

export default function CookRow({
  cook,
  station,
  role,
  resting,
  selected,
  onSelect,
  onOpenCard,
}: Props): React.JSX.Element {
  const trait = getTrait(cook.traitId);
  const wearRatio = cook.wear / C.wear.max;
  const nearCap = cook.wear >= C.wear.warningThreshold;
  const wearTone = nearCap
    ? 'var(--bad)'
    : cook.wear >= C.wear.max * 0.6
      ? 'var(--warn)'
      : 'var(--ok)';

  return (
    <div
      className={selected ? 'card card--lifted' : 'card'}
      style={{ padding: 10, opacity: resting ? 0.55 : 1 }}
    >
      <div className="spread">
        <button
          type="button"
          onClick={onSelect}
          style={{ textAlign: 'left', flex: 1, minWidth: 0 }}
        >
          <div className="display" style={{ fontSize: 'var(--fs-dish)' }}>
            {cook.firstName} {cook.lastName}
          </div>
          <div className="muted" style={{ fontSize: 'var(--fs-small)' }}>
            {resting
              ? t('pas.resting')
              : station === null
                ? t('common.none')
                : `${t(`station.${station}`)} · ${role === 'helper' ? t('pas.helper') : t('pas.lead')}`}
          </div>
        </button>
        <div style={{ width: 132 }}>
          <CookTriptych cook={cook} station={station} />
        </div>
      </div>

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
