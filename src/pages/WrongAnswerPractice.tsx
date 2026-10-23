import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ModeInfoButton from '../components/ModeInfoButton';
import QuizRunner from '../components/QuizRunner';
import { courseLabel, getCourse, loadWeek } from '../lib/courses';
import { buildAttempt } from '../lib/shuffle';
import { QUIZ_MODE_LABELS, QUIZ_MODES, type Question, type QuizMode } from '../lib/types';
import { useTitle } from '../lib/useTitle';
import {
  clearAllWrongAnswers,
  clearWrongAnswer,
  getWrongQuestions,
  type WrongEntry,
} from '../lib/wrongAnswers';
import NotFound from './NotFound';

/** Drills every question in this course that's ever been answered wrong in Rapid Fire or
 * Mock Test mode, pulled from across all weeks. Answering one right here clears it from the
 * list; getting it right elsewhere doesn't (see wrongAnswers.ts). */
export default function WrongAnswerPractice() {
  const { courseId } = useParams();
  const course = getCourse(courseId);

  const [entries, setEntries] = useState<WrongEntry[] | null>(null);
  const [pool, setPool] = useState<Question[] | null | undefined>(undefined); // undefined = loading, null = failed
  const [mode, setMode] = useState<QuizMode>('quiz');
  const [randomizeQuestions, setRandomizeQuestions] = useState(true);
  const [randomizeOptions, setRandomizeOptions] = useState(false);
  const [started, setStarted] = useState(false);

  useTitle(course ? `Wrong answer practice · ${course.name}` : '');

  useEffect(() => {
    if (!course) return;
    let cancelled = false;
    setPool(undefined);
    setStarted(false);

    const wrongEntries = getWrongQuestions(course.id);
    setEntries(wrongEntries);
    if (wrongEntries.length === 0) {
      setPool([]);
      return;
    }

    const wantedByWeek = new Map<number, Set<number>>();
    for (const e of wrongEntries) {
      if (!wantedByWeek.has(e.weekNumber)) wantedByWeek.set(e.weekNumber, new Set());
      wantedByWeek.get(e.weekNumber)!.add(e.questionId);
    }

    Promise.all([...wantedByWeek.keys()].map((n) => loadWeek(course.id, n)))
      .then((weeks) => {
        if (cancelled) return;
        const merged: Question[] = [];
        for (const week of weeks) {
          if (!week) continue;
          const wanted = wantedByWeek.get(week.number);
          if (!wanted) continue;
          for (const q of week.questions) {
            if (!wanted.has(q.id)) continue;
            merged.push({
              ...q,
              id: week.number * 1000 + q.id,
              originalId: q.id,
              sourceWeek: week.number,
            });
          }
        }
        setPool(merged);
      })
      .catch(() => {
        if (!cancelled) setPool(null);
      });
    return () => {
      cancelled = true;
    };
  }, [course]);

  // The question set still actually wrong right now. `pool` stays fixed for the page's
  // lifetime (reloaded questions aren't worth re-fetching mid-session), but `entries` tracks
  // every clear from this session — so a restart ("New shuffle") draws only from what's
  // still unresolved, instead of resurrecting questions already answered correctly here.
  function remainingPool(): Question[] {
    if (!pool) return [];
    const wanted = new Set((entries ?? []).map((e) => `${e.weekNumber}:${e.questionId}`));
    return pool.filter((q) => wanted.has(`${q.sourceWeek}:${q.originalId}`));
  }

  function handleCorrect(weekNumber: number, questionId: number) {
    if (!course) return;
    clearWrongAnswer(course.id, weekNumber, questionId);
    setEntries(getWrongQuestions(course.id));
  }

  function clearAll() {
    if (!course) return;
    if (!window.confirm('Clear every wrong answer recorded for this course? This cannot be undone.')) {
      return;
    }
    clearAllWrongAnswers(course.id);
    setEntries([]);
    setPool([]);
    setStarted(false);
  }

  if (!course) return <NotFound what="course" />;

  return (
    <div className="prose">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">Courses</Link>
        <span aria-hidden="true"> / </span>
        <Link to={`/c/${course.id}`}>{courseLabel(course)}</Link>
      </nav>
      <h1>Wrong answer practice</h1>
      <p className="lede">
        Every question you've gotten wrong in Rapid Fire or Mock Test mode for this course,
        pulled from across all weeks. Answer one correctly here and it's cleared from this list.
      </p>
      <p className="muted">
        Stored only in this browser's local storage — it won't show up on another device, and
        it's gone if your browser data is cleared.
      </p>

      {pool === undefined && <p className="muted">Loading…</p>}
      {pool === null && <p className="empty">Couldn't load your wrong answers. Try reloading.</p>}
      {pool && pool.length === 0 && (
        <p className="empty">
          {entries && entries.length > 0
            ? "Couldn't find these questions anymore — course content may have changed."
            : "No wrong answers yet — they'll show up here after a Rapid Fire or Mock Test attempt."}
        </p>
      )}

      {pool && pool.length > 0 && !started && (
        <>
          <p>
            {pool.length} {pool.length === 1 ? 'question' : 'questions'} to practice.
          </p>
          <div className="mode-select-row">
            <fieldset className="mode-segmented">
              <legend className="sr-only">Quiz mode</legend>
              {QUIZ_MODES.map((m) => (
                <label key={m} className="mode-segment">
                  <input
                    type="radio"
                    name="wrong-mode"
                    value={m}
                    checked={mode === m}
                    onChange={() => setMode(m)}
                  />
                  {QUIZ_MODE_LABELS[m]}
                </label>
              ))}
            </fieldset>
            <ModeInfoButton />
          </div>
          <div className="switch-row">
            <label className="switch">
              <input
                type="checkbox"
                checked={randomizeQuestions}
                onChange={(e) => setRandomizeQuestions(e.target.checked)}
              />
              <span className="switch-track" aria-hidden="true">
                <span className="switch-thumb" />
              </span>
              Shuffle question order
            </label>
            <label className="switch">
              <input
                type="checkbox"
                checked={randomizeOptions}
                onChange={(e) => setRandomizeOptions(e.target.checked)}
              />
              <span className="switch-track" aria-hidden="true">
                <span className="switch-thumb" />
              </span>
              Shuffle answer order
            </label>
          </div>
          <div className="actions">
            <button type="button" className="btn primary" onClick={() => setStarted(true)}>
              Start practicing
            </button>
            <button type="button" className="btn" onClick={clearAll}>
              Clear all wrong answers
            </button>
          </div>
        </>
      )}

      {pool && pool.length > 0 && started && (
        <QuizRunner
          key={`${course.id}/wrong/${mode}/${randomizeQuestions}/${randomizeOptions}/${pool.length}`}
          courseId={course.id}
          mode={mode}
          initialQuestions={buildAttempt(pool, { randomizeQuestions, randomizeOptions })}
          makeAttempt={() => buildAttempt(remainingPool(), { randomizeQuestions, randomizeOptions })}
          onCorrectAnswer={handleCorrect}
          restartLabel="New shuffle"
          backTo={
            <Link to={`/c/${course.id}`} className="btn">
              Back to {course.name}
            </Link>
          }
        />
      )}
    </div>
  );
}
