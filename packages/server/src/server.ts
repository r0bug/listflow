import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { pinoHttp } from 'pino-http';

// Resolve workspace-root paths regardless of cwd. server.ts lives at
// packages/server/src/server.ts → workspace root is 3 levels up.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.resolve(__dirname, '..', '..', '..');
const r = (p: string) => (path.isAbsolute(p) ? p : path.resolve(WORKSPACE_ROOT, p));
import { env } from './config/env.js';
import { logger } from './util/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import ingestRoutes from './routes/ingest.routes.js';
import itemsRoutes from './routes/items.routes.js';
import poolRoutes from './routes/pool.routes.js';
import groupsRoutes from './routes/groups.routes.js';
import photosRoutes from './routes/photos.routes.js';
import draftsRoutes from './routes/drafts.routes.js';
import extensionRoutes from './routes/extension.routes.js';
import devicesRoutes from './routes/devices.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import salesRoutes from './routes/sales.routes.js';
import ebayAccountsRoutes from './routes/ebayAccounts.routes.js';
import compsRoutes from './routes/comps.routes.js';
import ebayOauthRoutes from './routes/ebayOauth.routes.js';
import collectionsRoutes from './routes/collections.routes.js';
import { startScheduler } from './jobs/scheduler.js';

const app = express();

app.use(pinoHttp({ logger }));
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

// Static (Standards §4): hosted per-item images live under
// FILE_ROOT/photos/items and are served at /i/<year>/<slug>/imageN.jpg —
// exactly the URLs imageHosting writes onto Photo.publicUrl for eBay drafts.
const FILE_ROOT = path.resolve(env.FILE_ROOT);
const itemImagesDir = path.join(FILE_ROOT, 'photos', 'items');
const distDir = r('dist');
fs.mkdirSync(itemImagesDir, { recursive: true });
fs.mkdirSync(distDir, { recursive: true });
app.use('/i', express.static(itemImagesDir, { immutable: true, maxAge: '7d' }));
// dist/ holds the install landing page + extension zip.
app.use('/dist', express.static(distDir));
// Mobile upload PWA (staff-only surface: static shell is public, every API
// call it makes requires a staff JWT).
app.use('/m', express.static(path.resolve(__dirname, '..', '..', 'mobile-upload')));
// Field comps PWA (offline pick-prep collections).
app.use('/f', express.static(path.resolve(__dirname, '..', '..', 'field')));

app.use('/api/v1', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/ingest', ingestRoutes);
app.use('/api/v1/items', itemsRoutes);
app.use('/api/v1/pool', poolRoutes);
app.use('/api/v1/groups', groupsRoutes);
app.use('/api/v1/photos', photosRoutes);
app.use('/api/v1/drafts', draftsRoutes);
app.use('/api/v1/extension', extensionRoutes);
app.use('/api/v1/devices', devicesRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/sales', salesRoutes);
app.use('/api/v1/ebay-accounts', ebayAccountsRoutes);
app.use('/api/v1/comps', compsRoutes);
app.use('/api/v1/ebay/oauth', ebayOauthRoutes);
app.use('/api/v1/collections', collectionsRoutes);

app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'listflow server started');
  startScheduler();
});
