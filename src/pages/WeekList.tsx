import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { courseLabel, getCourse, loadWeek } from '../lib/courses';
import { getWeekProgress } from '../lib/progress';
import type { Week } from '../lib/types';
import { useTitle } from '../lib/useTitle';
import NotFound from './NotFound';

export default function WeekList() {
  const { courseId } = useParams();
  const course = getCourse(courseId);
  const [weeks, setWeeks] = useState<Week[] | null>(null);
  const [failed, setFailed] = useState(false);

  useTitle(course?.name ?? '');

  useEffect(() => {
    if (!course) return;
    let cancelled = false;
    setWeeks(null);
    setFailed(false);
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

  if (!course) return <NotFound what="course" />;

  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">Courses</Link>
      </nav>
      <h1>{courseLabel(course)}</h1>
      <p className="lede">{course.code} · choose a week to start the quiz.</p>

      {failed && <p className="empty">Couldn't load the weeks for this course. Try reloading.</p>}
      {!failed && weeks === null && <p className="muted">Loading weeks…</p>}
      {weeks !== null && weeks.length === 0 && <p className="empty">No weeks in this course yet.</p>}

      {weeks !== null && weeks.length > 0 && (
        <ul className="card-list">
          {weeks.map((week) => {
            const progress = getWeekProgress(course.id, week.number);
            return (
              <li key={week.number}>
                <Link to={`/c/${course.id}/w/${week.number}`} className="card">
                  <span className="card-title">{week.title}</span>
                  {week.description && <span className="card-desc">{week.description}</span>}
                  <span className="card-meta">
                    {week.questions.length} questions
                    {progress ? (
                      <>
                        {' · '}
                        <span className="badge">
                          Best {progress.best}/{progress.total}
                        </span>
                        {' · '}
                        {progress.attempts} {progress.attempts === 1 ? 'attempt' : 'attempts'}
                      </>
                    ) : (
                      ' · Not attempted'
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
