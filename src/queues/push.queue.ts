import Bull from 'bull';
import { ebayService } from '../services/ebay.service';

export const pushQueue = new Bull('item-push', {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  }
});

pushQueue.process(async (job) => {
  const { itemId, platform } = job.data;
  if (platform === 'ebay') {
    return await ebayService.pushItem(itemId);
  }
  throw new Error(`Unknown platform: ${platform}`);
});

pushQueue.on('failed', (job, err) => {
  console.error(`Push job failed for item ${job.data.itemId}:`, err.message);
});
