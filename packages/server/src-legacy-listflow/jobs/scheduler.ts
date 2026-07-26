import { salesSyncService } from '../services/salesSync.service';
import { agentSyncService } from '../services/agentSync.service';

const MINUTE = 60000;

interface Job {
  name: string;
  intervalMs: number;
  run: () => Promise<unknown>;
  inFlight?: boolean;
}

const jobs: Job[] = [
  {
    name: 'sales-sync',
    intervalMs: 15 * MINUTE,
    run: () => salesSyncService.syncAllAccounts(),
  },
  {
    name: 'active-listings-sync',
    intervalMs: 60 * MINUTE,
    run: () => salesSyncService.syncActiveListings(),
  },
  {
    name: 'agent-sync',
    intervalMs: 24 * 60 * MINUTE,
    run: () => agentSyncService.syncAgents(),
  },
];

/**
 * Minimal in-process scheduler. Gated behind JOBS_ENABLED=true so dev servers
 * and test runs don't hit eBay. Each job skips a tick if the previous run is
 * still in flight; failures are logged and the schedule keeps going.
 */
export function startScheduler() {
  if (process.env.JOBS_ENABLED !== 'true') {
    console.log('Background jobs disabled (set JOBS_ENABLED=true to enable)');
    return;
  }

  for (const job of jobs) {
    const tick = async () => {
      if (job.inFlight) return;
      job.inFlight = true;
      try {
        const result = await job.run();
        console.log(`[job:${job.name}]`, JSON.stringify(result)?.slice(0, 500));
      } catch (error: any) {
        console.error(`[job:${job.name}] failed:`, error?.message || error);
      } finally {
        job.inFlight = false;
      }
    };
    setInterval(tick, job.intervalMs);
    // Kick off once shortly after boot rather than waiting a full interval
    setTimeout(tick, 15000);
    console.log(`[job:${job.name}] scheduled every ${job.intervalMs / MINUTE}min`);
  }
}
