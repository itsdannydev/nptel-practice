// Microsoft Clarity + Google Analytics (GA4), loaded only when their IDs are configured
// via env vars (set in Vercel's project settings — never committed to the repo) AND only
// in a production build. A normal `npm run dev` session never fires either tracker,
// regardless of what's in a local .env file, so local testing never pollutes real data.

declare global {
  interface Window {
    clarity?: ClarityFn;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type ClarityFn = {
  (...args: unknown[]): void;
  q?: unknown[][];
};

function loadClarity(projectId: string): void {
  const clarity: ClarityFn = (...args: unknown[]) => {
    (clarity.q = clarity.q ?? []).push(args);
  };
  window.clarity = clarity;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${projectId}`;
  document.head.appendChild(script);
}

function loadGoogleAnalytics(measurementId: string): void {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = (...args: unknown[]) => {
    window.dataLayer?.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId);
}

/** Call once at app startup (see main.tsx). No-op for any tracker whose ID isn't set,
 * and a no-op entirely outside a production build. */
export function initAnalytics(): void {
  if (!import.meta.env.PROD) return;

  const clarityId = import.meta.env.VITE_CLARITY_ID;
  if (clarityId) loadClarity(clarityId);

  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (gaId) loadGoogleAnalytics(gaId);
}
