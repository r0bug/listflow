import fs from 'fs';
import path from 'path';
import { prisma } from '../config/database';

const PUBLIC_IMAGES_DIR = process.env.PUBLIC_IMAGES_DIR || 'public-images';
const PUBLIC_IMAGE_BASE_URL = process.env.PUBLIC_IMAGE_BASE_URL || 'http://localhost:3001';

/**
 * Generate a URL-friendly slug from a title.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

/**
 * Host images for an item: copy photos to public directory and set publicUrl.
 */
export async function hostItemImages(itemId: string): Promise<string[]> {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { photos: { orderBy: { order: 'asc' } } },
  });

  if (!item) throw new Error('Item not found');
  if (!item.title) throw new Error('Item has no title for slug generation');
  if (item.photos.length === 0) throw new Error('Item has no photos');

  const slug = (slugify(item.title) || 'item') + '-' + itemId.slice(-8);
  const destDir = path.resolve(PUBLIC_IMAGES_DIR, 'listflow', slug);

  // Create destination directory
  fs.mkdirSync(destDir, { recursive: true });

  const publicUrls: string[] = [];

  for (let i = 0; i < item.photos.length; i++) {
    const photo = item.photos[i];
    // Use optimized path if available, fall back to original
    const sourcePath = photo.editedPath || photo.optimizedPath || photo.originalPath;

    if (!sourcePath || !fs.existsSync(sourcePath)) {
      console.warn(`Photo ${photo.id}: source file not found at ${sourcePath}`);
      continue;
    }

    const ext = path.extname(sourcePath) || '.jpg';
    const filename = `image${i + 1}${ext}`;
    const destPath = path.join(destDir, filename);

    // Copy the file
    fs.copyFileSync(sourcePath, destPath);

    const publicUrl = `${PUBLIC_IMAGE_BASE_URL}/listflow/${slug}/${filename}`;
    publicUrls.push(publicUrl);

    // Update photo record with publicUrl
    await prisma.photo.update({
      where: { id: photo.id },
      data: { publicUrl },
    });
  }

  return publicUrls;
}

export const imageHostingService = { hostItemImages, slugify };
