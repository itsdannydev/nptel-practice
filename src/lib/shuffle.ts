import type { Question } from './types';

export function shuffled<T>(items: T[]): T[] {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** A copy of `q` with its options shuffled and `correct` remapped to match the new
 * positions. Note: this can break a positional option like "All of the above" — it's
 * why the app otherwise never shuffles options, and why this is opt-in. */
export function withShuffledOptions(q: Question): Question {
  const order = shuffled(q.options.map((_, i) => i));
  const options = order.map((i) => q.options[i]);
  const correct = order
    .map((originalIndex, newIndex) => (q.correct.includes(originalIndex) ? newIndex : -1))
    .filter((newIndex) => newIndex !== -1);
  return { ...q, options, correct };
}

export interface Randomization {
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
}

/** Builds one attempt's question list, applying whichever randomization is turned on. */
export function buildAttempt(questions: Question[], opts: Randomization): Question[] {
  let result = opts.randomizeQuestions ? shuffled(questions) : questions.slice();
  if (opts.randomizeOptions) result = result.map(withShuffledOptions);
  return result;
}
