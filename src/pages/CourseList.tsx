import { useState } from 'react';
import { Link } from 'react-router-dom';
import { courses, termLabel } from '../lib/courses';
import { useTitle } from '../lib/useTitle';

export default function CourseList() {
  useTitle('');

  const [query, setQuery] = useState('');
  const normalized = query.trim().toLowerCase();
  const visible = normalized
    ? courses.filter(
        (course) =>
          course.name.toLowerCase().includes(normalized) ||
          course.code.toLowerCase().includes(normalized),
      )
    : courses;

  return (
    <div className="prose">
      <h1>NPTEL Practice</h1>
      <p className="lede">
        Practice NPTEL course quizzes by week, in Practice, Quiz, or Mock Test mode.
      </p>
      <h2>Courses</h2>

      {courses.length === 0 ? (
        <p className="empty">
          No courses yet. Add a folder with a <code>course.json</code> and <code>week_N.json</code>{' '}
          files under <code>courses/</code>.
        </p>
      ) : (
        <>
          <label className="sr-only" htmlFor="course-search">
            Search courses
          </label>
          <input
            id="course-search"
            type="search"
            className="search-input"
            placeholder="Search courses by name or code…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {visible.length === 0 ? (
            <p className="empty">No courses match "{query.trim()}".</p>
          ) : (
            <ul className="card-list">
              {visible.map((course) => (
                <li key={course.id}>
                  <Link to={`/c/${course.id}`} className="card">
                    <span className="card-title">{course.name}</span>
                    <span className="card-meta">
                      <span>
                        {course.code} · {course.weekNumbers.length}{' '}
                        {course.weekNumbers.length === 1 ? 'week' : 'weeks'}
                      </span>
                      <span className="card-term">{termLabel(course)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
