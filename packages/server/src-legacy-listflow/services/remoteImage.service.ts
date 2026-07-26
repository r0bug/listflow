import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const SALES_DIR = path.join(process.cwd(), 'uploads', 'sales');

/**
 * Downloads a remote image (eBay picture URL) into uploads/sales/ and writes
 * a thumbnail beside it. Returns web paths (/uploads/...) for direct <img>
 * use, mirroring how Photo paths are served. Failures return null — callers
 * keep the remote URL as a fallback.
 */
class RemoteImageService {
  async downloadSaleImage(
    url: string,
    saleId: string
  ): Promise<{ imagePath: string; thumbnailPath: string } | null> {
    try {
      await fs.mkdir(SALES_DIR, { recursive: true });

      const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());

      const filePath = path.join(SALES_DIR, `${saleId}.jpg`);
      const thumbPath = path.join(SALES_DIR, `${saleId}-thumb.jpg`);

      await sharp(buffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toFile(filePath);
      await sharp(buffer)
        .resize(300, 300, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 70 })
        .toFile(thumbPath);

      return {
        imagePath: `/uploads/sales/${saleId}.jpg`,
        thumbnailPath: `/uploads/sales/${saleId}-thumb.jpg`,
      };
    } catch (error) {
      console.warn(`Could not download sale image ${url}:`, (error as Error).message);
      return null;
    }
  }
}

export const remoteImageService = new RemoteImageService();
