/**
 * The ask, and the five questions behind it. No PRD section covers this — it is
 * playtest instrumentation, not a thirteenth concept, and it leaves no trace in
 * the save or in the simulation.
 *
 * When it appears: five minutes of *active* play, then fifteen, then never
 * again; twice in the life of a browser at most, and "not now" buys a day of
 * silence. Also on exit intent — the pointer leaving through the top of the
 * window — and on returning to a tab that was left open.
 *
 * What it deliberately does NOT do is hook `beforeunload`. A browser will not
 * let a page draw its own dialog there. All it can offer is the generic "Leave
 * site? Changes you made may not be saved", which cannot be reworded, would be
 * a lie in a game that saves every evening, and reads as malware. Exit intent
 * catches the same moment honestly.
 *
 * Nothing here subscribes to the store. Every field it needs is read inside a
 * callback, so subscribing would re-render an invisible modal on every tick of
 * the game — and reading at call time is fresher anyway.
 */
import { useCallback, useEffect, useState } from 'react';

import { type TKey, t } from '../i18n';
import { useGame } from '../store/gameStore';
import { tourIsRunning } from './Tour';
import { postFeedback } from '../telemetry/client';
import { trackEvent } from '../telemetry/events';
import {
  notePromptShown,
  playedMs,
  promptIsDue,
  silencePrompt,
  snoozePrompt,
} from '../telemetry/session';

type Phase = 'quiet' | 'asking' | 'form' | 'sent' | 'failed';

/** The option values are exactly what the Postgres check constraints allow. */
const QUESTIONS = [
  { id: 'q_stopped', key: 'fb.q1', options: ['finished', 'bored', 'stuck', 'broken', 'no_time'] },
  { id: 'q_bar', key: 'fb.q2', options: ['used', 'saw', 'never', 'unseen'] },
  {
    id: 'q_verdict',
    key: 'fb.q3',
    options: ['expected', 'better', 'worse', 'coinflip', 'not_far'],
  },
  { id: 'q_push', key: 'fb.q4', options: ['deliberate', 'curious', 'saw', 'unknown'] },
] as const;

const OPEN_MAX = 2000;
const ASK_POLL_MS = 20000;

/** Dispatch this on `window` to open the form from anywhere. */
export const OPEN_EVENT = 'feedback:open';

