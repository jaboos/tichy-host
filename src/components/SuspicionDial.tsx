/**
 * One number, 0–100 %. PRD §3.8: the likelihood-ratio table belongs in a tooltip,
 * not on screen — showing the inputs to a calculation the player does not perform
 * is decoration pretending to be agency.
 */
import { formatPercent, t } from '../i18n';

const RADIUS = 17;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function SuspicionDial({ value }: { value: number }): React.JSX.Element {
  const clamped = Math.max(0, Math.min(1, value));
  const tone = clamped >= 0.35 ? 'var(--bad)' : clamped >= 0.18 ? 'var(--warn)' : 'var(--brass)';

  return (
    <div className="row" style={{ gap: 8 }}>
      <svg
        width="44"
        height="44"
        viewBox="0 0 44 44"
        role="img"
        aria-label={`${t('suspicion.title')} ${formatPercent(clamped)}`}
      >
        <circle cx="22" cy="22" r={RADIUS} fill="none" stroke="var(--line)" strokeWidth="4" />
        <circle
          cx="22"
          cy="22"
          r={RADIUS}
          fill="none"
          stroke={tone}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${CIRCUMFERENCE * clamped} ${CIRCUMFERENCE}`}
          transform="rotate(-90 22 22)"
        />
      </svg>
      <div>
        <div className="label">{t('suspicion.title')}</div>
        <div className="mono" style={{ fontSize: '17px', color: tone }}>
          {formatPercent(clamped)}
        </div>
      </div>
    </div>
  );
}
