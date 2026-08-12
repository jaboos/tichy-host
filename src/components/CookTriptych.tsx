/**
 * RUKA · ODOLNOST · CHTĚNÍ — the three slots. PRD §6.5.
 *
 * Only the first slot is a number, and it is the only value that enters
 * `computePlateQuality`. The other two are glyphs that differ in SHAPE as well as
 * colour (● ◐ ○), so they survive colour blindness and greyscale, and each
 * carries an aria-label spelling the value out (§6.9).
 */
import { t } from '../i18n';
import type { Cook, Station } from '../engine/types';

const ENDURANCE_GLYPH: Record<Cook['endurance'], { glyph: string; className: string }> = {
  lasts: { glyph: '●', className: 'ok' },
  normal: { glyph: '◐', className: 'brass' },
  burns: { glyph: '○', className: 'warn' },
};

function desireGlyph(cook: Cook): { glyph: string; className: string; label: string } {
  const { desire } = cook;
  if (desire.refusals >= 2) return { glyph: '!', className: 'bad', label: t('cook.desire') };
  if (desire.target > 0 && desire.progress >= desire.target) {
    return { glyph: '✦', className: 'brass', label: t('cook.desire') };
  }
  if (desire.progress > 0) {
    const filled = '●'.repeat(desire.progress);
    const empty = '○'.repeat(Math.max(0, desire.target - desire.progress));
    return {
      glyph: `${filled}${empty}`,
      className: 'brass',
      label: t('cook.desireStep', {
        step: desire.step + 1,
        progress: desire.progress,
        target: desire.target,
      }),
    };
  }
  return { glyph: t('common.none'), className: 'muted', label: t('cook.noDesire') };
}

interface Props {
  cook: Cook;
  /** When the cook is assigned, slot 1 shows the home-station modifier. */
  station?: Station | null;
  large?: boolean;
  /** The CookCard spells the values out in words beneath the glyphs. */
  withWords?: boolean;
}

export default function CookTriptych({
  cook,
  station = null,
  large = false,
  withWords = false,
}: Props): React.JSX.Element {
  const endurance = ENDURANCE_GLYPH[cook.endurance];
  const desire = desireGlyph(cook);
  const atHome = station !== null && cook.homeStation === station;
  const valueSize = large ? '30px' : '13px';

  const slot = (
    labelKey: 'triptych.hand' | 'triptych.endurance' | 'triptych.desire',
    body: React.ReactNode,
    ariaLabel: string,
    words?: string,
  ): React.JSX.Element => (
    <div style={{ textAlign: 'center', minWidth: 0 }}>
      <div
        className="mono"
        style={{ fontSize: valueSize, lineHeight: 1.1 }}
        aria-label={ariaLabel}
        role="img"
      >
        {body}
      </div>
      {/* Playtested: ODOLNOST and CHTĚNÍ ran together. Adjacent uppercase
          micro-labels need a real gutter — FR-1 item 5 sets the floor at 8 px. */}
      <div
        className="label"
        style={{
          fontSize: 'var(--fs-micro)',
          letterSpacing: '.06em',
          marginTop: 3,
          whiteSpace: 'nowrap',
          paddingInline: 5,
        }}
      >
        {t(labelKey)}
      </div>
      {withWords && words !== undefined ? (
        <div className="muted" style={{ fontSize: 'var(--fs-small)', marginTop: 2 }}>
          {words}
        </div>
      ) : null}
    </div>
  );

  return (
    // The floor is set here, not by the caller: ODOLNOST and CHTĚNÍ are nowrap and
    // grew with --fs-micro (7.5 → 9.5 px), so a container narrower than this runs
    // them into each other. That is exactly how they collided again on the
    // onboarding roster after the token swap.
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        columnGap: 10,
        minWidth: large ? undefined : 176,
      }}
    >
      {slot(
        'triptych.hand',
        <>
          <span>{cook.hand}</span>
          {station !== null ? (
            <span
              className={atHome ? 'brass' : 'muted'}
              style={{ fontSize: large ? '15px' : '10px', marginLeft: 3 }}
            >
              {atHome ? '+1' : '−1'}
            </span>
          ) : null}
        </>,
        `${t('cook.hand')} ${cook.hand}`,
        station !== null ? t('cook.home') : undefined,
      )}
      {slot(
        'triptych.endurance',
        <span className={endurance.className}>{endurance.glyph}</span>,
        `${t('cook.endurance')}: ${t(`endurance.${cook.endurance}`)}`,
        t(`endurance.${cook.endurance}`),
      )}
      {slot(
        'triptych.desire',
        <span className={desire.className} style={{ fontSize: large ? '22px' : '9px' }}>
          {desire.glyph}
        </span>,
        desire.label,
        desire.label,
      )}
    </div>
  );
}
