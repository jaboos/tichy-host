import { t } from './i18n';

/**
 * Phase 1 shell. Screens arrive in Phase 3 (PRD §7).
 *
 * CLAUDE.md rule 9: every user-visible string goes through `t()` from day one.
 * `tests/i18n.test.ts` fails if a Czech literal ever appears in a .tsx file.
 */
export default function App(): React.JSX.Element {
  return (
    <main>
      <h1>{t('app.title')}</h1>
      <p>{t('app.tagline')}</p>
    </main>
  );
}
