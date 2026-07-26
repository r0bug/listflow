// Downloads a sale's eBay picture into FILE_ROOT/sales/<account>/… and
// writes a thumbnail beside it (Standards §4 layout; DB stores relative
// paths). Failures return null — callers keep the remote URL as fallback.

import sharp from 'sharp';
import { absPath, ensureDirFor, salesRelPath } from '../util/paths.js';
import { logger } from '../util/logger.js';

class RemoteImageService {
  async downloadSaleImage(
    url: string,
    sale: { accountName: string; ebayOrderId: string; lineItemId: string },
  ): Promise<{ imagePath: string; thumbnailPath: string } | null> {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());

      const rel = salesRelPath(sale.accountName, sale.ebayOrderId, sale.lineItemId);
      const relThumb = rel.replace(/\.jpg$/, '-thumb.jpg');
      const abs = absPath(rel);
      ensureDirFor(abs);

      await sharp(buffer)
        .rotate()
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toFile(abs);
      await sharp(buffer)
        .rotate()
        .resize(300, 300, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 70 })
        .toFile(absPath(relThumb));

      return { imagePath: rel, thumbnailPath: relThumb };
    } catch (error) {
      logger.warn({ url, err: (error as Error).message }, 'sale image download failed');
      return null;
    }
  }
}

export const remoteImageService = new RemoteImageService();
