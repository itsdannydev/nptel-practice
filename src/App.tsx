import { HashRouter, Link, Outlet, Route, Routes } from 'react-router-dom';
import CourseList from './pages/CourseList';
import WeekList from './pages/WeekList';
import Quiz from './pages/Quiz';
import MixedQuiz from './pages/MixedQuiz';
import NotFound from './pages/NotFound';

function Layout() {
  return (
    <>
      <header className="site-header">
        <div className="container">
          <Link to="/" className="brand">
            NPTEL Practice
          </Link>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container">
          <p>
            Don't see your course? Email{' '}
            <a href="mailto:dev@danny.co.in">dev@danny.co.in</a> and I'll see what I can do.
          </p>
        </div>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<CourseList />} />
          <Route path="c/:courseId" element={<WeekList />} />
          <Route path="c/:courseId/mixed" element={<MixedQuiz />} />
          <Route path="c/:courseId/w/:week" element={<Quiz />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
