// Tracks the highest-ranked quiz mode ever fully finished for a week — used only to color
// the week card's border (see WeekList.tsx). Practice mode has no score, so this can't live
// in progress.ts; this only cares about "was this mode finished", never correctness.
// Same localStorage approach as progress.ts/wrongAnswers.ts, wrapped in try/catch for the
// same reasons (private windows, blocked site data).

import type { QuizMode } from './types';

const STORAGE_KEY = 'nptel-completion:v1';

// Low to high: a higher-ranked mode's completion sticks even if a lower-ranked mode is
// attempted again afterward — see recordCompletion below.
const MODE_RANK: Record<QuizMode, number> = {
  practice: 1,
  quiz: 2,
  mock: 3,
};

type Store = Record<string, QuizMode>; // "courseId/weekKey" -> highest mode completed

const keyFor = (courseId: string, key: number | string) => `${courseId}/${key}`;

function read(): Store {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    return parsed && typeof parsed === 'object' ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

function write(store: Store): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage unavailable: nothing persists, same as progress.ts.
  }
}

/** `key` is a week number for a single week, or a string like `mix:2,5` for a mixed quiz. */
export function getCompletedMode(courseId: string, key: number | string): QuizMode | undefined {
  return read()[keyFor(courseId, key)];
}

/** Records that `mode` was finished for this week — a no-op if a higher-ranked mode (or the
 *  same one) was already recorded, since completion only ever upgrades, never downgrades. */
export function recordCompletion(courseId: string, key: number | string, mode: QuizMode): void {
  const store = read();
  const storeKey = keyFor(courseId, key);
  const prev = store[storeKey];
  if (prev && MODE_RANK[prev] >= MODE_RANK[mode]) return;
  store[storeKey] = mode;
  write(store);
}
