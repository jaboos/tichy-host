/**
 * One number, 0–100 %. PRD §3.8: the likelihood-ratio table belongs in a tooltip,
 * not on screen — showing the inputs to a calculation the player does not perform
 * is decoration pretending to be agency.
 *
 * The state is said in a word under the ring as well as in colour, so colour is
 * never the only carrier. The threshold for that word is the engine's own
 * `C.inspector.highSuspicion`, not a number invented for the UI.
 */
import { C } from '../engine/constants';
import { formatPercent, t } from '../i18n';
import Glossary from './Glossary';

export default function SuspicionDial({ value }: { value: number }): React.JSX.Element {
  const clamped = Math.max(0, Math.min(1, value));
  const hot = clamped >= C.inspector.highSuspicion;
  const tone = hot ? 'var(--bad)' : 'var(--brass)';
  const percent = Math.round(clamped * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
      <div className="row" style={{ gap: 2 }}>
        <span className="label" style={{ fontSize: 'var(--fs-micro)' }}>
          {t('suspicion.title')}
        </span>
        <Glossary of="podezreni" />
      </div>

      <div
        role="img"
        aria-label={`${t('suspicion.title')} ${formatPercent(clamped)}`}
        style={{ position: 'relative', width: 62, height: 62, marginTop: 2 }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'var(--radius-pill)',
            background: `conic-gradient(${tone} 0% ${percent}%, var(--line) ${percent}% 100%)`,
          }}
        />
        {hot ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--bad-a45)',
              animation: 'puls 2.4s var(--ease-out) infinite',
            }}
          />
        ) : null}
        <div
          className="mono"
          style={{
            position: 'absolute',
            inset: 5,
            borderRadius: 'var(--radius-pill)',
            background: 'var(--card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            whiteSpace: 'nowrap',
            fontSize: 14,
            letterSpacing: '-.02em',
            color: tone,
          }}
        >
          {formatPercent(clamped)}
        </div>
      </div>

      <div
        className="mono"
        style={{ fontSize: 'var(--fs-micro)', letterSpacing: 'var(--ls-label)', color: tone }}
      >
        {hot ? t('suspicion.tense') : t('suspicion.calm')}
      </div>
    </div>
  );
}
