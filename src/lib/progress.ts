// Quiz progress kept in localStorage: one entry per single week, or per mixed-week
// combination (keyed by a string like `mix:2,5`). Everything is wrapped in try/catch
// because storage can be unavailable (private windows, blocked site data).

const STORAGE_KEY = 'nptel-progress:v1';

export interface QuizProgress {
  /** Best number of correct answers across full attempts */
  best: number;
  /** Number of questions when `best` was recorded */
  total: number;
  /** Correct answers in the most recent full attempt */
  last: number;
  attempts: number;
  /** Epoch ms of the most recent attempt */
  lastAt: number;
  /** Question ids answered wrongly in the most recent attempt */
  missedIds: number[];
}

type Store = Record<string, QuizProgress>;

/** `key` is a week number for a single week, or a string like `mix:2,5` for a mixed quiz. */
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
    // Storage unavailable: progress just won't persist.
  }
}

export function getQuizProgress(courseId: string, key: number | string): QuizProgress | undefined {
  return read()[keyFor(courseId, key)];
}

export function recordAttempt(
  courseId: string,
  key: number | string,
  correct: number,
  total: number,
  missedIds: number[],
): QuizProgress {
  const store = read();
  const storeKey = keyFor(courseId, key);
  const prev = store[storeKey];
  // If the question count changed since the last attempt, old scores aren't comparable.
  const comparable = prev !== undefined && prev.total === total;
  const next: QuizProgress = {
    best: comparable ? Math.max(prev.best, correct) : correct,
    total,
    last: correct,
    attempts: (prev?.attempts ?? 0) + 1,
    lastAt: Date.now(),
    missedIds,
  };
  store[storeKey] = next;
  write(store);
  return next;
}
