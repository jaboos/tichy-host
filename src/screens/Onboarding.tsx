/**
 * Three beats, one question each. PRD §5: name the venue, meet the brigade, and
 * the week-1 plan is already locked.
 *
 * The visual direction proposed a middle beat that asked the player to promise the
 * room a star. That is a thirteenth concept — CLAUDE.md rule 8 — and it dropped
 * the venue name the PRD requires, so the beat keeps the layout and asks the
 * question the game actually has an answer for.
 *
 * Every beat is skippable and nothing here rolls the RNG: the seed is only read
 * when "open the kitchen" is pressed.
 */
import { useState } from 'react';

import { t } from '../i18n';
import { useGame } from '../store/gameStore';
import { createStartingBrigade } from '../engine/draft';
import CookTriptych from '../components/CookTriptych';

const BEATS = 3;

function Dots({ at }: { at: number }): React.JSX.Element {
  return (
    <div className="row" style={{ gap: 7, justifyContent: 'center' }} aria-hidden="true">
      {Array.from({ length: BEATS }, (_, i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: 'var(--radius-pill)',
            background: i === at ? 'var(--brass)' : 'var(--line)',
          }}
        />
      ))}
    </div>
  );
}

export default function Onboarding(): React.JSX.Element {
  const newGame = useGame((s) => s.newGame);
  const storageBroken = useGame((s) => s.storageBroken);
  const [beat, setBeat] = useState(0);
  const [venueName, setVenueName] = useState('');
  const [seed, setSeed] = useState('');
  const [codeOpen, setCodeOpen] = useState(false);
  const brigade = createStartingBrigade();

  const open = (): void =>
    newGame(
      venueName === '' ? t('app.venuePlaceholder') : venueName,
      seed === '' ? undefined : seed,
    );

  if (beat === 0) {
    return (
      <>
        {/* The dock is a SIBLING of this block, never a child: a centring flex
            column would pull it to the middle of the screen. Found in the browser. */}
        <div
          style={{
            minHeight: '62dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: 18,
          }}
        >
          <h1
            className="display"
            style={{
              fontSize: 52,
              lineHeight: 1.05,
              margin: 0,
              animation: 'otisk 900ms var(--ease-out) both',
            }}
          >
            {t('app.title')}
          </h1>
          <span style={{ width: 46, height: 1, background: 'var(--brass-a55)' }} />
          <span
            className="mono brass"
            style={{ fontSize: 'var(--fs-small)', letterSpacing: 'var(--ls-label)' }}
          >
            {t('app.seasonNumber', { n: 1 })}
          </span>
          <p className="quote" style={{ fontSize: 19 }}>
            {t('app.tagline')}
          </p>

          {storageBroken ? (
            <p className="bad" style={{ fontSize: 'var(--fs-small)' }} role="alert">
              {t('app.storageBroken')}
            </p>
          ) : null}
        </div>

        <div className="dock">
          <button type="button" className="cta" onClick={() => setBeat(1)}>
            {t('app.continue')}
          </button>
          <Dots at={0} />
          <button type="button" className="btn-ghost" onClick={() => setBeat(2)}>
            {t('app.skipIntro')}
          </button>
        </div>
      </>
    );
  }

  if (beat === 1) {
    return (
      <>
        <div className="h2" style={{ marginTop: 14 }}>
          {t('app.venueQuestion')}
        </div>
        <p className="quote" style={{ marginTop: 8, fontSize: 19, color: 'var(--ink)' }}>
          {t('app.noRiskNoStar')}
        </p>

        <div className="stack" style={{ marginTop: 24 }}>
          <div>
            <label className="label" htmlFor="venue">
              {t('app.venueLabel')}
            </label>
            <input
              id="venue"
              className="card"
              style={{ width: '100%', marginTop: 6, color: 'var(--ink)', fontSize: 16 }}
              value={venueName}
              placeholder={t('app.venuePlaceholder')}
              onChange={(event) => setVenueName(event.target.value)}
            />
          </div>

          {/* FR-15: the field is revealed, not offered. And it carries no
              placeholder — `7K3-MAREN` sitting in the box reads as "type something
              like this", which is exactly what an optional field must not say. */}
          {codeOpen ? (
            <div>
              <label className="label" htmlFor="seed">
                {t('app.kitchenCode')}
              </label>
              <input
                id="seed"
                className="card mono"
                style={{ width: '100%', marginTop: 6, color: 'var(--ink)', fontSize: 16 }}
                value={seed}
                onChange={(event) => setSeed(event.target.value.toUpperCase())}
              />
              <p className="quote" style={{ marginTop: 6, fontSize: 'var(--fs-small)' }}>
                {t('app.codeHelp')}
              </p>
            </div>
          ) : (
            <button
              type="button"
              className="tap"
              style={{
                color: 'var(--ink-muted)',
                fontSize: 'var(--fs-small)',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
              onClick={() => setCodeOpen(true)}
            >
              {t('app.haveCode')}
            </button>
          )}
        </div>

        <div className="dock">
          <button type="button" className="cta" onClick={() => setBeat(2)}>
            {t('app.continue')}
          </button>
          <Dots at={1} />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="spread" style={{ marginTop: 8 }}>
        <span className="h2">{t('app.brigadeIntro')}</span>
        <span className="mono muted" style={{ fontSize: 'var(--fs-micro)' }}>
          {t('common.hand')} · {t('common.endurance')}
        </span>
      </div>

      <div className="stack" style={{ marginTop: 10, gap: 8 }}>
        {brigade.map((cook, index) => (
          <div
            className="card"
            key={cook.id}
            style={{
              padding: '11px 12px',
              borderRadius: 'var(--radius-docket)',
              animation: `vstup var(--dur-docket) var(--ease-out) calc(var(--stagger) * ${index}) both`,
            }}
          >
            {/* The triptych gets its own line. Three labelled columns need 176 px
                and the name needs the rest — at 390 px they do not share a row. */}
            <div className="row" style={{ gap: 9, alignItems: 'baseline', minWidth: 0 }}>
              <span className="display" style={{ fontSize: 17 }}>
                {cook.lastName}
              </span>
              <span className="label" style={{ fontSize: 'var(--fs-micro)' }}>
                {t(`station.${cook.homeStation}`)}
              </span>
            </div>
            <div style={{ marginTop: 8 }}>
              <CookTriptych cook={cook} />
            </div>
            <p
              className="quote"
              style={{ marginTop: 5, fontSize: 'var(--fs-body)', lineHeight: 1.4 }}
            >
              {t(cook.paradox)}
            </p>
          </div>
        ))}
      </div>

      <p className="muted" style={{ marginTop: 12, fontSize: 'var(--fs-small)' }}>
        {t('app.week1Locked')}
      </p>

      <div className="dock">
        <button type="button" className="cta" onClick={open}>
          {t('app.start')}
        </button>
        <Dots at={2} />
      </div>
    </>
  );
}
