import { Link } from 'react-router-dom';
import { useTitle } from '../lib/useTitle';

export default function NotFound({ what = 'page' }: { what?: string }) {
  useTitle('Not found');
  return (
    <section className="empty">
      <h1>That {what} doesn't exist</h1>
      <p>
        <Link to="/">Back to all courses</Link>
      </p>
    </section>
  );
}
