import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import QuizRunner from '../components/QuizRunner';
import { courseLabel, getCourse, loadWeek } from '../lib/courses';
import { buildAttempt } from '../lib/shuffle';
import { parseFlag, parseQuizMode, QUIZ_MODE_LABELS, type Question } from '../lib/types';
import { useTitle } from '../lib/useTitle';
import NotFound from './NotFound';

/** A quiz built from several weeks at once: questions merged, and by default shuffled
 * (never the options within a question, unless "Shuffle answer order" was turned on).
 * Reached from WeekList by selecting weeks and generating. */
export default function MixedQuiz() {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const mode = parseQuizMode(searchParams.get('mode'));
  // Falls back to "on"/"off" matching how a mixed quiz always behaved before this was
  // configurable: questions merged in shuffled order, options always left alone.
  const randomizeQuestions = parseFlag(searchParams.get('randomizeQuestions'), true);
  const randomizeOptions = parseFlag(searchParams.get('randomizeOptions'), false);
  const course = getCourse(courseId);

  const weekNumbers = useMemo(() => {
    const nums = (searchParams.get('weeks') ?? '')
      .split(',')
      .map(Number)
      .filter((n) => Number.isInteger(n) && n > 0);
    return [...new Set(nums)].sort((a, b) => a - b);
  }, [searchParams]);

  const validWeeks = useMemo(
    () => (course ? weekNumbers.filter((n) => course.weekNumbers.includes(n)) : []),
    [course, weekNumbers],
  );
  const poolKey = `${course?.id ?? ''}:${validWeeks.join(',')}`;

  const [pool, setPool] = useState<Question[] | null | undefined>(undefined); // undefined = loading, null = failed

  useEffect(() => {
    if (!course || validWeeks.length === 0) return;
    let cancelled = false;
    setPool(undefined);
    Promise.all(validWeeks.map((n) => loadWeek(course.id, n)))
      .then((weeks) => {
        if (cancelled) return;
        const merged: Question[] = [];
        for (const week of weeks) {
          if (!week) continue;
          // Question ids are only unique within a week, so make them unique across the
          // merged set (also used as React keys and in the review/missed-ids list).
          for (const q of week.questions) {
            merged.push({ ...q, id: week.number * 1000 + q.id, sourceWeek: week.number });
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
    // poolKey captures everything `course` and `validWeeks` contribute here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolKey]);

  useTitle(course ? `Mixed quiz · ${course.name}` : '');

  if (!course) return <NotFound what="course" />;
  if (validWeeks.length === 0) return <NotFound what="week selection" />;

  return (
    <div className="prose">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">Courses</Link>
        <span aria-hidden="true"> / </span>
        <Link to={`/c/${course.id}`}>{courseLabel(course)}</Link>
      </nav>
      <h1>
        Mixed quiz <span className="badge">{QUIZ_MODE_LABELS[mode]}</span>
      </h1>
      <p className="lede">
        Weeks {validWeeks.join(', ')}
        {pool ? ` · ${pool.length} questions${randomizeQuestions ? ', shuffled' : ''}` : ''}
      </p>

      {pool === null && <p className="empty">Couldn't load these weeks. Try reloading.</p>}
      {pool === undefined && <p className="muted">Loading…</p>}
      {pool && pool.length === 0 && (
        <p className="empty">None of the selected weeks have any questions.</p>
      )}
      {pool && pool.length > 0 && (
        <QuizRunner
          key={`${poolKey}/${mode}/${randomizeQuestions}/${randomizeOptions}`}
          courseId={course.id}
          progressKey={`mix:${validWeeks.join(',')}`}
          mode={mode}
          initialQuestions={buildAttempt(pool, { randomizeQuestions, randomizeOptions })}
          makeAttempt={() => buildAttempt(pool, { randomizeQuestions, randomizeOptions })}
          restartLabel={randomizeQuestions || randomizeOptions ? 'New shuffle' : 'Restart quiz'}
          backTo={
            <Link to={`/c/${course.id}`} className="btn">
              Choose different weeks
            </Link>
          }
        />
      )}
    </div>
  );
}
