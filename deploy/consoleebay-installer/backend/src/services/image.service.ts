import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

class ImageProcessingService {
  private uploadDir = 'uploads';
  private optimizedDir = 'uploads/optimized';

  constructor() {
    this.ensureDirectories();
  }

  private async ensureDirectories() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(this.optimizedDir, { recursive: true });
    } catch (error) {
      console.error('Error creating directories:', error);
    }
  }

  async processImage(imagePath: string) {
    try {
      const filename = path.basename(imagePath);
      const optimizedPath = path.join(this.optimizedDir, `optimized-${filename}`);

      const metadata = await sharp(imagePath).metadata();

      await sharp(imagePath)
        .resize(1600, 1600, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85 })
        .toFile(optimizedPath);

      return {
        originalPath: imagePath,
        optimizedPath,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: metadata.size
        }
      };
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  }

  async createThumbnail(imagePath: string) {
    try {
      const filename = path.basename(imagePath);
      const thumbnailPath = path.join(this.optimizedDir, `thumb-${filename}`);

      await sharp(imagePath)
        .resize(300, 300, {
          fit: 'cover',
          position: 'centre'
        })
        .jpeg({ quality: 70 })
        .toFile(thumbnailPath);

      return thumbnailPath;
    } catch (error) {
      console.error('Error creating thumbnail:', error);
      throw error;
    }
  }
}

export const imageProcessingService = new ImageProcessingService();