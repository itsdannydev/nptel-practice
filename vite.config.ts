/// <reference types="node" />
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Injects Clarity/GA4 as real static <script> tags at build time, from the same
// VITE_CLARITY_ID / VITE_GA_MEASUREMENT_ID env vars (set in Vercel, never committed).
// This has to be a static tag in the HTML, not a script inserted at runtime via JS —
// gtag.js silently drops its own tracking hit (initializes, but never actually sends
// the measurement request) when it detects it was added dynamically rather than
// discovered as a normal parsed <script> tag. Confirmed by testing both forms directly
// against the real Measurement ID: only the static tag ever produced a real hit.
// `apply: 'build'` keeps this out of `vite dev` entirely, so local dev never tracks,
// regardless of what's in a local .env file.
function analyticsPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'inject-analytics-tags',
    apply: 'build',
    transformIndexHtml(html) {
      const tags: string[] = [];

      if (env.VITE_CLARITY_ID) {
        tags.push(`<script type="text/javascript">
      (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${env.VITE_CLARITY_ID}");
    </script>`);
      }

      if (env.VITE_GA_MEASUREMENT_ID) {
        tags.push(`<script async src="https://www.googletagmanager.com/gtag/js?id=${env.VITE_GA_MEASUREMENT_ID}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${env.VITE_GA_MEASUREMENT_ID}');
    </script>`);
      }

      return tags.length === 0 ? html : html.replace('</head>', `${tags.join('\n    ')}\n  </head>`);
    },
  };
}

// base './' + HashRouter lets the built site work from any static host or sub-path.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    base: './',
    plugins: [react(), analyticsPlugin(env)],
  };
});
