import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import QuestionText from './QuestionText';
import type { Question } from '../lib/types';

interface Props {
  questions: Question[];
  /** Produces a fresh (optionally reshuffled) question list when reviewing again. */
  onRestart: () => void;
  backTo: ReactNode;
}

/** Pure review: question, options, correct one(s) already highlighted. No scoring. */
export default function PracticeSession({ questions, onRestart, backTo }: Props) {
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[index];
  const isFirst = index === 0;
  const isLast = index === questions.length - 1;

  function next() {
    if (isLast) {
      setDone(true);
      return;
    }
    setIndex(index + 1);
  }

  function prev() {
    if (!isFirst) setIndex(index - 1);
  }

  function restart() {
    setIndex(0);
    setDone(false);
    onRestart();
  }

  useEffect(() => {
    if (done) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if ((e.target as HTMLElement | null)?.closest('a')) return;
      if (e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (done) {
    return (
      <section aria-label="Practice complete">
        <h2>You've reviewed all {questions.length} questions.</h2>
        <div className="actions">
          <button type="button" className="btn primary" onClick={restart}>
            Review again
          </button>
          {backTo}
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Practice">
      <div className="progress" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>
      <p className="muted question-count">
        Question {index + 1} of {questions.length}
      </p>

      {q.sourceWeek !== undefined && <p className="source-tag">Week {q.sourceWeek}</p>}
      <QuestionText text={q.question} className="question-heading" />
      <div className="question">
        <p className="hint">Correct {q.multi ? 'answers' : 'answer'} highlighted</p>

        <div className="options">
          {q.options.map((option, i) => {
            const isAnswer = q.correct.includes(i);
            return (
              <div key={i} className={`option practice${isAnswer ? ' correct' : ''}`}>
                <span className="key" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="option-text">{option}</span>
                {isAnswer && <span className="option-tag">Correct</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="actions">
        <button type="button" className="btn" onClick={prev} disabled={isFirst}>
          Previous
        </button>
        <button type="button" className="btn primary" onClick={next}>
          {isLast ? 'Finish' : 'Next question'}
        </button>
        <span className="muted shortcut-hint">Press Enter</span>
      </div>
    </section>
  );
}
