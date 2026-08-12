/**
 * End of season. PRD §3.8 FR-12.
 *
 * The visual direction gave this screen its shape: the one light surface in the
 * game, a wax seal that lands before the star arrives, and the kitchen code in a
 * dark footer under the paper. That shape is here.
 *
 * What is NOT here is Lambert's prose. The letter's paragraphs are generated from
 * the season's own events by `narrator.ts`, which is Phase 4 (§7) — writing
 * plausible-sounding paragraphs by hand now would put sentences on screen that the
 * season did not earn. Until then the paper carries the figures the season really
 * produced, in the letter's own typography.
 */
import { C } from '../engine/constants';
import { isBankrupt } from '../engine/economy';
import { formatCurrency, formatNumber, t } from '../i18n';
import { useGame } from '../store/gameStore';

export default function Verdict(): React.JSX.Element | null {
  const game = useGame((s) => s.game);
  const goto = useGame((s) => s.goto);
  if (game === null) return null;

  const plates = game.visits.flatMap((visit) => visit.plates);
  const below = plates.filter((plate) => plate.outcome === 'defect').length;
  const starsKey = (['verdict.stars0', 'verdict.stars1', 'verdict.stars2'] as const)[game.stars];
  const starred = game.stars > 0;

  return (
    <>
      <div
        style={{
          overflow: 'hidden',
          borderRadius: 6,
          marginTop: 6,
          animation: 'rozlozeni 760ms var(--ease-out) both',
        }}
      >
        <div
          style={{
            background: 'var(--paper)',
            borderRadius: 6,
            padding: '26px 24px 22px',
            color: 'var(--paper-ink)',
            boxShadow: '0 20px 40px rgba(0,0,0,.55), 0 1px 0 rgba(255,255,255,.4) inset',
          }}
        >
          <div
            className="spread"
            style={{
              alignItems: 'baseline',
              borderBottom: '1px solid var(--paper-cool)',
              paddingBottom: 12,
            }}
          >
            <span
              className="display"
              style={{ fontSize: 13, letterSpacing: 'var(--ls-label)', textTransform: 'uppercase' }}
            >
              {t('verdict.guide')}
            </span>
            <span
              className="mono"
              style={{
                fontSize: 'var(--fs-micro)',
                letterSpacing: 'var(--ls-label)',
                color: '#6b6355',
                textTransform: 'uppercase',
              }}
            >
              {t('app.seasonNumber', { n: game.seasonNumber })}
            </span>
          </div>

          <p
            className="display"
            style={{
              marginTop: 16,
              marginBottom: 0,
              fontSize: 15.5,
              fontWeight: 400,
              lineHeight: 1.62,
              animation: 'otisk 420ms var(--ease-out) 420ms both',
            }}
          >
            {t('verdict.plates', {
              n: below,
              total: C.inspector.visitsPerSeason * C.inspector.platesPerVisit,
            })}
          </p>

          {isBankrupt(game.cash) ? (
            <p
              style={{
                marginTop: 10,
                marginBottom: 0,
                fontSize: 'var(--fs-small)',
                color: 'var(--seal)',
              }}
            >
              {t('verdict.bankrupt')}
            </p>
          ) : null}

          <div
            style={{
              marginTop: 20,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 14,
            }}
          >
            <div className="mono" style={{ fontSize: 13, color: '#5c5548', lineHeight: 1.5 }}>
              <div>
                {t('common.reputation')} {formatNumber(game.reputation, 1)}
              </div>
              <div>
                {t('common.cash')} {formatCurrency(game.cash)}
              </div>
            </div>

            {/* The seal lands first; the star is only allowed to arrive after it. */}
            <div
              aria-hidden="true"
              style={{
                position: 'relative',
                flex: 'none',
                width: 74,
                height: 74,
                animation: 'pecet 520ms var(--ease-drop) 1400ms both',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'var(--radius-pill)',
                  background:
                    'radial-gradient(circle at 34% 30%, #a33a2e, var(--seal) 58%, #5e1e18)',
                  boxShadow: '0 6px 14px rgba(60,15,10,.45), 0 1px 0 rgba(255,255,255,.25) inset',
                }}
              />
              <div
                className="display"
                style={{
                  position: 'absolute',
                  inset: 9,
                  borderRadius: 'var(--radius-pill)',
                  border: '1px dashed rgba(255,220,210,.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  color: '#f6d9d2',
                }}
              >
                L
              </div>
            </div>
          </div>

          <div
            className="row"
            style={{
              marginTop: 18,
              paddingTop: 14,
              borderTop: '1px solid var(--paper-cool)',
              gap: 12,
            }}
          >
            <span
              style={{
                flex: 'none',
                fontSize: starred ? 34 : 22,
                lineHeight: 1,
                color: starred ? 'var(--brass)' : 'var(--paper-cool)',
                animation: starred
                  ? 'hvezdaVstup 520ms var(--ease-drop) 2100ms both'
                  : 'otisk 420ms var(--ease-out) 2100ms both',
              }}
            >
              {starred ? '★'.repeat(game.stars) : '—'}
            </span>
            <span
              className="mono"
              style={{
                flex: 1,
                fontSize: 'var(--fs-small)',
                letterSpacing: 'var(--ls-label)',
                animation: 'otisk 420ms var(--ease-out) 2200ms both',
              }}
            >
              {t(starsKey ?? 'verdict.stars0')}
            </span>
          </div>
        </div>
      </div>

      <div className="dock">
        <div className="spread" style={{ alignItems: 'baseline' }}>
          <div>
            <div className="label" style={{ fontSize: 'var(--fs-micro)' }}>
              {t('app.kitchenCode')}
            </div>
            <div
              className="mono brass"
              style={{ marginTop: 3, fontSize: 15, letterSpacing: 'var(--ls-mono)' }}
            >
              {game.seed}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="label" style={{ fontSize: 'var(--fs-micro)' }}>
              {t('verdict.platesBelow')}
            </div>
            <div className="mono" style={{ marginTop: 3, fontSize: 15 }}>
              {below} / {C.inspector.visitsPerSeason * C.inspector.platesPerVisit}
            </div>
          </div>
        </div>
        <button type="button" className="cta" onClick={() => goto('onboarding')}>
          {t('verdict.again')}
        </button>
      </div>
    </>
  );
}
