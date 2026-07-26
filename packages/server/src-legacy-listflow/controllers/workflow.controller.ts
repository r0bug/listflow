import { Response } from 'express';
import { workflowService } from '../services/workflow.service';
import { prisma } from '../config/database';
import { WorkflowStage } from '../../src/generated/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const moveToNextStage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { notes, changes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const updatedItem = await workflowService.moveToNextStage(
      userId,
      id,
      notes,
      changes
    );

    res.json({
      success: true,
      data: updatedItem
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to advance workflow';
    console.error('Error advancing workflow:', error);
    res.status(400).json({
      success: false,
      error: message
    });
  }
};

export const getItemsForStage = async (req: AuthRequest, res: Response) => {
  try {
    const { stage } = req.params;
    const userId = req.user?.id;

    const items = await workflowService.getItemsForStage(
      stage as WorkflowStage,
      userId
    );

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch items'
    });
  }
};

export const getNextItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { currentItemId } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const nextItem = await workflowService.getNextItemForUser(
      userId,
      currentItemId as string
    );

    res.json({
      success: true,
      data: nextItem
    });
  } catch (error) {
    console.error('Error fetching next item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch next item'
    });
  }
};

export const rejectItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required'
      });
    }

    const updatedItem = await workflowService.rejectItem(userId, id, reason);

    res.json({
      success: true,
      data: updatedItem
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to reject item';
    console.error('Error rejecting item:', error);
    res.status(400).json({
      success: false,
      error: message
    });
  }
};

export const sendBackItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { targetStage, reason } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!targetStage || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Target stage and reason are required'
      });
    }

    const updatedItem = await workflowService.sendBackForRevision(
      userId,
      id,
      targetStage as WorkflowStage,
      reason
    );

    res.json({
      success: true,
      data: updatedItem
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send item back';
    console.error('Error sending item back:', error);
    res.status(400).json({
      success: false,
      error: message
    });
  }
};

export const getWorkflowStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await prisma.item.groupBy({
      by: ['stage'],
      _count: { id: true }
    });

    const formattedStats = stats.reduce((acc: Record<string, number>, stat) => {
      acc[stat.stage] = stat._count.id;
      return acc;
    }, {});

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayProcessed = await prisma.workflowAction.count({
      where: { createdAt: { gte: today } }
    });

    res.json({
      success: true,
      data: {
        byStage: formattedStats,
        todayProcessed,
        total: await prisma.item.count()
      }
    });
  } catch (error) {
    console.error('Error fetching workflow stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workflow statistics'
    });
  }
};
