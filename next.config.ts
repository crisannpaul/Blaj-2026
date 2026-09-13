import type { NextConfig } from "next";

/**
 * `NEXT_DIST_DIR` lets a second build live beside `.next` so two variants can
 * be served at once — `next start` reads its dist dir at RUNTIME, and
 * rebuilding `.next` under a running server hands it mixed content with no
 * error (CLAUDE.md). Unset, it is the default `.next`; `.gitignore` already
 * covers `/.next-*`. Set it for BOTH the build and the start:
 *   NEXT_DIST_DIR=.next-b npm run build && NEXT_DIST_DIR=.next-b npx next start -p 3003
 */
const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
