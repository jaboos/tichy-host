/**
 * The receipt. PRD §5.1 and §5.2, and the one place the kitchen code is met
 * unprompted — by then it means something (FR-15).
 *
 * The PNG is drawn straight onto a canvas with the 2D API. §5.2 forbids the
 * mockup's `<foreignObject>` route and gives the reasons: web fonts do not render
 * inside it unless base64-embedded, Safari is unreliable, and the canvas can end
 * up tainted. Drawing text with `ctx.font` after `document.fonts.ready` has none
 * of those problems and no dependency.
 *
 * Copying tries the clipboard, falls back to a hidden textarea and
 * `execCommand`, and if both fail it says so on screen rather than pretending.
 */
import { useEffect, useState } from 'react';

import { C } from '../engine/constants';
import { getLang, t } from '../i18n';
import { chronicleText, useGame } from '../store/gameStore';
import * as persistence from '../store/persistence';

/** 1080 × 1350 — the portrait card §5.2 specifies. */
const PNG_WIDTH = 1080;
const PNG_HEIGHT = 1350;

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // The clipboard API needs a secure context and a user gesture; neither is
    // guaranteed, so the old road stays open.
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }
}

/**
 * The seed as a row of bars. Not decoration: it is the part of the card that
 * survives being screenshotted badly, and it makes the code look like something
 * worth keeping rather than a support ticket number.
 */
function drawBarcode(ctx: CanvasRenderingContext2D, seed: string, y: number): void {
  const bars = [...seed.replace(/-/g, '')];
  const width = PNG_WIDTH - 200;
  const step = width / bars.length;
  ctx.fillStyle = '#d8a24a';
  bars.forEach((glyph, i) => {
    const height = 24 + (C.seed.alphabet.indexOf(glyph) % 8) * 7;
    ctx.fillRect(100 + i * step, y + (80 - height), step * 0.55, height);
  });
}

async function drawPng(text: string, seed: string): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = PNG_WIDTH;
  canvas.height = PNG_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (ctx === null) return null;

  // Fonts first, or the first draw lands in a fallback face.
  if (document.fonts !== undefined) await document.fonts.ready;

  ctx.fillStyle = '#14100d';
  ctx.fillRect(0, 0, PNG_WIDTH, PNG_HEIGHT);

  ctx.fillStyle = '#f3eee4';
  ctx.textBaseline = 'top';

  const lines = text.split('\n');
  const [headline, ...rest] = lines;

  ctx.font = '600 64px Spectral, Georgia, serif';
  ctx.fillText(headline ?? '', 100, 140, PNG_WIDTH - 200);

  ctx.fillStyle = '#9a9086';
  ctx.font = "400 38px 'IBM Plex Mono', monospace";
  rest.forEach((line, i) => {
    ctx.fillText(line, 100, 280 + i * 66, PNG_WIDTH - 200);
  });

  drawBarcode(ctx, seed, PNG_HEIGHT - 320);

  ctx.fillStyle = '#d8a24a';
  ctx.font = "400 44px 'IBM Plex Mono', monospace";
  ctx.fillText(seed, 100, PNG_HEIGHT - 210);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
}

export default function Chronicle(): React.JSX.Element | null {
  const game = useGame((s) => s.game);
  const goto = useGame((s) => s.goto);
  const [copied, setCopied] = useState(false);
  const [failure, setFailure] = useState<'copy' | 'png' | null>(null);

  const text = game === null ? '' : chronicleText(game);
  const seed = game?.seed ?? '';
  const seasonNumber = game?.seasonNumber ?? 1;

  // Completed seasons are kept so a career can be looked back at (FR-14). Guarded
  // on seed + season rather than on a mount flag, because walking back and forth
  // between the letter and the receipt must not file the same season twice.
  useEffect(() => {
    if (game === null) return;
    const already = persistence
      .loadChronicles()
      .some((entry) => entry.seed === seed && entry.seasonNumber === seasonNumber);
    if (already) return;
    persistence.appendChronicle({
      seed,
      venueName: game.venueName,
      seasonNumber: game.seasonNumber,
      stars: game.stars,
      reputation: game.reputation,
      cash: game.cash,
      lang: getLang(),
      text,
    });
  }, [game, seed, seasonNumber, text]);

  if (game === null) return null;

  const onCopy = (): void => {
    void copyText(text).then((ok) => {
      setCopied(ok);
      setFailure(ok ? null : 'copy');
      if (ok) setTimeout(() => setCopied(false), 1600);
    });
  };

  const onPng = (): void => {
    void drawPng(text, game.seed).then((blob) => {
      if (blob === null) {
        setFailure('png');
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tichy-host-${game.seed}.png`;
      link.click();
      URL.revokeObjectURL(url);
      setFailure(null);
    });
  };

  return (
    <>
      <h1 className="h2" style={{ margin: '6px 0 0' }}>
        {t('chronicle.title')}
      </h1>

      <div className="card" style={{ marginTop: 14, padding: '18px 16px' }}>
        {/* Selectable on purpose: if both copy routes fail, the player can still
            drag over it. A receipt you cannot take with you is not a receipt. */}
        <pre
          className="mono"
          style={{
            margin: 0,
            whiteSpace: 'pre-wrap',
            fontSize: 'var(--fs-body)',
            lineHeight: 1.6,
            color: 'var(--ink)',
            userSelect: 'text',
          }}
        >
          {text}
        </pre>
      </div>

      {failure === null ? null : (
        <p className="bad" style={{ fontSize: 'var(--fs-small)', marginTop: 12 }} role="alert">
          {failure === 'copy' ? t('chronicle.copyFailed') : t('chronicle.pngFailed')}
        </p>
      )}

      <div className="dock">
        <button type="button" className="btn-ghost" onClick={onPng}>
          {t('chronicle.png')}
        </button>
        <button type="button" className="cta" onClick={onCopy}>
          {copied ? t('chronicle.copied') : t('chronicle.copy')}
        </button>
        <button type="button" className="btn-ghost" onClick={() => goto('verdict')}>
          {t('chronicle.back')}
        </button>
      </div>
    </>
  );
}
