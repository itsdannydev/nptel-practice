/** Shape of courses/<folder>/course.json */
export interface CourseMeta {
  name: string;
  code: string;
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
}

export interface AnswerResult {
  question: Question;
  selected: number[];
  correct: boolean;
}

export interface Week {
  number: number;
  title: string;
  description: string;
  questions: Question[];
}
