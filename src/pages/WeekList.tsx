import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ModeInfoButton from '../components/ModeInfoButton';
import { courseLabel, getCourse, loadWeek } from '../lib/courses';
import { QUIZ_MODE_LABELS, QUIZ_MODES, type QuizMode, type Week } from '../lib/types';
import { useTitle } from '../lib/useTitle';
import NotFound from './NotFound';

export default function WeekList() {
  const { courseId } = useParams();
  const course = getCourse(courseId);
  const navigate = useNavigate();
  const [weeks, setWeeks] = useState<Week[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [mode, setMode] = useState<QuizMode>('quiz');

  useTitle(course?.name ?? '');

  useEffect(() => {
    if (!course) return;
    let cancelled = false;
    setWeeks(null);
    setFailed(false);
    setSelected([]);
    Promise.all(course.weekNumbers.map((n) => loadWeek(course.id, n)))
      .then((loaded) => {
        if (!cancelled) setWeeks(loaded.filter((w): w is Week => w !== null));
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [course]);

  const selectedQuestionCount = useMemo(
    () =>
      (weeks ?? [])
        .filter((w) => selected.includes(w.number))
        .reduce((sum, w) => sum + w.questions.length, 0),
    [weeks, selected],
  );

  function toggleWeek(number: number) {
    setSelected((prev) =>
      prev.includes(number) ? prev.filter((n) => n !== number) : [...prev, number],
    );
  }

  function generateQuiz() {
    if (!course || selected.length === 0) return;
    const sorted = [...selected].sort((a, b) => a - b);
    // A single selected week is just that week's normal quiz (keeps its own progress
    // history and question order); two or more go through the merged/shuffled mixed quiz.
    const target =
      sorted.length === 1
        ? `/c/${course.id}/w/${sorted[0]}`
        : `/c/${course.id}/mixed?weeks=${sorted.join(',')}`;
    navigate(`${target}${target.includes('?') ? '&' : '?'}mode=${mode}`);
  }

  // Measure the actual bar height (it can wrap onto extra lines on narrow screens) so the
  // spacer below the grid always reserves exactly enough room, never too little or too much.
  const barRef = useRef<HTMLDivElement>(null);
  const [barHeight, setBarHeight] = useState(0);
  useEffect(() => {
    const el = barRef.current;
    if (!el) {
      setBarHeight(0);
      return;
    }
    const update = () => setBarHeight(el.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [selected.length]);

  if (!course) return <NotFound what="course" />;

  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">Courses</Link>
      </nav>
      <h1>{courseLabel(course)}</h1>
      <p className="lede">{course.code} · select one or more weeks, then generate a quiz.</p>

      {failed && <p className="empty">Couldn't load the weeks for this course. Try reloading.</p>}
      {!failed && weeks === null && <p className="muted">Loading weeks…</p>}
      {weeks !== null && weeks.length === 0 && <p className="empty">No weeks in this course yet.</p>}

      {weeks !== null && weeks.length > 0 && (
        <>
          <ul className="week-grid">
            {weeks.map((week) => {
              const isSelected = selected.includes(week.number);
              return (
                <li key={week.number}>
                  <div
                    className={`week-card${isSelected ? ' selected' : ''}`}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    aria-label={`${week.title}: ${isSelected ? 'selected' : 'not selected'}`}
                    onClick={() => toggleWeek(week.number)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleWeek(week.number);
                      }
                    }}
                  >
                    <span className="week-check" aria-hidden="true">
                      ✓
                    </span>
                    <span className="card-title">{week.title}</span>
                    {week.description && <span className="card-desc">{week.description}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
          {selected.length > 0 && (
            <div className="selection-spacer" style={{ height: barHeight }} aria-hidden="true" />
          )}
        </>
      )}

      {selected.length > 0 && (
        <div className="selection-bar" ref={barRef}>
          <div className="container">
            <div className="mode-select-row">
              <fieldset className="mode-select">
                <legend className="sr-only">Quiz mode</legend>
                {QUIZ_MODES.map((m) => (
                  <label key={m} className="mode-option">
                    <input
                      type="radio"
                      name="quiz-mode"
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
            <div className="selection-bar-row">
              <span>
                {selected.length} {selected.length === 1 ? 'week' : 'weeks'} selected ·{' '}
                {selectedQuestionCount} questions
              </span>
              <div className="selection-bar-actions">
                <button type="button" className="btn" onClick={() => setSelected([])}>
                  Clear
                </button>
                <button type="button" className="btn primary" onClick={generateQuiz}>
                  Generate quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
