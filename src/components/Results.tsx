import type { ReactNode } from 'react';
import type { AnswerResult } from '../lib/types';
import type { QuizProgress } from '../lib/progress';

interface Props {
  results: AnswerResult[];
  /** Saved progress after this attempt; undefined for partial (retry) runs */
  progress?: QuizProgress;
  onRetryMissed: () => void;
  onRestart: () => void;
  restartLabel?: string;
  backTo: ReactNode;
}

export default function Results({
  results,
  progress,
  onRetryMissed,
  onRestart,
  restartLabel = 'Restart',
  backTo,
}: Props) {
  const total = results.length;
  const score = results.filter((r) => r.correct).length;
  const missed = results.filter((r) => !r.correct);
  const percent = Math.round((score / total) * 100);

  return (
    <section aria-label="Results">
      <h2 className="score">
        {score} / {total}
        <span className="score-percent">{percent}%</span>
      </h2>
      <p className="lede">
        {missed.length === 0
          ? 'Perfect — every answer was right.'
          : `${missed.length} ${missed.length === 1 ? 'question' : 'questions'} to review.`}
        {progress && progress.attempts > 1 && (
          <>
            {' '}
            Best so far: {progress.best}/{progress.total} over {progress.attempts} attempts.
          </>
        )}
      </p>

      <div className="actions">
        {missed.length > 0 && (
          <button type="button" className="btn primary" onClick={onRetryMissed}>
            Retry missed ({missed.length})
          </button>
        )}
        <button type="button" className="btn" onClick={onRestart}>
          {restartLabel}
        </button>
        {backTo}
      </div>

      {missed.length > 0 && (
        <>
          <h3>Review</h3>
          <ol className="review">
            {missed.map(({ question, selected }) => (
              <li key={question.id}>
                {question.sourceWeek !== undefined && (
                  <p className="review-week">Week {question.sourceWeek}</p>
                )}
                <p className="review-q">{question.question}</p>
                <p className="review-a bad">
                  <span className="review-label">Your answer</span>
                  {selected.map((i) => question.options[i]).join(' · ')}
                </p>
                <p className="review-a ok">
                  <span className="review-label">Correct answer</span>
                  {question.correct.map((i) => question.options[i]).join(' · ')}
                </p>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
