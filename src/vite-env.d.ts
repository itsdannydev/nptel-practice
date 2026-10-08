/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Microsoft Clarity project ID. Set in Vercel's project env vars; unset disables it. */
  readonly VITE_CLARITY_ID?: string;
  /** Google Analytics (GA4) measurement ID, e.g. "G-XXXXXXX". Unset disables it. */
  readonly VITE_GA_MEASUREMENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
