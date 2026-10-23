import { Analytics } from '@vercel/analytics/react';
import { BrowserRouter, Link, Outlet, Route, Routes } from 'react-router-dom';
import CourseList from './pages/CourseList';
import WeekList from './pages/WeekList';
import Quiz from './pages/Quiz';
import MixedQuiz from './pages/MixedQuiz';
import WrongAnswerPractice from './pages/WrongAnswerPractice';
import WrongAnswerList from './pages/WrongAnswerList';
import NotFound from './pages/NotFound';
import { useCanonical } from './lib/useCanonical';

function Layout() {
  useCanonical();

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
          <p className="site-disclaimer">
            Course and quiz content is from{' '}
            <a href="https://nptel.ac.in" target="_blank" rel="noopener noreferrer">
              NPTEL
            </a>{' '}
            (CC BY-NC-SA), used non-commercially and without official affiliation or
            endorsement.
          </p>
        </div>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<CourseList />} />
          <Route path="c/:courseId" element={<WeekList />} />
          <Route path="c/:courseId/mixed" element={<MixedQuiz />} />
          <Route path="c/:courseId/wrong" element={<WrongAnswerPractice />} />
          <Route path="c/:courseId/wrong/list" element={<WrongAnswerList />} />
          <Route path="c/:courseId/w/:week" element={<Quiz />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Analytics />
    </BrowserRouter>
  );
}
