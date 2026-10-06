import { useEffect, useRef, useState } from 'react';
import { QUIZ_MODE_HINTS, QUIZ_MODE_LABELS, QUIZ_MODES } from '../lib/types';

/** A small "i" button next to the mode radios: hover previews the comparison,
 * click pins it open (so it also works on touch, which has no hover). */
export default function ModeInfoButton() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className={`mode-info${open ? ' open' : ''}`} ref={wrapRef}>
      <button
        type="button"
        className="mode-info-btn"
        aria-expanded={open}
        aria-controls="mode-info-panel"
        aria-label="What's the difference between the quiz modes?"
        onClick={() => setOpen((v) => !v)}
      >
        i
      </button>
      <div
        className="mode-info-panel"
        id="mode-info-panel"
        role="dialog"
        aria-label="Quiz modes explained"
      >
        {QUIZ_MODES.map((m) => (
          <p key={m} className="mode-info-row">
            <strong>{QUIZ_MODE_LABELS[m]}</strong> — {QUIZ_MODE_HINTS[m]}
          </p>
        ))}
      </div>
    </div>
  );
}
