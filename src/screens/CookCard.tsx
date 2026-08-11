/**
 * A cook's profile. PRD §6.4, §6.5 — the same triptych as the Pas, at 30 px and
 * with the values spelled out in words beneath, so a glyph is never the sole
 * carrier of meaning (§6.9).
 */
import { C } from '../engine/constants';
import { getTrait } from '../data/traits';
import { formatNumber, t } from '../i18n';
import { useGame } from '../store/gameStore';
import BrassDivider from '../components/BrassDivider';
import CookTriptych from '../components/CookTriptych';

export default function CookCard(): React.JSX.Element | null {
  const game = useGame((s) => s.game);
  const focusCookId = useGame((s) => s.focusCookId);
  const goto = useGame((s) => s.goto);
  if (game === null) return null;

  const cook = game.cooks.find((c) => c.id === focusCookId) ?? game.cooks[0];
  if (cook === undefined) return null;
  const trait = getTrait(cook.traitId);

  return (
    <>
      <button type="button" className="chip tap" onClick={() => goto('brigade')}>
        {t('cook.back')}
      </button>

      <h1 className="display" style={{ fontSize: 'var(--fs-title)', margin: '10px 0 0' }}>
        {cook.firstName} {cook.lastName}
      </h1>
      <div className="muted" style={{ fontSize: 'var(--fs-small)' }}>
        {t('cook.home')}: {t(`station.${cook.homeStation}`)}
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <CookTriptych cook={cook} large withWords />
      </div>

      <p className="quote" style={{ marginTop: 12 }}>
        {t(cook.paradox)}
      </p>

      <BrassDivider />
      <div className="card">
        <div className="spread">
          <span className="label">{t('cook.wear')}</span>
          <span className="mono">
            {formatNumber(cook.wear, 1)} / {C.wear.max}
          </span>
        </div>
        <div className="spread" style={{ marginTop: 6 }}>
          <span className="label">{t('cook.growth')}</span>
          <span className="mono">
            {cook.cleanEvenings} / {cook.growthThreshold}
          </span>
        </div>
        <div className="spread" style={{ marginTop: 6 }}>
          <span className="label">{t('cook.hand')}</span>
          <span className="mono">
            {cook.hand} / {C.growth.maxHand}
          </span>
        </div>
      </div>

      <BrassDivider />
      <div className="card">
        <div className="display" style={{ fontSize: 'var(--fs-dish)' }}>
          {t(trait.nameKey)}
        </div>
        <p className="quote" style={{ marginTop: 4, fontSize: 'var(--fs-small)' }}>
          {t(trait.descKey)}
        </p>
      </div>
    </>
  );
}
