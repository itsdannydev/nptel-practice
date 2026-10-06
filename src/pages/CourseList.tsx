import { Link } from 'react-router-dom';
import { courses } from '../lib/courses';
import { useTitle } from '../lib/useTitle';

export default function CourseList() {
  useTitle('');

  return (
    <>
      <h1>Courses</h1>
      <p className="lede">Pick a course, choose a week, and practice its quiz.</p>

      {courses.length === 0 ? (
        <p className="empty">
          No courses yet. Add a folder with a <code>course.json</code> and <code>week_N.json</code>{' '}
          files under <code>courses/</code>.
        </p>
      ) : (
        <ul className="card-list">
          {courses.map((course) => (
            <li key={course.id}>
              <Link to={`/c/${course.id}`} className="card">
                <span className="card-title">{course.name}</span>
                <span className="card-meta">
                  {course.code} · {course.session} · {course.weekNumbers.length}{' '}
                  {course.weekNumbers.length === 1 ? 'week' : 'weeks'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
