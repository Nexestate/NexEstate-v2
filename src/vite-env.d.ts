/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** Production app URL — set to https://nexestate.co on Vercel */
  readonly VITE_APP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
// AGENT-GIT start | git-ok git git version 2.55.0.windows.4 | CMD rev-parse --abbrev-ref HEAD => 0 | main | CMD rev-parse HEAD => 0 | f3c3f161c59a29134df3b01c760ff925dbd27b67 | CMD status --porcelain => 0 | M git-status-out.txt ?? src/_agent_git.cjs ?? src/_agent_git.txt ?? src/_run_tsc.cjs ?? src/tsc-local-errors.txt | CMD diff --stat HEAD -- src/lib/services/propertiesService.ts src/pages/broker/PropertyDetailPage.tsx => 0
