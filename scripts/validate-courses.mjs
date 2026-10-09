// Validates everything under courses/ before dev/build.
// Errors fail the run (exit 1); warnings are printed but don't.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const root = join(repoRoot, 'courses');
const errors = [];
const warnings = [];

// Matches Markdown image syntax: ![alt](path) — not a plain [text](link).
const IMAGE_REF = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

const isInt = (v) => Number.isInteger(v);
const isText = (v) => typeof v === 'string' && v.trim() !== '';

const QUESTION_KEYS = new Set(['id', 'question', 'options', 'correctOption']);
const WEEK_KEYS = new Set(['title', 'description', 'questions']);
const COURSE_KEYS = new Set(['name', 'code', 'semester', 'session']);

function readJson(file, label) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    errors.push(`${label}: invalid JSON (${e.message})`);
    return null;
  }
}

function checkUnknownKeys(obj, allowed, label) {
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) warnings.push(`${label}: unknown key "${key}" (typo?)`);
  }
}

function validateCourseMeta(dir, id) {
  const label = `${id}/course.json`;
  const file = join(dir, 'course.json');
  if (!existsSync(file)) {
    errors.push(`${label}: missing`);
    return null;
  }
  const meta = readJson(file, label);
  if (!meta) return null;
  if (!isText(meta.name)) errors.push(`${label}: "name" must be a non-empty string`);
  if (!isText(meta.code)) errors.push(`${label}: "code" must be a non-empty string`);
  if (!isText(meta.semester)) errors.push(`${label}: "semester" must be a non-empty string`);
  if (!(isInt(meta.session) || isText(meta.session))) {
    errors.push(`${label}: "session" must be a year (number) or non-empty string`);
  }
  checkUnknownKeys(meta, COURSE_KEYS, label);
  return meta;
}

function validateWeek(file, label) {
  const week = readJson(file, label);
  if (!week) return;
  if (!isText(week.title)) errors.push(`${label}: "title" must be a non-empty string`);
  if (typeof week.description !== 'string') errors.push(`${label}: "description" must be a string`);
  checkUnknownKeys(week, WEEK_KEYS, label);

  if (!Array.isArray(week.questions) || week.questions.length === 0) {
    errors.push(`${label}: "questions" must be a non-empty array`);
    return;
  }

  const seenIds = new Set();
  week.questions.forEach((q, index) => {
    const at = `${label} question #${index + 1}${isInt(q?.id) ? ` (id ${q.id})` : ''}`;
    if (typeof q !== 'object' || q === null) {
      errors.push(`${at}: must be an object`);
      return;
    }

    if (!isInt(q.id)) errors.push(`${at}: "id" must be an integer`);
    else if (seenIds.has(q.id)) errors.push(`${at}: duplicate id ${q.id}`);
    else seenIds.add(q.id);

    if (!isText(q.question)) errors.push(`${at}: "question" must be a non-empty string`);
    else {
      for (const m of q.question.matchAll(IMAGE_REF)) {
        const ref = m[1];
        if (!ref.startsWith('/courses/')) {
          errors.push(`${at}: image reference "${ref}" should start with /courses/<course>/images/...`);
          continue;
        }
        if (!existsSync(join(repoRoot, ref))) {
          errors.push(`${at}: image reference "${ref}" doesn't exist on disk`);
        }
      }
    }

    const optionsOk =
      Array.isArray(q.options) && q.options.length >= 2 && q.options.every(isText);
    if (!optionsOk) errors.push(`${at}: "options" must be an array of at least 2 non-empty strings`);
    else if (new Set(q.options.map((o) => o.trim())).size !== q.options.length) {
      warnings.push(`${at}: duplicate option text`);
    }

    if (!('correctOption' in q)) {
      errors.push(`${at}: missing "correctOption"`);
    } else if (optionsOk) {
      const co = q.correctOption;
      const list = Array.isArray(co) ? co : [co];
      if (Array.isArray(co) && co.length === 0) errors.push(`${at}: "correctOption" array is empty`);
      if (Array.isArray(co) && new Set(co).size !== co.length) {
        errors.push(`${at}: "correctOption" has duplicate indices ${JSON.stringify(co)}`);
      }
      for (const index of list) {
        if (!isInt(index) || index < 0 || index >= q.options.length) {
          errors.push(
            `${at}: "correctOption" ${JSON.stringify(co)} is not a valid 0-based index into ${q.options.length} options`,
          );
          break;
        }
      }
    }

    checkUnknownKeys(q, QUESTION_KEYS, at);
  });
}

if (!existsSync(root)) {
  console.error('courses/ directory not found');
  process.exit(1);
}

const seenCourses = new Map(); // "code|session" -> folder id
let courseCount = 0;
let weekCount = 0;
let questionCount = 0;

for (const id of readdirSync(root).sort()) {
  const dir = join(root, id);
  if (!statSync(dir).isDirectory()) continue;
  courseCount++;

  const meta = validateCourseMeta(dir, id);
  if (meta && isText(meta.code)) {
    const key = `${meta.code}|${meta.session}`;
    if (seenCourses.has(key)) {
      errors.push(`${id}: same code+session as "${seenCourses.get(key)}" (${meta.code}, ${meta.session})`);
    } else {
      seenCourses.set(key, id);
    }
  }

  const files = readdirSync(dir).filter((f) => f !== 'course.json' && f.endsWith('.json'));
  const weekFiles = files.filter((f) => /^week_\d+\.json$/.test(f));
  for (const f of files.filter((f) => !weekFiles.includes(f))) {
    warnings.push(`${id}/${f}: ignored (week files must be named week_<number>.json)`);
  }
  if (weekFiles.length === 0) warnings.push(`${id}: no week_<number>.json files`);

  for (const f of weekFiles) {
    weekCount++;
    const before = errors.length;
    validateWeek(join(dir, f), `${id}/${f}`);
    if (errors.length === before) {
      questionCount += JSON.parse(readFileSync(join(dir, f), 'utf8')).questions.length;
    }
  }
}

for (const w of warnings) console.warn(`warning: ${w}`);
for (const e of errors) console.error(`error:   ${e}`);

if (errors.length > 0) {
  console.error(`\n${errors.length} error(s), ${warnings.length} warning(s). Fix the data above.`);
  process.exit(1);
}
console.log(
  `courses OK: ${courseCount} course(s), ${weekCount} week(s), ${questionCount} question(s)` +
    (warnings.length ? `, ${warnings.length} warning(s)` : ''),
);
