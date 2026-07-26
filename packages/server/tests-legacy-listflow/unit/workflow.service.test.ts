import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkflowService } from '../../src/services/workflow.service';

// Mock PrismaClient
const mockPrisma = {
  user: { findUnique: vi.fn() },
  item: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
  photo: { update: vi.fn() },
  workflowAction: { create: vi.fn() },
  $transaction: vi.fn(),
} as any;

describe('WorkflowService', () => {
  let service: WorkflowService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new WorkflowService(mockPrisma);
  });

  describe('canTransition', () => {
    it('should allow PHOTOGRAPHER to advance from PHOTO_UPLOAD to AI_PROCESSING', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: 'PHOTOGRAPHER',
      });
      mockPrisma.item.findUnique.mockResolvedValue({
        id: 'item-1',
        stage: 'PHOTO_UPLOAD',
      });

      const result = await service.canTransition('user-1', 'item-1', 'AI_PROCESSING' as any);
      expect(result).toBe(true);
    });

    it('should deny PHOTOGRAPHER from advancing REVIEW_EDIT', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: 'PHOTOGRAPHER',
      });
      mockPrisma.item.findUnique.mockResolvedValue({
        id: 'item-1',
        stage: 'REVIEW_EDIT',
      });

      const result = await service.canTransition('user-1', 'item-1', 'PRICING' as any);
      expect(result).toBe(false);
    });

    it('should allow ADMIN to transition any stage', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        role: 'ADMIN',
      });
      mockPrisma.item.findUnique.mockResolvedValue({
        id: 'item-1',
        stage: 'PRICING',
      });

      const result = await service.canTransition('admin-1', 'item-1', 'FINAL_REVIEW' as any);
      expect(result).toBe(true);
    });

    it('should return false if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.item.findUnique.mockResolvedValue({ id: 'item-1', stage: 'PRICING' });

      const result = await service.canTransition('unknown', 'item-1', 'FINAL_REVIEW' as any);
      expect(result).toBe(false);
    });

    it('should return false if item not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', role: 'ADMIN' });
      mockPrisma.item.findUnique.mockResolvedValue(null);

      const result = await service.canTransition('user-1', 'unknown', 'FINAL_REVIEW' as any);
      expect(result).toBe(false);
    });

    it('should return false for invalid transition', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: 'ADMIN',
      });
      mockPrisma.item.findUnique.mockResolvedValue({
        id: 'item-1',
        stage: 'PHOTO_UPLOAD',
      });

      // Can't skip directly to PUBLISHED from PHOTO_UPLOAD
      const result = await service.canTransition('user-1', 'item-1', 'PUBLISHED' as any);
      expect(result).toBe(false);
    });
  });

  describe('moveToNextStage', () => {
    it('should throw if item not found', async () => {
      mockPrisma.item.findUnique.mockResolvedValue(null);

      await expect(service.moveToNextStage('user-1', 'missing-item'))
        .rejects.toThrow('Item not found');
    });
  });

  describe('getNextItemForUser', () => {
    it('should throw if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getNextItemForUser('unknown'))
        .rejects.toThrow('User not found');
    });

    it('should query correct stages for PROCESSOR role', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: 'PROCESSOR',
      });
      mockPrisma.item.findFirst.mockResolvedValue(null);

      await service.getNextItemForUser('user-1');

      expect(mockPrisma.item.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            stage: { in: ['REVIEW_EDIT'] },
          }),
        })
      );
    });

    it('should query all stages for ADMIN role', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        role: 'ADMIN',
      });
      mockPrisma.item.findFirst.mockResolvedValue(null);

      await service.getNextItemForUser('admin-1');

      expect(mockPrisma.item.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            stage: {
              in: ['PHOTO_UPLOAD', 'REVIEW_EDIT', 'PRICING', 'FINAL_REVIEW'],
            },
          }),
        })
      );
    });
  });

  describe('rejectItem', () => {
    it('should throw if item not found', async () => {
      mockPrisma.item.findUnique.mockResolvedValue(null);

      await expect(service.rejectItem('user-1', 'missing', 'reason'))
        .rejects.toThrow('Item not found');
    });
  });
});
