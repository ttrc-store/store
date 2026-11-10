#!/bin/bash
set -e
# Build script for Cloudflare Pages (run from monorepo root)
pnpm install --frozen-lockfile
pnpm --filter @ttrc/web exec next build
pnpm --filter @ttrc/web exec next-on-pages
