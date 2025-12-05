import { PrismaClient, WorkflowStage, UserRole, ItemStatus } from '../../src/generated/prisma';
import { aiService } from './ai.service';

interface WorkflowTransition {
  fromStage: WorkflowStage;
  toStage: WorkflowStage;
  allowedRoles: UserRole[];
  action: string;
}

export class WorkflowService {
  private prisma: PrismaClient;
  
  // Define valid transitions and who can perform them
  private transitions: WorkflowTransition[] = [
    // Photo upload to AI processing
    {
      fromStage: WorkflowStage.PHOTO_UPLOAD,
      toStage: WorkflowStage.AI_PROCESSING,
      allowedRoles: [UserRole.PHOTOGRAPHER, UserRole.MANAGER, UserRole.ADMIN],
      action: 'process'
    },
    // AI processing to review
    {
      fromStage: WorkflowStage.AI_PROCESSING,
      toStage: WorkflowStage.REVIEW_EDIT,
      allowedRoles: [UserRole.PROCESSOR, UserRole.MANAGER, UserRole.ADMIN],
      action: 'complete_ai'
    },
    // Review to pricing
    {
      fromStage: WorkflowStage.REVIEW_EDIT,
      toStage: WorkflowStage.PRICING,
      allowedRoles: [UserRole.PROCESSOR, UserRole.MANAGER, UserRole.ADMIN],
      action: 'approve_description'
    },
    // Pricing to final review
    {
      fromStage: WorkflowStage.PRICING,
      toStage: WorkflowStage.FINAL_REVIEW,
      allowedRoles: [UserRole.PRICER, UserRole.MANAGER, UserRole.ADMIN],
      action: 'set_price'
    },
    // Final review to published
    {
      fromStage: WorkflowStage.FINAL_REVIEW,
      toStage: WorkflowStage.PUBLISHED,
      allowedRoles: [UserRole.PUBLISHER, UserRole.MANAGER, UserRole.ADMIN],
      action: 'publish'
    },
    // Any stage can be rejected
    {
      fromStage: WorkflowStage.REVIEW_EDIT,
      toStage: WorkflowStage.REJECTED,
      allowedRoles: [UserRole.PROCESSOR, UserRole.MANAGER, UserRole.ADMIN],
      action: 'reject'
    },
    {
      fromStage: WorkflowStage.PRICING,
      toStage: WorkflowStage.REJECTED,
      allowedRoles: [UserRole.PRICER, UserRole.MANAGER, UserRole.ADMIN],
      action: 'reject'
    },
    {
      fromStage: WorkflowStage.FINAL_REVIEW,
      toStage: WorkflowStage.REJECTED,
      allowedRoles: [UserRole.PUBLISHER, UserRole.MANAGER, UserRole.ADMIN],
      action: 'reject'
    },
    // Allow going back for revisions
    {
      fromStage: WorkflowStage.PRICING,
      toStage: WorkflowStage.REVIEW_EDIT,
      allowedRoles: [UserRole.PRICER, UserRole.MANAGER, UserRole.ADMIN],
      action: 'send_back'
    },
    {
      fromStage: WorkflowStage.FINAL_REVIEW,
      toStage: WorkflowStage.PRICING,
      allowedRoles: [UserRole.PUBLISHER, UserRole.MANAGER, UserRole.ADMIN],
      action: 'send_back'
    }
  ];

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async canTransition(
    userId: string, 
    itemId: string, 
    toStage: WorkflowStage
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const item = await this.prisma.item.findUnique({ where: { id: itemId } });
    
    if (!user || !item) return false;
    
    const transition = this.transitions.find(
      t => t.fromStage === item.stage && t.toStage === toStage
    );
    
    if (!transition) return false;
    
    return transition.allowedRoles.includes(user.role);
  }

