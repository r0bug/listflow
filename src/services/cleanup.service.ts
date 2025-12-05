import fs from 'fs/promises';
import path from 'path';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

interface CleanupStats {
  filesScanned: number;
  filesDeleted: number;
  bytesFreed: number;
  errors: string[];
}

interface CleanupOptions {
  dryRun?: boolean;          // Just report what would be deleted
  maxAgeDays?: number;       // Delete files older than this
  keepOrphans?: boolean;     // Don't delete orphaned files
  verbose?: boolean;         // Log each action
}

class CleanupService {
  private uploadsDir: string;
  private optimizedDir: string;

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    this.optimizedDir = path.join(process.cwd(), 'uploads', 'optimized');
  }

  // Clean up orphaned image files (not referenced in database)
  async cleanupOrphanedFiles(options: CleanupOptions = {}): Promise<CleanupStats> {
    const {
      dryRun = false,
      verbose = false
    } = options;

    const stats: CleanupStats = {
      filesScanned: 0,
      filesDeleted: 0,
      bytesFreed: 0,
      errors: []
    };

    try {
      // Get all photo paths from database
      const photos = await prisma.photo.findMany({
        select: {
          originalPath: true,
          thumbnailPath: true,
          optimizedPath: true
        }
      });

      const dbPaths = new Set<string>();
      photos.forEach(photo => {
        if (photo.originalPath) dbPaths.add(path.basename(photo.originalPath));
        if (photo.thumbnailPath) dbPaths.add(path.basename(photo.thumbnailPath));
        if (photo.optimizedPath) dbPaths.add(path.basename(photo.optimizedPath));
      });

      // Scan uploads directory
      await this.scanDirectory(this.uploadsDir, dbPaths, stats, options);

      if (verbose) {
        console.log(`\nCleanup complete:`);
        console.log(`  Files scanned: ${stats.filesScanned}`);
        console.log(`  Files deleted: ${stats.filesDeleted}`);
        console.log(`  Space freed: ${this.formatBytes(stats.bytesFreed)}`);
        if (stats.errors.length > 0) {
          console.log(`  Errors: ${stats.errors.length}`);
        }
      }

      return stats;
    } catch (error: any) {
      stats.errors.push(`Cleanup failed: ${error.message}`);
      return stats;
    }
  }

  private async scanDirectory(
    dir: string,
    dbPaths: Set<string>,
    stats: CleanupStats,
    options: CleanupOptions
  ): Promise<void> {
    const { dryRun = false, verbose = false } = options;

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          await this.scanDirectory(fullPath, dbPaths, stats, options);
        } else if (entry.isFile()) {
          stats.filesScanned++;

          // Check if file is in database
          if (!dbPaths.has(entry.name)) {
            try {
              const fileStat = await fs.stat(fullPath);

              if (verbose) {
                console.log(`${dryRun ? '[DRY RUN] Would delete' : 'Deleting'}: ${entry.name} (${this.formatBytes(fileStat.size)})`);
              }

              if (!dryRun) {
                await fs.unlink(fullPath);
              }

              stats.filesDeleted++;
              stats.bytesFreed += fileStat.size;
            } catch (error: any) {
              stats.errors.push(`Failed to delete ${entry.name}: ${error.message}`);
            }
          }
        }
      }
    } catch (error: any) {
      stats.errors.push(`Failed to scan ${dir}: ${error.message}`);
    }
  }

  // Clean up old files based on age
  async cleanupOldFiles(options: CleanupOptions = {}): Promise<CleanupStats> {
    const {
      dryRun = false,
      maxAgeDays = 30,
      verbose = false
    } = options;

    const stats: CleanupStats = {
      filesScanned: 0,
      filesDeleted: 0,
      bytesFreed: 0,
      errors: []
    };

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

    try {
      await this.scanDirectoryByAge(this.uploadsDir, cutoffDate, stats, options);

      if (verbose) {
        console.log(`\nOld file cleanup complete:`);
        console.log(`  Files scanned: ${stats.filesScanned}`);
        console.log(`  Files deleted: ${stats.filesDeleted}`);
        console.log(`  Space freed: ${this.formatBytes(stats.bytesFreed)}`);
      }

      return stats;
    } catch (error: any) {
      stats.errors.push(`Cleanup failed: ${error.message}`);
      return stats;
    }
  }

  private async scanDirectoryByAge(
    dir: string,
    cutoffDate: Date,
    stats: CleanupStats,
    options: CleanupOptions
  ): Promise<void> {
    const { dryRun = false, verbose = false } = options;

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await this.scanDirectoryByAge(fullPath, cutoffDate, stats, options);
        } else if (entry.isFile()) {
          stats.filesScanned++;

          try {
            const fileStat = await fs.stat(fullPath);

            if (fileStat.mtime < cutoffDate) {
              if (verbose) {
                console.log(`${dryRun ? '[DRY RUN] Would delete' : 'Deleting'}: ${entry.name} (modified ${fileStat.mtime.toLocaleDateString()})`);
              }

              if (!dryRun) {
                await fs.unlink(fullPath);
              }

              stats.filesDeleted++;
              stats.bytesFreed += fileStat.size;
            }
          } catch (error: any) {
            stats.errors.push(`Failed to process ${entry.name}: ${error.message}`);
          }
        }
      }
    } catch (error: any) {
      stats.errors.push(`Failed to scan ${dir}: ${error.message}`);
    }
  }

  // Clean up items in ERROR status
  async cleanupErrorItems(dryRun: boolean = false): Promise<{
    itemsDeleted: number;
    photosDeleted: number;
    errors: string[];
  }> {
    const result = {
      itemsDeleted: 0,
      photosDeleted: 0,
      errors: [] as string[]
    };

    try {
      // Find items in ERROR status older than 7 days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);

      const errorItems = await prisma.item.findMany({
        where: {
          status: 'ERROR',
          createdAt: { lt: cutoffDate }
        },
        include: {
          photos: true
        }
      });

      for (const item of errorItems) {
        // Delete associated photo files
        for (const photo of item.photos) {
          try {
            if (photo.originalPath && !dryRun) {
              await fs.unlink(photo.originalPath).catch(() => {});
            }
            if (photo.optimizedPath && !dryRun) {
              await fs.unlink(photo.optimizedPath).catch(() => {});
            }
            if (photo.thumbnailPath && !dryRun) {
              await fs.unlink(photo.thumbnailPath).catch(() => {});
            }
            result.photosDeleted++;
          } catch (error: any) {
            result.errors.push(`Failed to delete photos for item ${item.id}: ${error.message}`);
          }
        }

        // Delete item from database
        if (!dryRun) {
          await prisma.item.delete({
            where: { id: item.id }
          });
        }
        result.itemsDeleted++;
      }

      return result;
    } catch (error: any) {
      result.errors.push(`Cleanup failed: ${error.message}`);
      return result;
    }
  }

  // Clean expired price research cache
  async cleanupExpiredCache(): Promise<number> {
    try {
      const result = await prisma.priceResearch.deleteMany({
        where: {
          expiresAt: { lt: new Date() }
        }
      });
      return result.count;
    } catch (error) {
      console.error('Failed to cleanup expired cache:', error);
      return 0;
    }
  }

  // Clean old user sessions
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await prisma.userSession.deleteMany({
        where: {
          expiresAt: { lt: new Date() }
        }
      });
      return result.count;
    } catch (error) {
      console.error('Failed to cleanup expired sessions:', error);
      return 0;
    }
  }

  // Get storage usage stats
  async getStorageStats(): Promise<{
    uploadsSize: number;
    optimizedSize: number;
    totalSize: number;
    fileCount: number;
  }> {
    let uploadsSize = 0;
    let optimizedSize = 0;
    let fileCount = 0;

    const countDir = async (dir: string): Promise<{ size: number; count: number }> => {
      let size = 0;
      let count = 0;

      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            const subStats = await countDir(fullPath);
            size += subStats.size;
            count += subStats.count;
          } else if (entry.isFile()) {
            const fileStat = await fs.stat(fullPath);
            size += fileStat.size;
            count++;
          }
        }
      } catch (error) {
        // Directory might not exist
      }

      return { size, count };
    };

    const uploadsStats = await countDir(this.uploadsDir);
    uploadsSize = uploadsStats.size;
    fileCount = uploadsStats.count;

    const optimizedStats = await countDir(this.optimizedDir);
    optimizedSize = optimizedStats.size;

    return {
      uploadsSize,
      optimizedSize,
      totalSize: uploadsSize,
      fileCount
    };
  }

  // Run all cleanup tasks
  async runFullCleanup(options: CleanupOptions = {}): Promise<{
    orphanedFiles: CleanupStats;
    oldFiles: CleanupStats;
    errorItems: { itemsDeleted: number; photosDeleted: number };
    expiredCache: number;
    expiredSessions: number;
  }> {
    console.log('Starting full cleanup...\n');

    const orphanedFiles = await this.cleanupOrphanedFiles({ ...options, verbose: true });
    const oldFiles = await this.cleanupOldFiles({ ...options, maxAgeDays: 90, verbose: true });
    const errorItems = await this.cleanupErrorItems(options.dryRun);
    const expiredCache = await this.cleanupExpiredCache();
    const expiredSessions = await this.cleanupExpiredSessions();

    console.log('\n=== Cleanup Summary ===');
    console.log(`Orphaned files: ${orphanedFiles.filesDeleted} deleted, ${this.formatBytes(orphanedFiles.bytesFreed)} freed`);
    console.log(`Old files (90+ days): ${oldFiles.filesDeleted} deleted, ${this.formatBytes(oldFiles.bytesFreed)} freed`);
    console.log(`Error items: ${errorItems.itemsDeleted} items, ${errorItems.photosDeleted} photos`);
    console.log(`Expired cache entries: ${expiredCache}`);
    console.log(`Expired sessions: ${expiredSessions}`);

    return {
      orphanedFiles,
      oldFiles,
      errorItems,
      expiredCache,
      expiredSessions
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}

export const cleanupService = new CleanupService();
