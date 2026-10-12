import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ORIGIN = 'https://nptel.danny.co.in';

// index.html has no static <link rel="canonical"> — with real per-route URLs now
// (see BrowserRouter in App.tsx), a canonical hardcoded to the root would tell
// crawlers every page's "real" URL is the homepage, undoing the point of routing.
// This sets one per route instead. It only adds the tag (never edits an existing
// one), since Google documents that it may ignore a canonical that JS *changes*
// but trusts one JS *adds* when none was present in the initial HTML.
export function useCanonical(): void {
  const location = useLocation();

  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = `${ORIGIN}${location.pathname}`;
  }, [location.pathname]);
}
