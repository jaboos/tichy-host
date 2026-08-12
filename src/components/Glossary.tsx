/**
 * A round `?` beside a term, opening one sentence that says what it is.
 *
 * The game teaches twelve concepts (v4 §14) and until now taught none of them:
 * `laťka`, `přetížení` and `podezření` were on screen as bare numbers. Each entry
 * defines the term AND corrects the misreading it invites — the bar is not your
 * score, wear is not mood, overload is a fence and not a scale. A definition that
 * only restates the label teaches nothing.
 */
import { useState } from 'react';

import { t } from '../i18n';
import type { TKey } from '../i18n';

export type Concept =
  | 'latka'
  | 'kvalita'
  | 'ruka'
  | 'domov'
  | 'opotrebeni'
  | 'narocnost'
  | 'pretizeni'
  | 'souhra'
  | 'podezreni'
  | 'pritlacit'
  | 'premiove'
  | 'chteni'
  | 'hotovost';

const ENTRY: Record<Concept, { term: TKey; body: TKey }> = {
  latka: { term: 'gloss.latka.term', body: 'gloss.latka.body' },
  kvalita: { term: 'gloss.kvalita.term', body: 'gloss.kvalita.body' },
  ruka: { term: 'gloss.ruka.term', body: 'gloss.ruka.body' },
  domov: { term: 'gloss.domov.term', body: 'gloss.domov.body' },
  opotrebeni: { term: 'gloss.opotrebeni.term', body: 'gloss.opotrebeni.body' },
  narocnost: { term: 'gloss.narocnost.term', body: 'gloss.narocnost.body' },
  pretizeni: { term: 'gloss.pretizeni.term', body: 'gloss.pretizeni.body' },
  souhra: { term: 'gloss.souhra.term', body: 'gloss.souhra.body' },
  podezreni: { term: 'gloss.podezreni.term', body: 'gloss.podezreni.body' },
  pritlacit: { term: 'gloss.pritlacit.term', body: 'gloss.pritlacit.body' },
  premiove: { term: 'gloss.premiove.term', body: 'gloss.premiove.body' },
  chteni: { term: 'gloss.chteni.term', body: 'gloss.chteni.body' },
  hotovost: { term: 'gloss.hotovost.term', body: 'gloss.hotovost.body' },
};

export const CONCEPTS = Object.keys(ENTRY) as Concept[];
export const conceptKeys = (concept: Concept): { term: TKey; body: TKey } => ENTRY[concept];

export default function Glossary({ of }: { of: Concept }): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const entry = ENTRY[of];

  return (
    <>
      {/* 20 px of ink in a 48 px target: `.hit` pulls the extra height back out of
          the flow, so the glyph stays small without being un-tappable. */}
      <button
        type="button"
        className="hit"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={`${t(entry.term)} — ${t('gloss.open')}`}
        style={{ width: 30, flex: '0 0 auto' }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 20,
            height: 20,
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--brass-a55)',
            color: 'var(--brass)',
            fontSize: 'var(--fs-micro)',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ?
        </span>
      </button>

      {open ? (
        <div
          className="card"
          style={{ padding: '9px 11px', marginTop: 6, borderColor: 'var(--brass-a35)' }}
          role="note"
        >
          <div className="label">{t(entry.term)}</div>
          <p className="quote" style={{ marginTop: 4, fontSize: 'var(--fs-small)' }}>
            {t(entry.body)}
          </p>
        </div>
      ) : null}
    </>
  );
}
