/**
 * Name the restaurant, meet the brigade. PRD §6.4, §6.7 — built from the same
 * CookRow the Pas uses.
 */
import { useState } from 'react';

import { t } from '../i18n';
import { useGame } from '../store/gameStore';
import { createStartingBrigade } from '../engine/draft';
import CookTriptych from '../components/CookTriptych';
import BrassDivider from '../components/BrassDivider';

export default function Onboarding(): React.JSX.Element {
  const newGame = useGame((s) => s.newGame);
  const storageBroken = useGame((s) => s.storageBroken);
  const [venueName, setVenueName] = useState('');
  const [seed, setSeed] = useState('');
  const brigade = createStartingBrigade();

  return (
    <>
      <h1 className="display" style={{ fontSize: 'var(--fs-title)', margin: 0 }}>
        {t('app.title')}
      </h1>
      <p className="quote" style={{ marginTop: 6 }}>
        {t('app.tagline')}
      </p>

      {storageBroken ? (
        <p className="bad" style={{ fontSize: 'var(--fs-small)' }} role="alert">
          {t('app.storageBroken')}
        </p>
      ) : null}

      <BrassDivider />

      <label className="label" htmlFor="venue">
        {t('app.venueLabel')}
      </label>
      <input
        id="venue"
        className="card"
        style={{ width: '100%', marginTop: 6, color: 'var(--ink)', fontSize: '16px' }}
        value={venueName}
        placeholder={t('app.venuePlaceholder')}
        onChange={(event) => setVenueName(event.target.value)}
      />

      <label className="label" htmlFor="seed" style={{ display: 'block', marginTop: 12 }}>
        {t('app.seedLabel')}
      </label>
      <input
        id="seed"
        className="card mono"
        style={{ width: '100%', marginTop: 6, color: 'var(--ink)', fontSize: '16px' }}
        value={seed}
        placeholder="7K3-MAREN"
        onChange={(event) => setSeed(event.target.value.toUpperCase())}
      />

      <BrassDivider />
      <div className="label">{t('app.brigadeIntro')}</div>
      <div className="stack" style={{ marginTop: 8 }}>
        {brigade.map((cook) => (
          <div className="card" key={cook.id} style={{ padding: 10 }}>
            <div className="spread">
              <div>
                <div className="display" style={{ fontSize: 'var(--fs-dish)' }}>
                  {cook.firstName} {cook.lastName}
                </div>
                <div className="muted" style={{ fontSize: 'var(--fs-small)' }}>
                  {t(`station.${cook.homeStation}`)}
                </div>
              </div>
              <div style={{ width: 132 }}>
                <CookTriptych cook={cook} />
              </div>
            </div>
            <p className="quote" style={{ marginTop: 6, fontSize: 'var(--fs-small)' }}>
              {t(cook.paradox)}
            </p>
          </div>
        ))}
      </div>

      <p className="quote" style={{ marginTop: 12 }}>
        {t('app.noRiskNoStar')}
      </p>

      <button
        type="button"
        className="cta tap"
        onClick={() =>
          newGame(
            venueName === '' ? t('app.venuePlaceholder') : venueName,
            seed === '' ? undefined : seed,
          )
        }
      >
        {t('app.start')}
      </button>
    </>
  );
}
