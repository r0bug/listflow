import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { z } from 'zod';

// Walk up from cwd to find the nearest .env (lets the server run from any dir).
function findEnv(start: string): string | null {
  let cur = start;
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(cur, '.env');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return null;
}
const envPath = findEnv(process.cwd());
if (envPath) dotenv.config({ path: envPath });

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3005),
  DATABASE_URL: z.string().url().or(z.string().startsWith('postgresql://')),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),

  // Standards §4: single file root; DB stores paths relative to this.
  FILE_ROOT: z.string().min(1),
  PUBLIC_IMAGE_BASE_URL: z.string().default('http://localhost:3005'),

  // Dev-only local login (until the TeamTime credential proxy lands in
  // phase 3). Explicit opt-in flag — NOT keyed off NODE_ENV (Standards §8).
  DEV_AUTH_ENABLED: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),

  // TeamTime credential proxy (phase 3) + roster sync
  TEAMTIME_URL: z.string().optional(),
  TEAMTIME_API_SECRET: z.string().optional(),

  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-4-6'),
  AI_PROVIDER: z.enum(['anthropic', 'external-mcp', 'mock']).optional(),
  AI_BATCH_SIZE: z.coerce.number().default(20),

  IMAGE_MIRROR: z.enum(['', 's3']).default(''),
});

export const env = EnvSchema.parse(process.env);
