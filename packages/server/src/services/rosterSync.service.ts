// TeamTime roster → StaffUser sync (reworked from the preserved
// agentSync.service: ListingAgent is gone; staff identity lives on
// StaffUser keyed by teamtimeUserId — Standards §1/§3).
//
// Pulls GET {TEAMTIME_URL}/api/staff (bearer TEAMTIME_API_SECRET; the
// endpoint exists on TeamTime dev as of commit 66befaf) and upserts active
// schedulable staff. TeamTime-sourced users no longer present are
// deactivated; manual users are never touched.

import { prisma } from '../db/prisma.js';
import { env } from '../config/env.js';
import { logger } from '../util/logger.js';

interface TeamTimeStaff {
  id: string;
  name: string;
  active: boolean;
  email?: string;
  role?: string;
  canListOnEbay?: boolean;
}

export interface RosterSyncResult {
  synced: number;
  deactivated: number;
  skipped: boolean;
}

export async function syncRoster(): Promise<RosterSyncResult> {
  if (!env.TEAMTIME_URL || !env.TEAMTIME_API_SECRET) {
    logger.info('roster sync skipped: TEAMTIME_URL/TEAMTIME_API_SECRET not configured');
    return { synced: 0, deactivated: 0, skipped: true };
  }

  const res = await fetch(`${env.TEAMTIME_URL}/api/staff`, {
    headers: { authorization: `Bearer ${env.TEAMTIME_API_SECRET}` },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`TeamTime /api/staff -> ${res.status}`);
  const data = (await res.json()) as { staff?: TeamTimeStaff[] } | TeamTimeStaff[];
  const staff = Array.isArray(data) ? data : (data.staff ?? []);

  const seen = new Set<string>();
  let synced = 0;
  for (const s of staff) {
    if (!s.id || !s.name) continue;
    seen.add(s.id);
    await prisma.staffUser.upsert({
      where: { teamtimeUserId: s.id },
      create: {
        teamtimeUserId: s.id,
        name: s.name,
        email: s.email?.toLowerCase(),
        role: s.role ?? 'staff',
        canListOnEbay: s.canListOnEbay ?? false,
        active: s.active !== false,
        source: 'teamtime',
        lastSyncedAt: new Date(),
      },
      update: {
        name: s.name,
        role: s.role ?? undefined,
        canListOnEbay: s.canListOnEbay ?? undefined,
        active: s.active !== false,
        lastSyncedAt: new Date(),
      },
    });
    synced++;
  }

  const deactivated = await prisma.staffUser.updateMany({
    where: { source: 'teamtime', active: true, teamtimeUserId: { notIn: [...seen] } },
    data: { active: false },
  });

  logger.info({ synced, deactivated: deactivated.count }, 'roster sync complete');
  return { synced, deactivated: deactivated.count, skipped: false };
}
