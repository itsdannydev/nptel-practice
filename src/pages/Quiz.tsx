import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import QuizRunner from '../components/QuizRunner';
import { courseLabel, getCourse, loadWeek } from '../lib/courses';
import { parseQuizMode, QUIZ_MODE_LABELS, type Week } from '../lib/types';
import { useTitle } from '../lib/useTitle';
import NotFound from './NotFound';

export default function Quiz() {
  const { courseId, week: weekParam } = useParams();
  const [searchParams] = useSearchParams();
  const mode = parseQuizMode(searchParams.get('mode'));
  const course = getCourse(courseId);
  const weekNumber = /^\d+$/.test(weekParam ?? '') ? Number(weekParam) : NaN;

  const [week, setWeek] = useState<Week | null | undefined>(undefined); // undefined = loading
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!course || Number.isNaN(weekNumber)) return;
    let cancelled = false;
    setWeek(undefined);
    setFailed(false);
    loadWeek(course.id, weekNumber)
      .then((loaded) => {
        if (!cancelled) setWeek(loaded);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [course, weekNumber]);

  useTitle(week ? `${week.title} · ${course?.name ?? ''}` : (course?.name ?? ''));

  if (!course) return <NotFound what="course" />;
  if (Number.isNaN(weekNumber) || week === null) return <NotFound what="week" />;

  return (
    <div className="prose">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">Courses</Link>
        <span aria-hidden="true"> / </span>
        <Link to={`/c/${course.id}`}>{courseLabel(course)}</Link>
      </nav>

      {failed && <p className="empty">Couldn't load this week. Try reloading.</p>}
      {!failed && week === undefined && <p className="muted">Loading…</p>}
      {week && (
        <>
          <h1>
            {week.title} <span className="badge">{QUIZ_MODE_LABELS[mode]}</span>
          </h1>
          {week.description && <p className="lede">{week.description}</p>}
          <QuizRunner
            key={`${course.id}/${week.number}/${mode}`}
            courseId={course.id}
            progressKey={week.number}
            mode={mode}
            initialQuestions={week.questions}
            makeAttempt={() => week.questions}
            restartLabel="Restart week"
            backTo={
              <Link to={`/c/${course.id}`} className="btn">
                All weeks
              </Link>
            }
          />
        </>
      )}
    </div>
  );
}
