import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

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
