// In-process job scheduler, gated by JOBS_ENABLED=true.
//   - sales sync (Fulfillment getOrders) every 30 min
//   - TeamTime roster sync daily

import { env } from '../config/env.js';
import { logger } from '../util/logger.js';
import { salesSyncService } from '../services/salesSync.service.js';
import { syncRoster } from '../services/rosterSync.service.js';

const SALES_SYNC_MS = 30 * 60 * 1000;
const ROSTER_SYNC_MS = 24 * 60 * 60 * 1000;

export function startScheduler(): void {
  if (!env.JOBS_ENABLED) {
    logger.info('scheduler disabled (JOBS_ENABLED != true)');
    return;
  }

  const runSales = async () => {
    try {
      const results = await salesSyncService.syncAllAccounts();
      if (results.length > 0) logger.info({ results }, 'sales sync run complete');
    } catch (err) {
      logger.error({ err }, 'sales sync run failed');
    }
  };
  const runRoster = async () => {
    try {
      await syncRoster();
    } catch (err) {
      logger.error({ err }, 'roster sync run failed');
    }
  };

  setTimeout(runSales, 15_000);
  setInterval(runSales, SALES_SYNC_MS);
  setTimeout(runRoster, 30_000);
  setInterval(runRoster, ROSTER_SYNC_MS);
  logger.info('scheduler started (sales 30m, roster 24h)');
}
