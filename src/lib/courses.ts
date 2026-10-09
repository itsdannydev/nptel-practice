import type { Course, CourseMeta, RawWeek, Week } from './types';

// Course metadata is tiny, so it's bundled eagerly. Week files are loaded on demand
// (each becomes its own chunk). Paths are relative to the project root.
const metaModules = import.meta.glob<CourseMeta>('/courses/*/course.json', {
  eager: true,
  import: 'default',
});
const weekModules = import.meta.glob<RawWeek>('/courses/*/week_*.json', { import: 'default' });

// Images a question references via Markdown (![alt](/courses/<course>/images/<file>)).
// Eager + resolved to their final (hashed, production-ready) URL, same idea as course.json.
export const courseImages = import.meta.glob<string>(
  '/courses/*/images/*.{png,jpg,jpeg,gif,webp,svg}',
  { eager: true, import: 'default' },
);

const META_PATH = /^\/courses\/([^/]+)\/course\.json$/;
const WEEK_PATH = /^\/courses\/([^/]+)\/week_(\d+)\.json$/;

const weekNumbersByCourse = new Map<string, number[]>();
const weekLoaders = new Map<string, () => Promise<RawWeek>>();

for (const [path, load] of Object.entries(weekModules)) {
  const match = WEEK_PATH.exec(path);
  if (!match) continue;
  const [, courseId, number] = match;
  const numbers = weekNumbersByCourse.get(courseId) ?? [];
  numbers.push(Number(number));
  weekNumbersByCourse.set(courseId, numbers);
  weekLoaders.set(`${courseId}/${number}`, load);
}

export const courses: Course[] = Object.entries(metaModules)
  .flatMap(([path, meta]) => {
    const match = META_PATH.exec(path);
    if (!match) return [];
    const id = match[1];
    const weekNumbers = [...(weekNumbersByCourse.get(id) ?? [])].sort((a, b) => a - b);
    return [{ ...meta, id, weekNumbers }];
  })
  .sort(
    (a, b) => a.name.localeCompare(b.name) || String(b.session).localeCompare(String(a.session)),
  );

export function getCourse(id: string | undefined): Course | undefined {
  return courses.find((c) => c.id === id);
}

function normalize(number: number, raw: RawWeek): Week {
  return {
    number,
    title: raw.title,
    description: raw.description ?? '',
    questions: raw.questions.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      multi: Array.isArray(q.correctOption),
      correct: Array.isArray(q.correctOption) ? q.correctOption : [q.correctOption],
    })),
  };
}

const weekCache = new Map<string, Promise<Week | null>>();

/** Loads and normalizes one week. Resolves to null if the week doesn't exist. */
export function loadWeek(courseId: string, number: number): Promise<Week | null> {
  const key = `${courseId}/${number}`;
  const cached = weekCache.get(key);
  if (cached) return cached;

  const loader = weekLoaders.get(key);
  const promise = loader ? loader().then((raw) => normalize(number, raw)) : Promise.resolve(null);
  weekCache.set(key, promise);
  return promise;
}

export function courseLabel(course: Pick<Course, 'name' | 'session'>): string {
  return `${course.name} · ${course.session}`;
}

export function termLabel(course: Pick<Course, 'semester' | 'session'>): string {
  return `${course.semester} Sem (${course.session})`;
}
