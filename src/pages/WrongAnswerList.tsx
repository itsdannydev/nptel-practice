import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import QuestionText from '../components/QuestionText';
import { courseLabel, getCourse, loadWeek } from '../lib/courses';
import { useTitle } from '../lib/useTitle';
import {
  clearAllWrongAnswers,
  clearWrongAnswer,
  getWrongQuestions,
  type WrongEntry,
} from '../lib/wrongAnswers';
import NotFound from './NotFound';

interface ListItem extends WrongEntry {
  /** Question text as authored in week_N.json; null if that week/id can no longer be found
   * (course content changed since the mistake was recorded). */
  questionText: string | null;
}

/** Read-only view of every wrong answer for this course, most-missed first — the list the
 * "View wrong answers" link on the course page opens. Practicing happens on the separate
 * /wrong page; this one is just for browsing what's been missed and how often. */
export default function WrongAnswerList() {
  const { courseId } = useParams();
  const course = getCourse(courseId);

  const [items, setItems] = useState<ListItem[] | null>(null);

  useTitle(course ? `Wrong answers · ${course.name}` : '');

  useEffect(() => {
    if (!course) return;
    let cancelled = false;
    setItems(null);

    const entries = getWrongQuestions(course.id);
    if (entries.length === 0) {
      setItems([]);
      return;
    }

    const weekNumbers = [...new Set(entries.map((e) => e.weekNumber))];
    Promise.all(weekNumbers.map((n) => loadWeek(course.id, n)))
      .then((weeks) => {
        if (cancelled) return;
        const textByKey = new Map<string, string>();
        for (const week of weeks) {
          if (!week) continue;
          for (const q of week.questions) {
            textByKey.set(`${week.number}:${q.id}`, q.question);
          }
        }
        setItems(
          entries.map((e) => ({
            ...e,
            questionText: textByKey.get(`${e.weekNumber}:${e.questionId}`) ?? null,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setItems(entries.map((e) => ({ ...e, questionText: null })));
      });
    return () => {
      cancelled = true;
    };
  }, [course]);

  function handleRemove(item: ListItem) {
    if (!course) return;
    clearWrongAnswer(course.id, item.weekNumber, item.questionId);
    setItems(
      (prev) =>
        prev?.filter(
          (i) => !(i.weekNumber === item.weekNumber && i.questionId === item.questionId),
        ) ?? prev,
    );
  }

  function handleClearAll() {
    if (!course) return;
    if (!window.confirm('Clear every wrong answer recorded for this course? This cannot be undone.')) {
      return;
    }
    clearAllWrongAnswers(course.id);
    setItems([]);
  }

  if (!course) return <NotFound what="course" />;

  return (
    <div className="prose">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">Courses</Link>
        <span aria-hidden="true"> / </span>
        <Link to={`/c/${course.id}`}>{courseLabel(course)}</Link>
      </nav>
      <h1>Wrong answers</h1>
      <p className="lede">
        Every question you've gotten wrong in Rapid Fire or Mock Test mode for this course,
        most-missed first.
      </p>

      {items === null && <p className="muted">Loading…</p>}
      {items && items.length === 0 && (
        <p className="empty">
          No wrong answers yet — they'll show up here after a Rapid Fire or Mock Test attempt.
        </p>
      )}

      {items && items.length > 0 && (
        <ol className="review">
          {items.map((item) => (
            <li key={`${item.weekNumber}:${item.questionId}`}>
              <p className="review-week">
                Week {item.weekNumber} · Q{item.questionId}
              </p>
              {item.questionText !== null ? (
                <QuestionText text={item.questionText} className="review-q" />
              ) : (
                <p className="review-q muted">
                  Question no longer available — course content may have changed.
                </p>
              )}
              <div className="wrong-item-footer">
                <span className="badge bad">
                  got wrong {item.count} {item.count === 1 ? 'time' : 'times'}
                </span>
                <button
                  type="button"
                  className="btn sm"
                  onClick={() => handleRemove(item)}
                  aria-label={`Remove Week ${item.weekNumber} Q${item.questionId} from wrong answers`}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="actions">
        {items && items.length > 0 && (
          <>
            <Link to={`/c/${course.id}/wrong`} className="btn primary">
              Practice these
            </Link>
            <button type="button" className="btn" onClick={handleClearAll}>
              Clear all wrong answers
            </button>
          </>
        )}
        <Link to={`/c/${course.id}`} className="btn">
          Back to {course.name}
        </Link>
      </div>
    </div>
  );
}
