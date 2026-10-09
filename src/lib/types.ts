/** Shape of courses/<folder>/course.json */
export interface CourseMeta {
  name: string;
  code: string;
  semester: string;
  session: number | string;
}

/** Shape of a question in courses/<folder>/week_N.json */
export interface RawQuestion {
  id: number;
  question: string;
  options: string[];
  /** number → single answer (radio); number[] → multiple answers (checkboxes) */
  correctOption: number | number[];
}

export interface RawWeek {
  title: string;
  description: string;
  questions: RawQuestion[];
}

export interface Course extends CourseMeta {
  /** Folder name under courses/, used in URLs */
  id: string;
  /** Week numbers found for this course, ascending */
  weekNumbers: number[];
}

export interface Question {
  id: number;
  question: string;
  options: string[];
  /** Indices of the correct options (always an array) */
  correct: number[];
  multi: boolean;
  /** Which week this question came from; set only in a mixed (multi-week) quiz */
  sourceWeek?: number;
}

export interface AnswerResult {
  question: Question;
  selected: number[];
  correct: boolean;
}

/**
 * practice — questions with the correct answer already shown, just browse through.
 * quiz     — current default: select an answer, check it, see right/wrong immediately.
 * mock     — select an answer for every question first; scored together at the end.
 */
export const QUIZ_MODES = ['practice', 'quiz', 'mock'] as const;
export type QuizMode = (typeof QUIZ_MODES)[number];

export const QUIZ_MODE_LABELS: Record<QuizMode, string> = {
  practice: 'Practice',
  quiz: 'Quiz',
  mock: 'Mock Test',
};

export const QUIZ_MODE_HINTS: Record<QuizMode, string> = {
  practice: 'Browse questions with the correct answer already shown',
  quiz: 'Answer each question and get checked right away',
  mock: 'Answer every question, then see your score at the end',
};

export function parseQuizMode(value: string | null): QuizMode {
  return (QUIZ_MODES as readonly string[]).includes(value ?? '') ? (value as QuizMode) : 'quiz';
}

/** Parses a "1"/"0" URL flag. Missing or malformed falls back to `fallback` (not to the
 * UI's own default), so an old link with no flag at all keeps behaving as it always did. */
export function parseFlag(value: string | null, fallback: boolean): boolean {
  if (value === '1') return true;
  if (value === '0') return false;
  return fallback;
}

export interface Week {
  number: number;
  title: string;
  description: string;
  questions: Question[];
}
