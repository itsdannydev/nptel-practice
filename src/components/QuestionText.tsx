import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { courseImages } from '../lib/courses';

interface Props {
  text: string;
  id?: string;
  className?: string;
}

// Keep every block-level element as a plain tag (no extra wrapper divs/classes per node) —
// the surrounding .question-heading / .review-q rules in styles.css style them by nesting
// (e.g. ".review-q p", ".question-heading ul"), same as if this were hand-written markup.
// Tables get one exception: a scroll wrapper, since a wide GFM table can overflow a card.
const components: Components = {
  table: ({ children }) => (
    <div className="question-table-wrap">
      <table>{children}</table>
    </div>
  ),
  // A question image, referenced as ![alt](/courses/<course>/images/<file>). Resolved
  // against the glob in lib/courses.ts; an unresolved path renders a visible placeholder
  // instead of a silently-broken <img>, so a typo'd path is obvious while authoring.
  img: ({ src, alt }) => {
    const resolved = typeof src === 'string' ? courseImages[src] : undefined;
    if (!resolved) {
      return (
        <span className="question-image-missing">
          Image not found: <code>{String(src)}</code>
        </span>
      );
    }
    return <img className="question-image" src={resolved} alt={alt ?? ''} loading="lazy" />;
  },
};

/**
 * Renders question text as Markdown (CommonMark + GitHub tables, via remark-gfm): bullet
 * and numbered lists, bold, italic, inline code, links, and tables all just work — no
 * bespoke syntax to maintain. Options stay plain text; only the question itself is markdown.
 */
export default function QuestionText({ text, id, className }: Props) {
  return (
    <div id={id} className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
