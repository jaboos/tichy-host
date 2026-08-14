/**
 * The two POSTs. No SDK.
 *
 * `@supabase/supabase-js` is over 40 kB gzipped and all this needs is a pair of
 * inserts against PostgREST, so it is a plain `fetch` with three headers. The
 * game's whole bundle is 88 kB; a client library for two endpoints would have
 * been half the game again.
 *
 * Nothing here rejects into the caller. A failed insert must not surface to
 * somebody trying to run a kitchen — the worst acceptable outcome of a telemetry
 * outage is that we learn nothing, never that the game shows an error. That is a
 * deliberate swallow, not an oversight, which is why every event send is
 * fire-and-forget and only the form's own send reports back.
 */
import { APP_VERSION, SUPABASE_KEY, SUPABASE_URL, isEnabled } from './config';

const HEADERS: Record<string, string> = {
  apikey: SUPABASE_KEY,
  'Content-Type': 'application/json',
  // Without this PostgREST echoes the inserted rows back, which RLS then has to
  // refuse — a 401 on a write that actually succeeded. Ask for nothing instead.
  Prefer: 'return=minimal',
};

export interface EventRow {
  session_id: string;
  name: string;
  target?: string | null;
  value?: number | null;
  seed?: string | null;
  evening_index?: number | null;
  screen?: string | null;
  lang?: string | null;
  app_version?: string;
}

export interface FeedbackRow {
  seed: string | null;
  evening_index: number | null;
  season_number: number | null;
  lang: string;
  minutes_played: number | null;
  stars: number | null;
  reputation: number | null;
  finished: boolean | null;
  screen: string | null;
  trigger: string | null;
  app_version?: string;
  q_stopped: string | null;
  q_bar: string | null;
  q_verdict: string | null;
  q_push: string | null;
  q_open: string | null;
}

export function postEvents(rows: readonly EventRow[]): void {
  if (rows.length === 0 || !isEnabled()) return;
  const stamped = rows.map((row) => ({ ...row, app_version: APP_VERSION }));

  // On the way out of a page `fetch` is cancelled mid-flight; sendBeacon is the
  // only thing a browser promises to finish. It cannot set headers, so the key
  // rides as a query parameter, which PostgREST accepts.
  if (typeof navigator.sendBeacon === 'function' && document.visibilityState === 'hidden') {
    const url = `${SUPABASE_URL}/events?apikey=${encodeURIComponent(SUPABASE_KEY)}`;
    const blob = new Blob([JSON.stringify(stamped)], { type: 'application/json' });
    if (navigator.sendBeacon(url, blob)) return;
  }

  void fetch(`${SUPABASE_URL}/events`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(stamped),
    keepalive: true,
  }).then(
    () => undefined,
    () => undefined,
  );
}

/**
 * The one send whose outcome the caller needs, because the form has to tell the
 * player whether it arrived. Resolves false rather than throwing.
 */
export async function postFeedback(row: FeedbackRow): Promise<boolean> {
  if (!isEnabled()) return true;
  try {
    const response = await fetch(`${SUPABASE_URL}/feedback`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify([{ ...row, app_version: APP_VERSION }]),
    });
    return response.ok;
  } catch {
    return false;
  }
}
