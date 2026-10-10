import fs from 'node:fs';
import path from 'node:path';

/**
 * Loads the MongoDB URI from environment variables or local .env files.
 * Ensures zero hardcoded database passwords exist in scripts.
 */
export function getMongoUri() {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  const envFiles = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), 'apps/web/.env.local'),
    path.resolve(process.cwd(), '.env'),
  ];

  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const idx = trimmed.indexOf('=');
        if (idx !== -1 && trimmed.slice(0, idx).trim() === 'MONGODB_URI') {
          return trimmed.slice(idx + 1).trim();
        }
      }
    }
  }

  throw new Error('MONGODB_URI environment variable is required. Please set MONGODB_URI in .env.local.');
}
