import { useState } from 'react';
import type { ReactNode } from 'react';
import QuizSession from './QuizSession';
import PracticeSession from './PracticeSession';
import Results from './Results';
import { recordAttempt, type QuizProgress } from '../lib/progress';
import { recordWrongAnswers } from '../lib/wrongAnswers';
import type { AnswerResult, Question, QuizMode } from '../lib/types';

interface Props {
  courseId: string;
  /** localStorage progress key: a week number, or a string like `mix:2,5`. Omit to skip saving progress. */
  progressKey?: number | string;
  mode: QuizMode;
  initialQuestions: Question[];
  /** Produces the question set for a fresh full attempt (e.g. reshuffled for a mixed quiz). */
  makeAttempt: () => Question[];
  restartLabel?: string;
  backTo: ReactNode;
  /** Called once per correctly-answered question (Quiz/Mock only). Only wrong-answer
   *  practice wires this up, to clear a mistake once it's answered right again. */
  onCorrectAnswer?: (weekNumber: number, questionId: number) => void;
}

interface Run {
  id: number;
  questions: Question[];
  /** Only full attempts (not "retry missed") count toward saved progress */
  full: boolean;
}

/** Drives one question set end to end, in whichever of the three modes was picked. */
export default function QuizRunner({
  courseId,
  progressKey,
  mode,
  initialQuestions,
  makeAttempt,
  restartLabel,
  backTo,
  onCorrectAnswer,
}: Props) {
  const [run, setRun] = useState<Run>({ id: 0, questions: initialQuestions, full: true });
  const [results, setResults] = useState<AnswerResult[] | null>(null);
  const [progress, setProgress] = useState<QuizProgress | undefined>();

  function start(questions: Question[], full: boolean) {
    setRun((prev) => ({ id: prev.id + 1, questions, full }));
    setResults(null);
    setProgress(undefined);
  }

  // Practice is pure review — no scoring, no results screen.
  if (mode === 'practice') {
    return (
      <PracticeSession
        key={run.id}
        questions={run.questions}
        onRestart={() => start(makeAttempt(), true)}
        backTo={backTo}
      />
    );
  }

  function finish(finished: AnswerResult[]) {
    if (run.full && progressKey !== undefined) {
      setProgress(
        recordAttempt(
          courseId,
          progressKey,
          finished.filter((r) => r.correct).length,
          finished.length,
          finished.filter((r) => !r.correct).map((r) => r.question.id),
        ),
      );
    }

    // Wrong-answer tracking (Quiz/Mock only — Practice never reaches finish() at all, see
    // the early return above). Applies to every run, not just full attempts, so a "Retry
    // missed" pass still counts repeat mistakes and can clear resolved ones.
    const weekOf = (q: Question) =>
      q.sourceWeek ?? (typeof progressKey === 'number' ? progressKey : undefined);

    const wrong = finished.flatMap((r) => {
      if (r.correct) return [];
      const weekNumber = weekOf(r.question);
      return weekNumber === undefined
        ? []
        : [{ weekNumber, questionId: r.question.originalId ?? r.question.id }];
    });
    if (wrong.length > 0) recordWrongAnswers(courseId, wrong);

    if (onCorrectAnswer) {
      for (const r of finished) {
        if (!r.correct) continue;
        const weekNumber = weekOf(r.question);
        if (weekNumber !== undefined) {
          onCorrectAnswer(weekNumber, r.question.originalId ?? r.question.id);
        }
      }
    }

    setResults(finished);
  }

  return (
    <>
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
          onRestart={() => start(makeAttempt(), true)}
          restartLabel={restartLabel}
          backTo={backTo}
        />
      ) : (
        <QuizSession key={run.id} mode={mode} questions={run.questions} onFinish={finish} />
      )}
    </>
  );
}
