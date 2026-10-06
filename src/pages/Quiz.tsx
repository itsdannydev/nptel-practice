import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import QuizSession from '../components/QuizSession';
import Results from '../components/Results';
import { courseLabel, getCourse, loadWeek } from '../lib/courses';
import { recordAttempt, type WeekProgress } from '../lib/progress';
import type { AnswerResult, Course, Question, Week } from '../lib/types';
import { useTitle } from '../lib/useTitle';
import NotFound from './NotFound';

export default function Quiz() {
  const { courseId, week: weekParam } = useParams();
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
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">Courses</Link>
        <span aria-hidden="true"> / </span>
        <Link to={`/c/${course.id}`}>{courseLabel(course)}</Link>
      </nav>

      {failed && <p className="empty">Couldn't load this week. Try reloading.</p>}
      {!failed && week === undefined && <p className="muted">Loading…</p>}
      {week && <QuizRunner key={`${course.id}/${week.number}`} course={course} week={week} />}
    </>
  );
}

interface Run {
  id: number;
  questions: Question[];
  /** Only full-week runs count toward saved progress */
  full: boolean;
}

function QuizRunner({ course, week }: { course: Course; week: Week }) {
  const [run, setRun] = useState<Run>({ id: 0, questions: week.questions, full: true });
  const [results, setResults] = useState<AnswerResult[] | null>(null);
  const [progress, setProgress] = useState<WeekProgress | undefined>();

  function start(questions: Question[], full: boolean) {
    setRun((prev) => ({ id: prev.id + 1, questions, full }));
    setResults(null);
    setProgress(undefined);
  }

  function finish(finished: AnswerResult[]) {
    if (run.full) {
      setProgress(
        recordAttempt(
          course.id,
          week.number,
          finished.filter((r) => r.correct).length,
          finished.length,
          finished.filter((r) => !r.correct).map((r) => r.question.id),
        ),
      );
    }
    setResults(finished);
  }

  return (
    <>
      <h1>{week.title}</h1>
      {week.description && <p className="lede">{week.description}</p>}
      {run.full ? null : <p className="badge">Retrying missed questions</p>}

      {results ? (
        <Results
          results={results}
          progress={progress}
          onRetryMissed={() =>
            start(
              results.filter((r) => !r.correct).map((r) => r.question),
              false,
            )
          }
          onRestart={() => start(week.questions, true)}
          backTo={
            <Link to={`/c/${course.id}`} className="btn">
              All weeks
            </Link>
          }
        />
      ) : (
        <QuizSession key={run.id} questions={run.questions} onFinish={finish} />
      )}
    </>
  );
}
