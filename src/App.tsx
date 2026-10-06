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