export function openFeedback(): void {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/**
 * Opened straight from a landing page. Read once, lazily, at first render —
 * the query string cannot change under us, so deriving it in an effect would
 * only buy a frame of the wrong thing on screen.
 */
function openedByLink(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('feedback') === '1';
}

export default function Feedback(): React.JSX.Element | null {
  const [phase, setPhase] = useState<Phase>(() => (openedByLink() ? 'form' : 'quiet'));
  const [trigger, setTrigger] = useState(() => (openedByLink() ? 'link' : 'timer'));
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [open, setOpen] = useState('');

  const ask = useCallback((why: string) => {
    // Never over the reveal. An evening playing back is the one moment the game
    // has undivided attention, and interrupting it takes exactly the wrong thing.
    if (useGame.getState().screen === 'service') return;
    // The tutorial owns the screen while it runs. Walking it is still play, so
    // the clock reaches five minutes mid-bubble and both dialogs would show.
    if (tourIsRunning()) return;
    if (!promptIsDue()) return;
    setPhase((current) => {
      if (current !== 'quiet') return current;
      setTrigger(why);
      notePromptShown();
      trackEvent('feedback_prompt_shown', why);
      return 'asking';
    });
  }, []);

  // The button in the header. A one-way command rather than shared state: the
  // store would have to hold this modal's phase to express it, and syncing an
  // external boolean into local phase is the set-state-in-an-effect that eslint
  // rightly complains about.
  useEffect(() => {
    const openNow = (): void => setPhase('form');
    window.addEventListener(OPEN_EVENT, openNow);
    return () => window.removeEventListener(OPEN_EVENT, openNow);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => ask('timer'), ASK_POLL_MS);

    // Exit intent: the pointer leaving through the top edge, towards the tab
    // strip or the address bar. Only meaningful where there is a real pointer.
    const onOut = (event: MouseEvent): void => {
      if (event.clientY <= 0 && event.relatedTarget === null) ask('exit_intent');
    };
    const onReturn = (): void => {
      if (document.visibilityState === 'visible') ask('returned');
    };

    const fine = window.matchMedia('(pointer: fine)').matches;
    if (fine) document.addEventListener('mouseout', onOut);
    document.addEventListener('visibilitychange', onReturn);

    return () => {
      window.clearInterval(timer);
      if (fine) document.removeEventListener('mouseout', onOut);
      document.removeEventListener('visibilitychange', onReturn);
    };
  }, [ask]);

  const decline = (): void => {
    snoozePrompt();
    trackEvent('feedback_prompt_declined', trigger);
    setPhase('quiet');
  };

  const send = async (): Promise<void> => {
    const { game, screen, lang } = useGame.getState();
    const ok = await postFeedback({
      seed: game?.seed ?? null,
      evening_index: game?.eveningIndex ?? null,
      season_number: game?.seasonNumber ?? null,
      lang,
      minutes_played: Math.round(playedMs() / 60000),
      stars: game?.stars ?? null,
      reputation: game === null ? null : Math.round(game.reputation),
      finished: game === null ? null : game.eveningIndex >= game.history.length,
      screen,
      trigger,
      q_stopped: answers['q_stopped'] ?? null,
      q_bar: answers['q_bar'] ?? null,
      q_verdict: answers['q_verdict'] ?? null,
      q_push: answers['q_push'] ?? null,
      q_open: open.trim() === '' ? null : open.trim().slice(0, OPEN_MAX),
    });
    if (ok) silencePrompt();
    setPhase(ok ? 'sent' : 'failed');
  };

  if (phase === 'quiet') return null;

  if (phase === 'asking') {
    return (
      <div className="sheet" role="dialog" aria-modal="true" aria-label={t('fb.prompt.title')}>
        <div className="sheet__panel">
          <h2 className="h2">{t('fb.prompt.title')}</h2>
          <p className="sheet__lede">{t('fb.prompt.body')}</p>
          <div className="sheet__row">
            <button
              type="button"
              className="cta"
              data-track="fb-accept"
              onClick={() => setPhase('form')}
            >
              {t('fb.prompt.yes')}
            </button>
            <button type="button" className="btn-ghost" data-track="fb-decline" onClick={decline}>
              {t('fb.prompt.no')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'sent' || phase === 'failed') {
    const failed = phase === 'failed';
    return (
      <div className="sheet" role="dialog" aria-modal="true" aria-label={t('fb.title')}>
        <div className="sheet__panel">
          <p className="sheet__lede">{failed ? t('fb.failed') : t('fb.thanks')}</p>
          <div className="sheet__row">
            {failed ? (
              <button type="button" className="cta" onClick={() => void send()}>
                {t('fb.submit')}
              </button>
            ) : null}
            <button type="button" className="btn-ghost" onClick={() => setPhase('quiet')}>
              {t('fb.close')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label={t('fb.title')}>
      <div className="sheet__panel sheet__panel--tall">
        <h2 className="h2">{t('fb.title')}</h2>
        <p className="sheet__lede">{t('fb.intro')}</p>

        {QUESTIONS.map((question) => (
          <fieldset className="ask-q" key={question.id}>
            <legend>{t(question.key)}</legend>
            {question.options.map((option) => {
              const chosen = answers[question.id] === option;
              return (
                <button
                  key={option}
                  type="button"
                  className={`ask-opt${chosen ? ' is-on' : ''}`}
                  aria-pressed={chosen}
                  data-track={`fb-${question.id}-${option}`}
                  onClick={() =>
                    setAnswers((prev) => ({
                      ...prev,
                      [question.id]: prev[question.id] === option ? '' : option,
                    }))
                  }
                >
                  {t(`${question.key}.${option}` as TKey)}
                </button>
              );
            })}
          </fieldset>
        ))}

        <fieldset className="ask-q">
          <legend>{t('fb.q5')}</legend>
          <textarea
            className="ask-open"
            rows={3}
            maxLength={OPEN_MAX}
            placeholder={t('fb.q5.placeholder')}
            value={open}
            onChange={(event) => setOpen(event.target.value)}
          />
        </fieldset>

        <p className="ask-privacy">{t('fb.privacy')}</p>

        <div className="sheet__row">
          <button type="button" className="cta" data-track="fb-send" onClick={() => void send()}>
            {t('fb.submit')}
          </button>
          <button type="button" className="btn-ghost" onClick={decline}>
            {t('fb.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
