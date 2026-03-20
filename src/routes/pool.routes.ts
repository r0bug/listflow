import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { prisma } from '../config/database';
import { workflowService } from '../services/workflow.service';

const router = Router();

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../../uploads');
const thumbDir = path.join(uploadDir, 'thumbnails');
[uploadDir, thumbDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'pool-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB for large phone photos
  fileFilter: (_req, file, cb) => {
    const allowedExt = /jpeg|jpg|png|gif|webp|heic|heif/;
    const allowedMime = /jpeg|jpg|png|gif|webp|heic|heif|octet-stream/;
    if (allowedExt.test(path.extname(file.originalname).toLowerCase()) && allowedMime.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpg, png, webp, heic)'));
    }
  },
});

// POST /api/pool/upload - Upload one or more photos to the pool
router.post('/upload', upload.array('photos', 20), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    const results = [];

    for (const file of files) {
      // Generate thumbnail
      const thumbFilename = 'thumb-' + path.basename(file.filename);
      const thumbPath = path.join(thumbDir, thumbFilename);

      let thumbGenerated = false;
      try {
        await sharp(file.path)
          .resize(300, 300, { fit: 'cover' })
          .jpeg({ quality: 70 })
          .toFile(thumbPath);
        thumbGenerated = true;
      } catch {
        // If sharp fails, continue without thumbnail
      }

      const pooledPhoto = await prisma.pooledPhoto.create({
        data: {
          originalPath: `/uploads/${file.filename}`,
          thumbnailPath: thumbGenerated ? `/uploads/thumbnails/${thumbFilename}` : null,
          filename: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          uploadedById: (req as any).userId || null,
        },
      });

      results.push(pooledPhoto);
    }

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Pool upload error:', error);
    res.status(500).json({ success: false, error: 'Upload failed' });
  }
});

// GET /api/pool/photos - List all pooled (ungrouped) photos
router.get('/photos', async (_req: Request, res: Response) => {
  try {
    const photos = await prisma.pooledPhoto.findMany({
      where: { groupTag: null },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: photos });
  } catch (error) {
    console.error('Pool list error:', error);
    res.status(500).json({ success: false, error: 'Failed to list photos' });
  }
});

// GET /api/pool/groups - List all photo groups (photos with groupTags)
router.get('/groups', async (_req: Request, res: Response) => {
  try {
    const grouped = await prisma.pooledPhoto.findMany({
      where: { groupTag: { not: null } },
      orderBy: { createdAt: 'asc' },
    });

    // Organize by groupTag
    const groups: Record<string, typeof grouped> = {};
    for (const photo of grouped) {
      const tag = photo.groupTag!;
      if (!groups[tag]) groups[tag] = [];
      groups[tag].push(photo);
    }

    res.json({ success: true, data: groups });
  } catch (error) {
    console.error('Pool groups error:', error);
    res.status(500).json({ success: false, error: 'Failed to list groups' });
  }
});

