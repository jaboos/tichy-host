/**
 * One cook as a roster line — name, home station, triptych, wear, trait.
 *
 * It no longer carries the assignment picker. Assignment moved onto the station
 * card (PRD §3.1 FR-1a as amended): the decision is "who cooks this station", not
 * "where does this person go", and the numbers that decide it live on the card.
 * This row is what the Kádr screen lists.
 */
import { C } from '../engine/constants';
import { getTrait } from '../data/traits';
import { formatNumber, t } from '../i18n';
import CookTriptych from './CookTriptych';
import type { Cook } from '../engine/types';

interface Props {
  cook: Cook;
  onOpenCard: () => void;
}

export default function CookRow({ cook, onOpenCard }: Props): React.JSX.Element {
  const trait = getTrait(cook.traitId);
  const wearRatio = cook.wear / C.wear.max;
  const nearCap = cook.wear >= C.wear.warningThreshold;
  const wearTone = nearCap
    ? 'var(--bad)'
    : cook.wear >= C.wear.max * 0.6
      ? 'var(--warn)'
      : 'var(--ok)';

  return (
    <button
      type="button"
      className="card"
      style={{ padding: 10, textAlign: 'left' }}
      onClick={onOpenCard}
    >
      {/* The triptych gets its own line. Three labelled columns need 176 px and
          the name needs the rest — at 390 px they do not share a row. */}
      <div style={{ minWidth: 0 }}>
        <div className="display" style={{ fontSize: 'var(--fs-dish)' }}>
          {cook.firstName} {cook.lastName}
        </div>
        <div className="muted" style={{ fontSize: 'var(--fs-small)' }}>
          {t(`station.${cook.homeStation}`)} · {t(trait.nameKey)}
        </div>
      </div>
      <div style={{ marginTop: 8 }}>
        <CookTriptych cook={cook} />
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
        <span className="mono" style={{ fontSize: 'var(--fs-small)', color: wearTone }}>
          {formatNumber(cook.wear, 1)}
        </span>
      </div>
    </button>
  );
}
