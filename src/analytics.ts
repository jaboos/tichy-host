/**
 * Vercel Web Analytics, for the game and both landing pages.
 *
 * `inject()` rather than the `<Analytics />` React component on purpose: the
 * component exists to report route changes, and this game has no router — every
 * screen lives at the same URL under Zustand state. One injection covers it, and
 * the same call then works for the two plain-HTML landings, so there is one
 * integration here instead of two.
 *
 * What it collects is a page view and a referrer. No cookies, no identifiers, no
 * personal data — which is why this needs no consent banner. Anything a player
 * actually says about the game arrives through the feedback form instead, which
 * they open deliberately.
 */
import { inject } from '@vercel/analytics';

/** Loopback in every shape a browser reports it. */
const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/;

/**
 * Vercel serves `/_vercel/insights/script.js` only from a deployment. On a dev
 * or `vite preview` server that path is a 404, and a 404 in the console on every
 * load is the kind of noise that trains you to stop reading the console.
 */
export function startAnalytics(): void {
  if (typeof window === 'undefined') return;
  if (LOCAL.test(window.location.hostname)) return;
  inject();
}
