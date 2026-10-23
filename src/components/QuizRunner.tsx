import { useState } from 'react';
import type { ReactNode } from 'react';
import QuizSession from './QuizSession';
import PracticeSession from './PracticeSession';
import Results from './Results';
import { recordCompletion } from '../lib/completion';
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
  /** Called once per correctly-answered question (Rapid Fire/Mock only). Only wrong-answer
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
    // Guards a restart/retry that resolves to nothing to ask (e.g. wrong-answer practice
    // where every remaining mistake just got cleared) — QuizSession assumes at least one
    // question, so starting an empty run would crash rather than just no-op harmlessly.
    if (questions.length === 0) return;
    setRun((prev) => ({ id: prev.id + 1, questions, full }));
    setResults(null);
    setProgress(undefined);
  }

  // A merged pool (mixed quiz, wrong-answer practice) tags each question with the week it
  // actually came from; a plain single-week run doesn't, so progressKey (a week number
  // there) is the fallback. Shared by completion-tracking below and wrong-answer tracking
  // inside finish().
  const weekOf = (q: Question) =>
    q.sourceWeek ?? (typeof progressKey === 'number' ? progressKey : undefined);

  // Marks every distinct week touched by this run as having finished `mode` — skipped
  // entirely when progressKey is omitted (wrong-answer practice drills a cross-week pool,
  // not any one week's "real" attempt, same gate recordAttempt below already uses).
  function recordWeekCompletion(finishedMode: QuizMode, questions: Question[]) {
    if (progressKey === undefined) return;
    const weeks = new Set<number>();
    for (const q of questions) {
      const w = weekOf(q);
      if (w !== undefined) weeks.add(w);
    }
    for (const w of weeks) recordCompletion(courseId, w, finishedMode);
  }

  // Practice is pure review — no scoring, no results screen.
  if (mode === 'practice') {
    return (
      <PracticeSession
        key={run.id}
        questions={run.questions}
        onRestart={() => start(makeAttempt(), true)}
        onComplete={() => recordWeekCompletion('practice', run.questions)}
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
      recordWeekCompletion(mode, finished.map((r) => r.question));
    }

    // Wrong-answer tracking (Rapid Fire/Mock only — Practice never reaches finish() at all, see
    // the early return above). Applies to every run, not just full attempts, so a "Retry
    // missed" pass still counts repeat mistakes and can clear resolved ones.
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
