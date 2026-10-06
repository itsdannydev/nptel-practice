// Per-week quiz progress kept in localStorage. Everything is wrapped in try/catch
// because storage can be unavailable (private windows, blocked site data).

const STORAGE_KEY = 'nptel-progress:v1';

export interface WeekProgress {
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

type Store = Record<string, WeekProgress>;

const keyFor = (courseId: string, week: number) => `${courseId}/${week}`;

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

export function getWeekProgress(courseId: string, week: number): WeekProgress | undefined {
  return read()[keyFor(courseId, week)];
}

export function recordAttempt(
  courseId: string,
  week: number,
  correct: number,
  total: number,
  missedIds: number[],
): WeekProgress {
  const store = read();
  const key = keyFor(courseId, week);
  const prev = store[key];
  // If the week's question count changed since the last attempt, old scores aren't comparable.
  const comparable = prev !== undefined && prev.total === total;
  const next: WeekProgress = {
    best: comparable ? Math.max(prev.best, correct) : correct,
    total,
    last: correct,
    attempts: (prev?.attempts ?? 0) + 1,
    lastAt: Date.now(),
    missedIds,
  };
  store[key] = next;
  write(store);
  return next;
}
