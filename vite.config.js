import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Clerk's publishable key, exposed to the app as VITE_CLERK_PUBLISHABLE_KEY.
//
// It is defined here rather than in a .env file because `.env` and `.env.*` are
// gitignored, so a .env would work in a sandbox and then silently vanish on a
// fresh checkout or deploy -- taking sign-in with it. Base44's secrets store is
// not an option either: it feeds the backend Deno runtime, not the Vite build.
//
// A publishable key is public by design, so committing it is safe. The matching
// SECRET key must never appear in this repo.
const CLERK_PUBLISHABLE_KEY =
  process.env.VITE_CLERK_PUBLISHABLE_KEY
  || 'pk_test_d2VsbC1zY3VscGluLTg4MTMuY2xlcmsuYWNjb3VudHMuZGV2JA';

// https://vite.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(CLERK_PUBLISHABLE_KEY),
  },
  plugins: [
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
    react(),
  ]
});
