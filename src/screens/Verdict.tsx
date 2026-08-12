/**
 * End of season. PRD §3.8 FR-12.
 *
 * The visual direction gave this screen its shape: the one light surface in the
 * game, a wax seal that lands before the star arrives, and the kitchen code in a
 * dark footer under the paper. That shape is here.
 *
 * Lambert's paragraphs come from `tellSeason`, written from the eighteen plates
 * the guide actually ate and nothing else. An evening the player remembers as a
 * disaster does not appear unless the guide was sitting there — which is the whole
 * mechanic, and the reason the letter cannot be written from `history`.
 */
import { C } from '../engine/constants';
import { isBankrupt } from '../engine/economy';
import { formatCurrency, formatNumber, t } from '../i18n';
import { letterText, useGame } from '../store/gameStore';

export default function Verdict(): React.JSX.Element | null {
  const game = useGame((s) => s.game);
  const nextSeason = useGame((s) => s.nextSeason);
  const startOver = useGame((s) => s.startOver);
  const goto = useGame((s) => s.goto);
  if (game === null) return null;

  const hasNextSeason = game.seasonNumber < C.season.seasonsPerCareer;
  const paragraphs = letterText(game);

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
              {t('verdict.careerStep', {
                n: game.seasonNumber,
                total: C.season.seasonsPerCareer,
              })}
            </span>
          </div>

          {/* The letter, written from the eighteen plates the guide actually ate.
              Every paragraph cites an evening it sat through; an evening the
              player thought went badly but the guide never saw does not appear. */}
          <div
            className="display"
            style={{ marginTop: 16, fontSize: 15.5, fontWeight: 400, lineHeight: 1.62 }}
          >
            <p style={{ margin: 0, animation: 'otisk 420ms var(--ease-out) 420ms both' }}>
              {t('letter.salutation')}
            </p>
            {paragraphs.map((paragraph, index) => (
              <p
                key={paragraph}
                style={{
                  marginTop: 12,
                  marginBottom: 0,
                  animation: `otisk 420ms var(--ease-out) ${560 + index * 130}ms both`,
                }}
              >
                {paragraph}
              </p>
            ))}
          </div>

          <p
            className="display"
            style={{
              marginTop: 20,
              marginBottom: 0,
              fontStyle: 'italic',
              fontSize: 13.5,
              color: '#5c5548',
              animation: 'otisk 420ms var(--ease-out) 1180ms both',
            }}
          >
            {t('letter.signature')}
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
        {/* A career is three seasons (§3.8) and the golden ladder is measured over
            all three. Until now the only button here restarted at season 1, so the
            second and third seasons were unreachable. */}
        <button type="button" className="btn-ghost" onClick={() => goto('chronicle')}>
          {t('chronicle.open')}
        </button>
        {hasNextSeason ? (
          <>
            <button type="button" className="cta" onClick={nextSeason}>
              {t('verdict.nextSeason')}
            </button>
            <button type="button" className="btn-ghost" onClick={startOver}>
              {t('verdict.again')}
            </button>
          </>
        ) : (
          <button type="button" className="cta" onClick={startOver}>
            {t('verdict.again')}
          </button>
        )}
      </div>
    </>
  );
}