  async moveToNextStage(
    userId: string,
    itemId: string,
    notes?: string,
    changes?: any
  ) {
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      include: { photos: true }
    });
    
    if (!item) throw new Error('Item not found');
    
    let nextStage: WorkflowStage;
    
    switch (item.stage) {
      case WorkflowStage.PHOTO_UPLOAD:
        // Trigger AI processing
        nextStage = WorkflowStage.AI_PROCESSING;
        break;
      case WorkflowStage.AI_PROCESSING:
        nextStage = WorkflowStage.REVIEW_EDIT;
        break;
      case WorkflowStage.REVIEW_EDIT:
        nextStage = WorkflowStage.PRICING;
        break;
      case WorkflowStage.PRICING:
        nextStage = WorkflowStage.FINAL_REVIEW;
        break;
      case WorkflowStage.FINAL_REVIEW:
        nextStage = WorkflowStage.PUBLISHED;
        break;
      default:
        throw new Error('Invalid stage transition');
    }
    
    if (!await this.canTransition(userId, itemId, nextStage)) {
      throw new Error('User not authorized for this transition');
    }
    
    // Start AI processing if moving to AI_PROCESSING stage
    if (nextStage === WorkflowStage.AI_PROCESSING) {
      await this.processWithAI(itemId);
      // Automatically move to REVIEW_EDIT after AI processing
      nextStage = WorkflowStage.REVIEW_EDIT;
    }
    
    // Update item stage and create workflow action record
    const [updatedItem, action] = await this.prisma.$transaction([
      this.prisma.item.update({
        where: { id: itemId },
        data: { 
          stage: nextStage,
          ...(changes || {})
        }
      }),
      this.prisma.workflowAction.create({
        data: {
          itemId,
          userId,
          fromStage: item.stage,
          toStage: nextStage,
          action: 'advance',
          notes,
          changes: changes ? JSON.stringify(changes) : null
        }
      })
    ]);
    
    return updatedItem;
  }

  async processWithAI(itemId: string) {
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      include: { photos: { orderBy: { order: 'asc' } } }
    });
    
    if (!item || item.photos.length === 0) {
      throw new Error('Item not found or has no photos');
    }
    
    // Process primary photo or first photo
    const primaryPhoto = item.photos.find(p => p.isPrimary) || item.photos[0];
    
    try {
      // Analyze the image
      const analysis = await aiService.analyzeImage(primaryPhoto.originalPath);
      
      // Generate listing based on analysis
      const listing = await aiService.generateListing({
        imageAnalysis: analysis,
        category: item.category,
        condition: item.condition
      });
      
      // Update item with AI results
      await this.prisma.item.update({
        where: { id: itemId },
        data: {
          title: listing.title,
          description: listing.description,
          category: analysis.category || item.category,
          condition: analysis.condition || item.condition,
          brand: analysis.brand,
          features: analysis.features || [],
          keywords: listing.tags || [],
          aiAnalysis: analysis
        }
      });
      
      // Update photo with analysis
      await this.prisma.photo.update({
        where: { id: primaryPhoto.id },
        data: {
          analysis: analysis,
          processedAt: new Date()
        }
      });
      
    } catch (error) {
      console.error('AI processing failed:', error);
      
      // Update item status to ERROR
      await this.prisma.item.update({
        where: { id: itemId },
        data: { status: ItemStatus.ERROR }
      });
      
      throw error;
    }
  }

  async getItemsForStage(stage: WorkflowStage, userId?: string) {
    const where: any = { stage };
    
    if (userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      
      // Filter based on user role
      if (user?.role === UserRole.PHOTOGRAPHER) {
        where.createdById = userId;
      }
    }
    
    return this.prisma.item.findMany({
      where,
      include: {
        photos: { orderBy: { order: 'asc' } },
        createdBy: true,
        workflowActions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { user: true }
        }
      },
      orderBy: { createdAt: 'asc' } // FIFO queue
    });
  }

  async getNextItemForUser(userId: string, currentItemId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    
    // Determine which stages this user can work on
    let stages: WorkflowStage[] = [];
    
    switch (user.role) {
      case UserRole.PHOTOGRAPHER:
        stages = [WorkflowStage.PHOTO_UPLOAD];
        break;
      case UserRole.PROCESSOR:
        stages = [WorkflowStage.REVIEW_EDIT];
        break;
      case UserRole.PRICER:
        stages = [WorkflowStage.PRICING];
        break;
      case UserRole.PUBLISHER:
        stages = [WorkflowStage.FINAL_REVIEW];
        break;
      case UserRole.MANAGER:
      case UserRole.ADMIN:
        stages = [
          WorkflowStage.PHOTO_UPLOAD,
          WorkflowStage.REVIEW_EDIT,
          WorkflowStage.PRICING,
          WorkflowStage.FINAL_REVIEW
        ];
        break;
    }
    
    // Find next item in queue for user's stages
    const nextItem = await this.prisma.item.findFirst({
      where: {
        stage: { in: stages },
        status: ItemStatus.ACTIVE,
        id: currentItemId ? { not: currentItemId } : undefined
      },
      include: {
        photos: { orderBy: { order: 'asc' } },
        createdBy: true
      },
      orderBy: { createdAt: 'asc' }
    });
    
    return nextItem;
  }

  async rejectItem(userId: string, itemId: string, reason: string) {
    const item = await this.prisma.item.findUnique({ where: { id: itemId } });
    if (!item) throw new Error('Item not found');
    
    if (!await this.canTransition(userId, itemId, WorkflowStage.REJECTED)) {
      throw new Error('User not authorized to reject items at this stage');
    }
    
    const [updatedItem, action] = await this.prisma.$transaction([
      this.prisma.item.update({
        where: { id: itemId },
        data: { 
          stage: WorkflowStage.REJECTED,
          status: ItemStatus.PAUSED
        }
      }),
      this.prisma.workflowAction.create({
        data: {
          itemId,
          userId,
          fromStage: item.stage,
          toStage: WorkflowStage.REJECTED,
          action: 'reject',
          notes: reason
        }
      })
    ]);
    
    return updatedItem;
  }

  async sendBackForRevision(
    userId: string, 
    itemId: string, 
    targetStage: WorkflowStage,
    reason: string
  ) {
    const item = await this.prisma.item.findUnique({ where: { id: itemId } });
    if (!item) throw new Error('Item not found');
    
    if (!await this.canTransition(userId, itemId, targetStage)) {
      throw new Error('User not authorized to send item back to this stage');
    }
    
    const [updatedItem, action] = await this.prisma.$transaction([
      this.prisma.item.update({
        where: { id: itemId },
        data: { stage: targetStage }
      }),
      this.prisma.workflowAction.create({
        data: {
          itemId,
          userId,
          fromStage: item.stage,
          toStage: targetStage,
          action: 'send_back',
          notes: reason
        }
      })
    ]);
    
    return updatedItem;
  }
}

export const workflowService = new WorkflowService(
  new PrismaClient()
);