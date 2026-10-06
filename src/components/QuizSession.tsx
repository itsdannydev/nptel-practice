import { useEffect, useState } from 'react';
import type { AnswerResult, Question } from '../lib/types';

export function sameSet(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((x) => b.includes(x));
}

interface Props {
  questions: Question[];
  onFinish: (results: AnswerResult[]) => void;
}

/** Runs through `questions` one at a time: select, check, next. */
export default function QuizSession({ questions, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<AnswerResult[]>([]);

  const q = questions[index];
  const isCorrect = sameSet(selected, q.correct);
  const isLast = index === questions.length - 1;

  function toggle(i: number) {
    if (checked) return;
    setSelected((prev) =>
      q.multi ? (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]) : [i],
    );
  }

  function check() {
    if (!checked && selected.length > 0) setChecked(true);
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

  const primary = checked ? next : check;

  // Keyboard: 1-9 pick an option, Enter checks / moves on.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if ((e.target as HTMLElement | null)?.closest('a')) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        primary();
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

      <fieldset className="question">
        <legend>{q.question}</legend>
        <p className="hint">{q.multi ? 'Select all that apply' : 'Select one answer'}</p>

        <div className="options">
          {q.options.map((option, i) => {
            const isSelected = selected.includes(i);
            const isAnswer = q.correct.includes(i);
            let state = '';
            let tag = '';
            if (checked) {
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
                  disabled={checked}
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

      <div className="actions">
        <button
          type="button"
          className="btn primary"
          onClick={primary}
          disabled={!checked && selected.length === 0}
        >
          {checked ? (isLast ? 'Finish' : 'Next question') : 'Check answer'}
        </button>
        <span className="muted shortcut-hint">Press Enter</span>
      </div>
    </section>
  );
}
