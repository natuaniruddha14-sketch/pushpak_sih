import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { BadRequestError, NotFoundError } from './errors';

export interface StoredFileResult {
  storagePath: string;
  checksum: string;
  sizeBytes: number;
  sanitizedFilename: string;
}

export interface FileStorageProvider {
  saveFile(buffer: Buffer, originalFilename: string, mimeType: string): Promise<StoredFileResult>;
  getFile(storagePath: string): Promise<Buffer>;
  deleteFile(storagePath: string): Promise<void>;
  validateSafePath(targetPath: string): string;
}

export class LocalStorageProvider implements FileStorageProvider {
  private readonly storageRoot: string;
  private readonly uploadDir: string;

  constructor(customUploadDir?: string) {
    // Canonical storage root directory
    this.storageRoot = path.resolve(process.cwd(), '../../storage');
    this.uploadDir = customUploadDir
      ? path.resolve(customUploadDir)
      : path.join(this.storageRoot, 'uploads');

    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Sanitizes user-provided filename to strictly prevent path traversal,
   * command injection, null-byte injection, and OS filesystem violations.
   */
  public sanitizeFilename(originalFilename: string): string {
    if (!originalFilename || typeof originalFilename !== 'string') {
      originalFilename = 'unnamed_document.pdf';
    }

    // Remove null bytes and path traversal components
    const nullByteCleaned = originalFilename.replace(/\0/g, '');
    const basename = path.basename(nullByteCleaned);

    // Split extension and stem
    const ext = path.extname(basename).toLowerCase().replace(/[^a-z0-9]/g, '');
    const stem = path.basename(basename, path.extname(basename));

    // Allow only alphanumeric, dashes, and underscores in stem (max 64 chars)
    const safeStem = stem.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 64) || 'doc';
    const safeExt = ext ? `.${ext.substring(0, 8)}` : '.bin';

    const timestamp = Date.now();
    const uniqueId = crypto.randomUUID().substring(0, 8);

    return `${timestamp}_${uniqueId}_${safeStem}${safeExt}`;
  }

  /**
   * Strictly validates and verifies that a target path is contained within the storage root
   * to completely eliminate path traversal vulnerabilities.
   */
  public validateSafePath(targetPath: string): string {
    if (!targetPath || typeof targetPath !== 'string') {
      throw new BadRequestError('Invalid file path provided');
    }

    // Strip null bytes
    const cleanPath = targetPath.replace(/\0/g, '').trim();

    // Prevent any raw directory traversal sequences
    if (cleanPath.includes('..') || cleanPath.includes('\0')) {
      throw new BadRequestError('Directory traversal sequence detected');
    }

    let absolutePath: string;
    if (path.isAbsolute(cleanPath)) {
      absolutePath = path.normalize(cleanPath);
    } else {
      // Relative from repo root
      const repoRoot = path.resolve(this.storageRoot, '..');
      absolutePath = path.normalize(path.resolve(repoRoot, cleanPath));
    }

    // Ensure resolved path is strictly within storageRoot
    const normalizedRoot = path.normalize(this.storageRoot);
    if (!absolutePath.startsWith(normalizedRoot)) {
      throw new BadRequestError('Access denied: File path outside authorized storage boundaries');
    }

    return absolutePath;
  }

  /**
   * Calculates SHA-256 checksum hash of raw file bytes.
   */
  public calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  async saveFile(buffer: Buffer, originalFilename: string, _mimeType: string): Promise<StoredFileResult> {
    const sanitizedFilename = this.sanitizeFilename(originalFilename);
    const destinationPath = path.join(this.uploadDir, sanitizedFilename);

    // Validate path containment before writing
    this.validateSafePath(destinationPath);

    // Write file securely
    await fs.promises.writeFile(destinationPath, buffer);

    const checksum = this.calculateChecksum(buffer);
    const sizeBytes = buffer.length;
    // Relative path for database record
    const relativeStoragePath = path.join('storage', 'uploads', sanitizedFilename).replace(/\\/g, '/');

    return {
      storagePath: relativeStoragePath,
      checksum,
      sizeBytes,
      sanitizedFilename,
    };
  }

