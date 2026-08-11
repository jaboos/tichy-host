/**
 * The menu card. PRD §3.6 FR-8.
 *
 * Course names in the display face, every number in mono. The footer carries what
 * the choice actually costs: food cost, the four station loads, and the effect of
 * ambition on the bar — the three things that make a menu a decision rather than
 * a shopping list.
 */
import { useState } from 'react';

import { C } from '../engine/constants';
import { computeBarBreakdown } from '../engine/bar';
import { computeHarmony, buildStationSetup, meanHarmony } from '../engine/plate';
import { foodCostRate } from '../engine/economy';
import { autoAssign, weekIndexOf } from '../engine/season';
import { STATIONS } from '../engine/types';
import { formatNumber, formatSigned, t } from '../i18n';
import { useGame } from '../store/gameStore';
import BrassDivider from '../components/BrassDivider';

export default function Menu(): React.JSX.Element | null {
  const game = useGame((s) => s.game);
  const setMenu = useGame((s) => s.setMenu);
  const refusal = useGame((s) => s.refusal);
  const goto = useGame((s) => s.goto);
  const [ids, setIds] = useState<string[] | null>(null);

  if (game === null) return null;
  const selected = ids ?? game.menu;
  const byId = new Map(game.catalogue.map((course) => [course.id, course]));
  const courses = selected.flatMap((id) => {
    const course = byId.get(id);
    return course === undefined ? [] : [course];
  });

  const weekIndex = weekIndexOf(game.eveningIndex);
  const breakdown = computeBarBreakdown(courses, weekIndex, game.reputation, game.seasonNumber);
  const harmony = computeHarmony(courses);
  const assignment = autoAssign(game.cooks, []);
  const cooksById = new Map(game.cooks.map((c) => [c.id, c]));

  const toggle = (courseId: string): void => {
    const next = selected.includes(courseId)
      ? selected.filter((id) => id !== courseId)
      : [...selected, courseId];
    setIds(next);
  };

  return (
    <>
      <h1 className="display" style={{ fontSize: 'var(--fs-h2)', margin: 0 }}>
        {t('menu.title')}
      </h1>
      <p className="quote" style={{ marginTop: 4, fontSize: 'var(--fs-small)' }}>
        {t('menu.cost', { penalty: formatNumber(C.plate.trialEveningPenalty, 1) })}
      </p>

      <div className="label" style={{ marginTop: 12 }}>
        {t('menu.inMenu')} · {courses.length}/{C.menu.courses}
      </div>
      <div className="stack" style={{ marginTop: 8, gap: 4 }}>
        {courses.map((course, index) => (
          <button
            key={course.id}
            type="button"
            className="card tap"
            style={{ padding: '8px 10px', textAlign: 'left' }}
            onClick={() => toggle(course.id)}
          >
            <div className="spread" style={{ width: '100%' }}>
              <span className="display" style={{ fontSize: 'var(--fs-dish)' }}>
                {t(course.nameKey)}
              </span>
              <span className="row" style={{ gap: 6 }}>
                <span className="chip">{t(`station.${course.station}`)}</span>
                <span className="mono muted" style={{ fontSize: 'var(--fs-small)' }}>
                  {course.difficulty}
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: 'var(--fs-small)',
                    color: (harmony[index] ?? 0) < 0 ? 'var(--bad)' : 'var(--ok)',
                  }}
                >
                  {formatSigned(harmony[index] ?? 0, 1)}
                </span>
              </span>
            </div>
          </button>
        ))}
      </div>

      <BrassDivider />
      <div className="label">{t('menu.available')}</div>
      <div className="row" style={{ marginTop: 8, flexWrap: 'wrap', gap: 6 }}>
        {game.catalogue
          .filter((course) => !selected.includes(course.id))
          .map((course) => (
            <button
              key={course.id}
              type="button"
              className="chip tap"
              onClick={() => toggle(course.id)}
            >
              {t(course.nameKey)} · {course.difficulty}
            </button>
          ))}
      </div>

      <BrassDivider />
      <div className="card">
        <div className="spread">
          <span className="label">{t('menu.ambition')}</span>
          <span className="mono">{formatSigned(breakdown.ambition, 1)}</span>
        </div>
        <div className="spread" style={{ marginTop: 6 }}>
          <span className="label">{t('menu.harmony')}</span>
          <span className="mono">
            {formatNumber(meanHarmony(courses), 2)} → {formatSigned(breakdown.harmony, 1)}
          </span>
        </div>
        <div className="spread" style={{ marginTop: 6 }}>
          <span className="label">{t('menu.foodCost')}</span>
          <span className="mono">
            {formatNumber(100 * foodCostRate(courses, game.weekPlan.premiumIngredients), 1)}%
          </span>
        </div>
        <div className="spread" style={{ marginTop: 6 }}>
          <span className="label">{t('bar.total')}</span>
          <span className="mono brass">{formatNumber(breakdown.total, 1)}</span>
        </div>

        <div className="row" style={{ marginTop: 10, gap: 6 }}>
          {STATIONS.map((station) => {
            const setup = buildStationSetup(
              station,
              courses,
              cooksById.get(assignment.leads[station] ?? '') ?? null,
              cooksById.get(assignment.helpers[station] ?? '') ?? null,
            );
            const ratio = setup.capacity > 0 ? setup.load / setup.capacity : 2;
            return (
              <span
                key={station}
                className={
                  ratio > 1 ? 'chip chip--bad' : ratio > 0.8 ? 'chip chip--warn' : 'chip chip--ok'
                }
              >
                {t(`station.${station}`)} {formatNumber(setup.load, 0)}
              </span>
            );
          })}
        </div>
      </div>

      {refusal !== null ? (
        <p className="bad" style={{ fontSize: 'var(--fs-small)', marginTop: 10 }} role="alert">
          {t(refusal)}
        </p>
      ) : null}

      <button
        type="button"
        className="cta tap"
        onClick={() => {
          setMenu(selected);
          if (selected.length === C.menu.courses) goto('pas');
        }}
      >
        {t('menu.save')}
      </button>
    </>
  );
}
