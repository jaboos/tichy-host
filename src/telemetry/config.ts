/**
 * Where the feedback and the events go.
 *
 * The key below is Supabase's *publishable* key. It is meant to ship inside
 * every player's browser and it is not a secret — the security boundary is row
 * level security on the two tables, which allow `insert` and nothing else.
 * Verified from outside before any of this was written: insert returns 201,
 * select and delete both return 401, and a value outside the allowed vocabulary
 * is rejected by a check constraint with 400.
 *
 * Hardcoded rather than read from an env var on purpose. A public key in an env
 * var buys no secrecy, costs a Vercel setting that can silently go missing, and
 * would leave the form quietly dead on a preview deployment.
 */
export const SUPABASE_URL = 'https://ypdmwdgsgsgzbuwnuepv.supabase.co/rest/v1';
export const SUPABASE_KEY = 'sb_publishable_K_gfuMSl57g45KmTMBcxYg_MVH5CY5c';

declare const __BUILD__: string;

/** Build date, so a finding can be tied to the deploy it came from. */
export const APP_VERSION: string = typeof __BUILD__ === 'string' ? __BUILD__ : 'dev';

const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/;

/**
 * Off on localhost, because a developer clicking around all day would otherwise
 * be the loudest player in the table. `?telemetry=1` turns it on anyway, which
 * is how the pipe gets tested end to end without polluting real findings.
 */
export function isEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  if (!LOCAL.test(window.location.hostname)) return true;
  return new URLSearchParams(window.location.search).get('telemetry') === '1';
}