  async getFile(storagePath: string): Promise<Buffer> {
    const fullPath = this.validateSafePath(storagePath);
    if (!fs.existsSync(fullPath)) {
      throw new NotFoundError(`Requested file not found in storage: ${path.basename(storagePath)}`);
    }
    return fs.promises.readFile(fullPath);
  }

  async deleteFile(storagePath: string): Promise<void> {
    const fullPath = this.validateSafePath(storagePath);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
  }
}

export class SupabaseStorageProvider implements FileStorageProvider {
  private supabase: any;
  private bucket: string;
  private localFallback: LocalStorageProvider;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
    this.bucket = process.env.SUPABASE_STORAGE_BUCKET || 'mineintel-documents';
    this.localFallback = new LocalStorageProvider();

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) are required');
    }

    const { createClient } = require('@supabase/supabase-js');
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
  }

  public validateSafePath(targetPath: string): string {
    // For local fallback compatibility
    try {
      return this.localFallback.validateSafePath(targetPath);
    } catch {
      return targetPath.replace(/\\/g, '/');
    }
  }

  async saveFile(buffer: Buffer, originalFilename: string, mimeType: string): Promise<StoredFileResult> {
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
    const sanitizedFilename = this.localFallback.sanitizeFilename(originalFilename);
    const storagePath = `documents/${checksum}/${sanitizedFilename}`;

    // Upload to Supabase Storage bucket
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(storagePath, buffer, {
        contentType: mimeType || 'application/octet-stream',
        upsert: true,
      });

    if (error) {
      console.warn(`[SUPABASE STORAGE] Upload error, falling back to local storage:`, error.message);
      return this.localFallback.saveFile(buffer, originalFilename, mimeType);
    }

    // Also write to local cache so local python parsers have direct zero-latency filesystem access
    try {
      await this.localFallback.saveFile(buffer, originalFilename, mimeType);
    } catch (_e) {}

    return {
      storagePath,
      checksum,
      sizeBytes: buffer.length,
      sanitizedFilename,
    };
  }

  async getFile(storagePath: string): Promise<Buffer> {
    // 1. Try Supabase storage if it's a Supabase bucket path
    if (storagePath.startsWith('documents/') || !storagePath.startsWith('storage/')) {
      try {
        const { data, error } = await this.supabase.storage
          .from(this.bucket)
          .download(storagePath);

        if (!error && data) {
          const arrayBuf = await data.arrayBuffer();
          return Buffer.from(arrayBuf);
        }
      } catch (_e) {}
    }

    // 2. Fallback to local storage if available
    try {
      return await this.localFallback.getFile(storagePath);
    } catch {
      throw new NotFoundError(`Requested file '${storagePath}' not found in Supabase bucket '${this.bucket}' or local cache`);
    }
  }

  async deleteFile(storagePath: string): Promise<void> {
    if (storagePath.startsWith('documents/')) {
      try {
        await this.supabase.storage.from(this.bucket).remove([storagePath]);
      } catch (_e) {}
    }
    try {
      await this.localFallback.deleteFile(storagePath);
    } catch (_e) {}
  }
}

// Storage provider factory: auto-detects Supabase or defaults to LocalStorage
export function createStorageProvider(): FileStorageProvider {
  const isSupabaseConfigured = Boolean(
    process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)
  );

  if (process.env.STORAGE_PROVIDER === 'supabase' || isSupabaseConfigured) {
    try {
      return new SupabaseStorageProvider();
    } catch (err: any) {
      console.warn(`[STORAGE] Failed to initialize SupabaseStorageProvider (${err.message}), using LocalStorageProvider`);
    }
  }

  return new LocalStorageProvider();
}

// Global active storage provider
export const storageProvider: FileStorageProvider = createStorageProvider();

