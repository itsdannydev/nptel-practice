// Tracks questions answered incorrectly in Rapid Fire or Mock Test mode (never Practice, which
// shows the answer up front and never "checks" anything). Scoped per course, keyed by
// week+question id since an id is only unique within its own week. Same localStorage
// approach as progress.ts, wrapped in try/catch for the same reasons (private windows,
// blocked site data).

const STORAGE_KEY = 'nptel-wrong:v1';

export interface WrongEntry {
  weekNumber: number;
  questionId: number;
  /** Times answered wrong across every Rapid Fire/Mock attempt, anywhere in the app */
  count: number;
  /** Epoch ms it was most recently gotten wrong */
  lastWrongAt: number;
}

type CourseStore = Record<string, WrongEntry>; // "week:id" -> entry
type Store = Record<string, CourseStore>; // courseId -> CourseStore

const entryKey = (weekNumber: number, questionId: number) => `${weekNumber}:${questionId}`;

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

export function getWrongQuestions(courseId: string): WrongEntry[] {
  const course = read()[courseId] ?? {};
  return Object.values(course).sort((a, b) => b.count - a.count || b.lastWrongAt - a.lastWrongAt);
}

export function countWrongQuestions(courseId: string): number {
  return Object.keys(read()[courseId] ?? {}).length;
}

export function recordWrongAnswers(
  courseId: string,
  wrong: { weekNumber: number; questionId: number }[],
): void {
  if (wrong.length === 0) return;
  const store = read();
  const course = { ...(store[courseId] ?? {}) };
  for (const { weekNumber, questionId } of wrong) {
    const key = entryKey(weekNumber, questionId);
    const prev = course[key];
    course[key] = {
      weekNumber,
      questionId,
      count: (prev?.count ?? 0) + 1,
      lastWrongAt: Date.now(),
    };
  }
  store[courseId] = course;
  write(store);
}

/** Called when a question is answered correctly during a dedicated wrong-answer practice
 *  run — the one place a mistake gets marked resolved and drops out of the list. Getting
 *  it right elsewhere (e.g. it happens to reappear in a normal week quiz) doesn't clear it,
 *  since that coverage is incidental rather than the deliberate "drill my mistakes" loop. */
export function clearWrongAnswer(courseId: string, weekNumber: number, questionId: number): void {
  const store = read();
  const course = store[courseId];
  const key = entryKey(weekNumber, questionId);
  if (!course || !(key in course)) return;
  const nextCourse = { ...course };
  delete nextCourse[key];
  write({ ...store, [courseId]: nextCourse });
}

export function clearAllWrongAnswers(courseId: string): void {
  const store = read();
  if (!(courseId in store)) return;
  const next = { ...store };
  delete next[courseId];
  write(next);
}