// POST /api/pool/group - Assign photos to a group
router.post('/group', async (req: Request, res: Response) => {
  try {
    const { photoIds, groupTag } = req.body;
    if (!photoIds || !Array.isArray(photoIds) || !groupTag) {
      return res.status(400).json({ success: false, error: 'photoIds array and groupTag required' });
    }

    await prisma.pooledPhoto.updateMany({
      where: { id: { in: photoIds } },
      data: { groupTag },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Pool group error:', error);
    res.status(500).json({ success: false, error: 'Failed to group photos' });
  }
});

// POST /api/pool/ungroup - Remove photos from their group (back to ungrouped)
router.post('/ungroup', async (req: Request, res: Response) => {
  try {
    const { photoIds } = req.body;
    if (!photoIds || !Array.isArray(photoIds)) {
      return res.status(400).json({ success: false, error: 'photoIds array required' });
    }

    await prisma.pooledPhoto.updateMany({
      where: { id: { in: photoIds } },
      data: { groupTag: null },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Pool ungroup error:', error);
    res.status(500).json({ success: false, error: 'Failed to ungroup photos' });
  }
});

// DELETE /api/pool/photos/:id - Delete a pooled photo
router.delete('/photos/:id', async (req: Request, res: Response) => {
  try {
    const photo = await prisma.pooledPhoto.findUnique({ where: { id: req.params.id } });
    if (!photo) {
      return res.status(404).json({ success: false, error: 'Photo not found' });
    }

    // Delete files from disk
    const originalFile = path.join(__dirname, '../..', photo.originalPath);
    if (fs.existsSync(originalFile)) fs.unlinkSync(originalFile);
    if (photo.thumbnailPath) {
      const thumbFile = path.join(__dirname, '../..', photo.thumbnailPath);
      if (fs.existsSync(thumbFile)) fs.unlinkSync(thumbFile);
    }

    await prisma.pooledPhoto.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Pool delete error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete photo' });
  }
});

// DELETE /api/pool/groups/:groupTag - Delete an entire group (photos go back to ungrouped)
router.delete('/groups/:groupTag', async (req: Request, res: Response) => {
  try {
    await prisma.pooledPhoto.updateMany({
      where: { groupTag: req.params.groupTag },
      data: { groupTag: null },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Pool delete group error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete group' });
  }
});

// POST /api/pool/create-items - Create Items from all groups, attach photos, trigger AI
router.post('/create-items', async (req: Request, res: Response) => {
  try {
    const { groupTags, skipAi } = req.body as { groupTags?: string[]; skipAi?: boolean };

    // Find all groups (either specified tags or all existing groups)
    const where = groupTags && groupTags.length > 0
      ? { groupTag: { in: groupTags } }
      : { groupTag: { not: null } };

    const pooledPhotos = await prisma.pooledPhoto.findMany({
      where: where as any,
      orderBy: { createdAt: 'asc' },
    });

    if (pooledPhotos.length === 0) {
      return res.status(400).json({ success: false, error: 'No grouped photos found' });
    }

    // Organize by groupTag
    const groups: Record<string, typeof pooledPhotos> = {};
    for (const photo of pooledPhotos) {
      if (!photo.groupTag) continue;
      if (!groups[photo.groupTag]) groups[photo.groupTag] = [];
      groups[photo.groupTag].push(photo);
    }

    // Get a default location
    const location = await prisma.location.findFirst({ where: { isActive: true } });
    if (!location) {
      return res.status(400).json({ success: false, error: 'No active location found. Create a location first.' });
    }

    // Get first user as creator (pool doesn't require auth currently)
    const creator = await prisma.user.findFirst();
    if (!creator) {
      return res.status(400).json({ success: false, error: 'No users found. Create a user first.' });
    }

    const createdItems = [];
    const errors: { groupTag: string; error: string }[] = [];

    for (const [groupTag, photos] of Object.entries(groups)) {
      try {
        // Generate SKU
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 5).toUpperCase();
        const sku = `LF-${timestamp}-${random}`;

        // Create Item
        // Load listing defaults from location settings
        const locationSettings = (location as any).settings as Record<string, unknown> | null;
        const listingDefaults = (locationSettings?.listingDefaults || {}) as Record<string, unknown>;

        const item = await prisma.item.create({
          data: {
            sku,
            stage: 'PHOTO_UPLOAD',
            status: 'ACTIVE',
            locationId: location.id,
            createdById: creator.id,
            // Apply listing defaults
            ...(listingDefaults.shippingService ? { shippingService: listingDefaults.shippingService as string } : {}),
            ...(listingDefaults.shippingType ? { shippingType: listingDefaults.shippingType as string } : {}),
            ...(listingDefaults.shippingCost != null ? { shippingCost: listingDefaults.shippingCost as number } : {}),
            ...(listingDefaults.handlingTime != null ? { handlingTime: listingDefaults.handlingTime as number } : {}),
            ...(listingDefaults.listingFormat ? { listingFormat: listingDefaults.listingFormat as string } : {}),
            ...(listingDefaults.listingDuration ? { listingDuration: listingDefaults.listingDuration as string } : {}),
            ...(listingDefaults.returnPolicy ? { returnPolicy: listingDefaults.returnPolicy as any } : {}),
            ...(listingDefaults.postalCode ? { postalCode: listingDefaults.postalCode as string } : {}),
            ...(listingDefaults.quantity != null ? { quantity: listingDefaults.quantity as number } : {}),
          },
        });

        // Create Photo records from pooled photos
        for (let i = 0; i < photos.length; i++) {
          const pooled = photos[i];
          // Store path without leading / so fs.readFileSync works from project root
          const fsOriginalPath = pooled.originalPath.replace(/^\//, '');
          const fsThumbnailPath = pooled.thumbnailPath ? pooled.thumbnailPath.replace(/^\//, '') : null;

          await prisma.photo.create({
            data: {
              itemId: item.id,
              originalPath: fsOriginalPath,
              thumbnailPath: fsThumbnailPath,
              isPrimary: i === 0,
              order: i,
            },
          });
        }

        // Log workflow action
        await prisma.workflowAction.create({
          data: {
            itemId: item.id,
            userId: creator.id,
            fromStage: 'PHOTO_UPLOAD',
            toStage: 'PHOTO_UPLOAD',
            action: 'create',
            notes: `Created from photo pool group with ${photos.length} photos`,
          },
        });

        // Trigger AI processing (async - don't block other groups)
        if (!skipAi) {
          try {
            await workflowService.processWithAI(item.id);
            // Advance to REVIEW_EDIT after AI completes
            await prisma.item.update({
              where: { id: item.id },
              data: { stage: 'REVIEW_EDIT' },
            });
            await prisma.workflowAction.create({
              data: {
                itemId: item.id,
                userId: creator.id,
                fromStage: 'PHOTO_UPLOAD',
                toStage: 'REVIEW_EDIT',
                action: 'ai_complete',
                notes: 'AI processing completed automatically',
              },
            });
          } catch (aiError: any) {
            console.error(`AI processing failed for item ${item.id}:`, aiError.message);
            // Item stays at PHOTO_UPLOAD with ERROR status - user can retry
            errors.push({ groupTag, error: `AI processing failed: ${aiError.message}` });
          }
        }

        // Delete the pooled photo records (files are now owned by Photo records)
        await prisma.pooledPhoto.deleteMany({
          where: { id: { in: photos.map((p) => p.id) } },
        });

        createdItems.push({
          id: item.id,
          sku: item.sku,
          photoCount: photos.length,
          groupTag,
        });
      } catch (groupError: any) {
        console.error(`Failed to create item for group ${groupTag}:`, groupError.message);
        errors.push({ groupTag, error: groupError.message });
      }
    }

    res.json({
      success: true,
      data: {
        created: createdItems,
        errors,
        totalCreated: createdItems.length,
        totalErrors: errors.length,
      },
    });
  } catch (error) {
    console.error('Create items error:', error);
    res.status(500).json({ success: false, error: 'Failed to create items' });
  }
});

// POST /api/pool/attach-to-item - Attach pool photos to an existing item
router.post('/attach-to-item', async (req: Request, res: Response) => {
  try {
    const { photoIds, itemId } = req.body;
    if (!photoIds || !Array.isArray(photoIds) || !itemId) {
      return res.status(400).json({ success: false, error: 'photoIds array and itemId required' });
    }

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    // Get pooled photos
    const pooledPhotos = await prisma.pooledPhoto.findMany({
      where: { id: { in: photoIds } },
    });

    if (pooledPhotos.length === 0) {
      return res.status(404).json({ success: false, error: 'No matching pooled photos found' });
    }

    // Get current max order for the item
    const maxOrder = await prisma.photo.aggregate({
      where: { itemId },
      _max: { order: true },
    });
    let nextOrder = (maxOrder._max.order ?? -1) + 1;

    const createdPhotos = [];

    for (const pooled of pooledPhotos) {
      const fsOriginalPath = pooled.originalPath.replace(/^\//, '');
      const fsThumbnailPath = pooled.thumbnailPath ? pooled.thumbnailPath.replace(/^\//, '') : null;

      const photo = await prisma.photo.create({
        data: {
          itemId,
          originalPath: fsOriginalPath,
          thumbnailPath: fsThumbnailPath,
          isPrimary: false,
          order: nextOrder++,
        },
      });

      createdPhotos.push(photo);
    }

    // Delete the pooled photo records
    await prisma.pooledPhoto.deleteMany({
      where: { id: { in: photoIds } },
    });

    res.json({ success: true, data: createdPhotos });
  } catch (error) {
    console.error('Attach to item error:', error);
    res.status(500).json({ success: false, error: 'Failed to attach photos to item' });
  }
});

export default router;
