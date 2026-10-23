import { useEffect, useState } from 'react';
import QuestionText from './QuestionText';
import type { AnswerResult, Question, QuizMode } from '../lib/types';

export function sameSet(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((x) => b.includes(x));
}

// How long the right/wrong reveal stays up before Rapid Fire mode auto-advances — long
// enough to register the answer, short enough to still feel fast. Pressing Enter skips it.
const AUTO_ADVANCE_MS = 900;

interface Props {
  questions: Question[];
  /** 'quiz' reveals right/wrong after each question; 'mock' just records and moves on. */
  mode: Extract<QuizMode, 'quiz' | 'mock'>;
  onFinish: (results: AnswerResult[]) => void;
}

/** Runs through `questions` one at a time: select, (check,) next. */
export default function QuizSession({ questions, mode, onFinish }: Props) {
  const reveals = mode === 'quiz';
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<AnswerResult[]>([]);

  const q = questions[index];
  const isCorrect = sameSet(selected, q.correct);
  const isLast = index === questions.length - 1;
  const showAnswer = reveals && checked;
  // Rapid Fire on a single-answer question: one click both answers and reveals it, so
  // there's no separate "submit" step. A multi-select question still needs every option
  // picked before checking means anything, so that keeps the explicit Check/Next flow.
  const instantAnswer = reveals && !q.multi;

  function toggle(i: number) {
    if (showAnswer) return;
    if (instantAnswer) {
      setSelected([i]);
      setChecked(true);
      return;
    }
    setSelected((prev) =>
      q.multi ? (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]) : [i],
    );
  }

  function next() {
    const all = [...results, { question: q, selected, correct: isCorrect }];
    if (isLast) {
      onFinish(all);
      return;
    }
    setResults(all);
    setIndex(index + 1);
    setSelected([]);
    setChecked(false);
  }

  function submit() {
    if (selected.length === 0) return;
    // Multi-select questions in quiz mode: first submit reveals the answer, a second submit
    // moves on (single-answer questions never reach here while unchecked — toggle() already
    // handles them instantly). Mock mode has no reveal step, so one submit records and moves
    // on. Also doubles as the "skip the wait" path once instantAnswer has already revealed.
    if (reveals && !checked) {
      setChecked(true);
      return;
    }
    next();
  }

  // Rapid Fire auto-advance: once a single-answer question is revealed, move on by itself
  // after a beat instead of waiting for another click.
  useEffect(() => {
    if (!(instantAnswer && checked)) return;
    const timer = setTimeout(next, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
    // Deliberately keyed on `checked` alone: it only ever flips false→true via toggle()
    // setting `selected` in that same tick, so the `next` closure captured right here is
    // already consistent with this question's `index`/`selected`. Pressing Enter calls
    // `next()` directly (via submit(), below) before the timer fires, which flips `checked`
    // back to false and re-runs this effect — the cleanup above cancels the stale timer, so
    // there's no risk of it firing twice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked]);

  // Keyboard: 1-9 pick an option, Enter submits / moves on.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if ((e.target as HTMLElement | null)?.closest('a')) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      } else if (/^[1-9]$/.test(e.key)) {
        const i = Number(e.key) - 1;
        if (i < q.options.length) {
          e.preventDefault();
          toggle(i);
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <section aria-label="Quiz">
      <div className="progress" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>
      <p className="muted question-count">
        Question {index + 1} of {questions.length}
      </p>

      {q.sourceWeek !== undefined && <p className="source-tag">Week {q.sourceWeek}</p>}
      <QuestionText text={q.question} id={`q-${q.id}-label`} className="question-heading" />
      <fieldset className="question" aria-labelledby={`q-${q.id}-label`}>
        <p className="hint">{q.multi ? 'Select all that apply' : 'Select one answer'}</p>

        <div className="options">
          {q.options.map((option, i) => {
            const isSelected = selected.includes(i);
            const isAnswer = q.correct.includes(i);
            let state = '';
            let tag = '';
            if (showAnswer) {
              if (isAnswer && isSelected) [state, tag] = ['correct', 'Correct'];
              else if (isAnswer) [state, tag] = ['missed', 'Correct answer'];
              else if (isSelected) [state, tag] = ['wrong', 'Incorrect'];
            }
            return (
              <label
                key={i}
                className={`option${isSelected ? ' selected' : ''}${state ? ` ${state}` : ''}`}
              >
                <input
                  type={q.multi ? 'checkbox' : 'radio'}
                  name={`q-${q.id}`}
                  checked={isSelected}
                  disabled={showAnswer}
                  onChange={() => toggle(i)}
                />
                <span className="key" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="option-text">{option}</span>
                {tag && <span className="option-tag">{tag}</span>}
              </label>
            );
          })}
        </div>
      </fieldset>

      {reveals && (
        <div className="actions" role="status" aria-live="polite">
          {checked && (
            <p className={`verdict ${isCorrect ? 'ok' : 'bad'}`}>
              {isCorrect
                ? 'Correct!'
                : q.multi
                  ? 'Not quite — you need to select every correct option and nothing else.'
                  : 'Not quite.'}
            </p>
          )}
        </div>
      )}

      {!instantAnswer && (
        <div className="actions">
          <button
            type="button"
            className="btn primary"
            onClick={submit}
            disabled={!checked && selected.length === 0}
          >
            {showAnswer || !reveals ? (isLast ? 'Finish' : 'Next question') : 'Check answer'}
          </button>
          <span className="muted shortcut-hint">Press Enter</span>
        </div>
      )}
    </section>
  );
}
