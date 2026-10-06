# NPTEL Practice

Frontend-only app for practicing NPTEL quizzes. Pick a course, pick a week, get quizzed.
All data is static JSON under `courses/`; progress is stored in the browser's `localStorage`.

```bash
npm install
npm run dev        # validates courses/, then starts Vite
npm run build      # validates, type-checks, builds to dist/
npm run validate   # only check the course JSON
```

The build uses `HashRouter` and a relative base, so `dist/` works on any static host
(GitHub Pages, Netlify, Cloudflare Pages, …) with no server config.

## Adding content

One folder per course under `courses/`. The folder name is a unique id used in URLs.

```
courses/
└── CFOC657M/
    ├── course.json      # required
    ├── week_1.json
    ├── week_2.json
    └── week_N.json      # sorted numerically: week_10 comes after week_2
```

New folders and files are picked up automatically; there is no index to update.
If the same course runs in several sessions, use one folder per run (e.g. `entrepreneurship-2025`,
`entrepreneurship-2026`) and put the differences in `course.json`.

### course.json

```json
{ "name": "Understanding Incubation and Entrepreneurship", "code": "CFOC657M", "session": 2026 }
```

All three keys are required. `session` is the year for now.

### week_N.json

```json
{
  "title": "Week 1",
  "description": "Short summary of the week's topics",
  "questions": [
    { "id": 1, "question": "…", "options": ["A", "B", "C", "D"], "correctOption": 3 },
    { "id": 2, "question": "…", "options": ["A", "B", "C", "D"], "correctOption": [0, 1] }
  ]
}
```

- `correctOption` is a **0-based** index into `options`.
- A number renders radio buttons (one answer); an array renders checkboxes (multi-select),
  even if it has a single item. A multi-select question is correct only if the selection
  matches the array exactly.
- `id` must be unique within a week.
- Option order is never shuffled (so "All of the above" always stays put).

`npm run validate` checks all of this and reports the file and question at fault. Unknown keys
(e.g. a typo like `correctOptions`) are reported as warnings.

## Layout

```
courses/                 quiz content (JSON)
scripts/validate-courses.mjs
src/
  lib/courses.ts         discovers courses/weeks via import.meta.glob, normalizes questions
  lib/progress.ts        localStorage progress (best score, attempts, missed ids)
  pages/                 CourseList, WeekList, Quiz
  components/            QuizSession (one question at a time), Results
```

Routes: `#/` → courses, `#/c/<course>` → weeks, `#/c/<course>/w/<n>` → quiz.
Keyboard in a quiz: `1`–`9` select an option, `Enter` checks the answer / moves on.
