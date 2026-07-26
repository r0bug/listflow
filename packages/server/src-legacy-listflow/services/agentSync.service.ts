import { prisma } from '../config/database';

interface TeamTimeStaff {
  id: string | number;
  name: string;
  email?: string | null;
  active: boolean;
}

/**
 * Pulls staff from TeamTime's bearer-guarded GET /api/staff and upserts them
 * as ListingAgent rows keyed on teamtimeUserId. Names/active state follow
 * TeamTime; commission rates are ListFlow-owned and never overwritten here.
 * Agents missing from the response are deactivated, never deleted.
 */
class AgentSyncService {
  async syncAgents() {
    const baseUrl = process.env.TEAMTIME_URL;
    const secret = process.env.TEAMTIME_API_SECRET;
    if (!baseUrl || !secret) {
      throw new Error('TEAMTIME_URL / TEAMTIME_API_SECRET not configured');
    }

    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/staff`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    if (!response.ok) {
      throw new Error(`TeamTime staff fetch failed: HTTP ${response.status}`);
    }
    const staff: TeamTimeStaff[] = await response.json();

    const now = new Date();
    let created = 0;
    let updated = 0;

    for (const person of staff) {
      const teamtimeUserId = String(person.id);
      const existing = await prisma.listingAgent.findUnique({ where: { teamtimeUserId } });
      if (existing) {
        await prisma.listingAgent.update({
          where: { teamtimeUserId },
          data: {
            name: person.name,
            email: person.email ?? existing.email,
            active: person.active,
            lastSyncedAt: now,
          },
        });
        updated++;
      } else {
        await prisma.listingAgent.create({
          data: {
            teamtimeUserId,
            name: person.name,
            email: person.email ?? null,
            active: person.active,
            source: 'teamtime',
            lastSyncedAt: now,
          },
        });
        created++;
      }
    }

    // Deactivate teamtime-sourced agents no longer in the staff list
    const seenIds = staff.map((s) => String(s.id));
    const { count: deactivated } = await prisma.listingAgent.updateMany({
      where: {
        source: 'teamtime',
        active: true,
        teamtimeUserId: { notIn: seenIds },
      },
      data: { active: false },
    });

    return { created, updated, deactivated, total: staff.length };
  }
}

export const agentSyncService = new AgentSyncService();
