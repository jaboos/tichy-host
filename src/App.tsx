import { useEffect } from 'react';

import { t } from './i18n';
import { useGame } from './store/gameStore';
import { setContextProvider, startTelemetry } from './telemetry/events';
import { startClock } from './telemetry/session';
import Feedback, { openFeedback } from './components/Feedback';
import TabBar from './components/TabBar';
import Tour, { openTour } from './components/Tour';
import Brigade from './screens/Brigade';
import Calendar from './screens/Calendar';
import Chronicle from './screens/Chronicle';
import Consequence from './screens/Consequence';
import CookCard from './screens/CookCard';
import Menu from './screens/Menu';
import MondayPlan from './screens/MondayPlan';
import Onboarding from './screens/Onboarding';
import Pas from './screens/Pas';
import ReportCard from './screens/ReportCard';
import Service from './screens/Service';
import Verdict from './screens/Verdict';

/** Screens where the tab bar would be a way to walk out of a decision. */
const WITHOUT_TABS = new Set([
  'onboarding',
  'service',
  'consequence',
  'monday',
  'report',
  'chronicle',
  'verdict',
]);

/**
 * The tab bar is the only thing left that is `position: fixed`, so it is the only
 * height anyone has to know. The bottom dock is sticky and in the flow, which is
 * what killed the old measured CTA height — that number was a guess, and it was
 * wrong the moment a dock grew a second button.
 */
const NAV_HEIGHT = 56;

/**
 * The shell. CLAUDE.md rule 9: no component holds a literal — every string here
 * and below goes through `t()`, and `tests/i18n.test.ts` fails the build if one
 * slips in.
 */
export default function App(): React.JSX.Element {
  const screen = useGame((s) => s.screen);
  const boot = useGame((s) => s.boot);
  const lang = useGame((s) => s.lang);
  const setLang = useGame((s) => s.setLang);
  const goto = useGame((s) => s.goto);

  // Restoring a save is a side effect and belongs here, not in the engine.
  useEffect(() => {
    boot();
  }, [boot]);

  // The play clock and the click watchers. Both read wall time and the DOM, so
  // neither could live in the engine; both are no-ops unless telemetry is on.
  useEffect(() => {
    setContextProvider(() => {
      const state = useGame.getState();
      return {
        seed: state.game?.seed ?? null,
        eveningIndex: state.game?.eveningIndex ?? null,
        screen: state.screen,
        lang: state.lang,
      };
    });
    const stopClock = startClock(() => useGame.getState().game !== null);
    const stopTelemetry = startTelemetry();
    return () => {
      stopClock();
      stopTelemetry();
    };
  }, []);

  const body = (): React.JSX.Element | null => {
    switch (screen) {
      case 'onboarding':
        return <Onboarding />;
      case 'pas':
        return <Pas />;
      case 'service':
        return <Service />;
      case 'consequence':
        return <Consequence />;
      case 'monday':
        return <MondayPlan />;
      case 'menu':
        return <Menu />;
      case 'calendar':
        return <Calendar />;
      case 'brigade':
        return <Brigade />;
      case 'cook':
        return <CookCard />;
      case 'chronicle':
        return <Chronicle />;
      case 'report':
        return <ReportCard />;
      case 'verdict':
        return <Verdict />;
      default:
        return null;
    }
  };

  const bottom = {
    '--bottom-nav': `${WITHOUT_TABS.has(screen) ? 0 : NAV_HEIGHT}px`,
  } as React.CSSProperties;

  return (
    <main className="frame" style={bottom}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
        {WITHOUT_TABS.has(screen) ? null : (
          <button
            type="button"
            className="chip"
            data-track="header-tour"
            onClick={() => {
              // The tutorial teaches the Pas, so it goes there first. It used to
              // render only on the Pas while the chip sat on every screen — a
              // dead click on `consequence` is how that surfaced.
              goto('pas');
              openTour();
            }}
          >
            {t('tour.replay')}
          </button>
        )}
        <button type="button" className="chip" data-track="header-feedback" onClick={openFeedback}>
          {t('fb.header')}
        </button>
        <button
          type="button"
          className="chip"
          onClick={() => setLang(lang === 'cs' ? 'en' : 'cs')}
          lang={lang === 'cs' ? 'en' : 'cs'}
        >
          {lang === 'cs' ? t('lang.switch') : t('lang.switchBack')}
        </button>
      </div>
      {body()}
      {WITHOUT_TABS.has(screen) ? null : <TabBar />}
      <Tour />
      <Feedback />
    </main>
  );
}
