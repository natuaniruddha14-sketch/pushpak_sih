import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { DocumentType } from '@prisma/client';
import path from 'path';
import { env } from '../lib/env';

export const ALLOWED_MIME_TYPES: Record<string, DocumentType> = {
  'application/pdf': DocumentType.PDF,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': DocumentType.DOCX,
  'application/msword': DocumentType.DOCX,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': DocumentType.EXCEL,
  'application/vnd.ms-excel': DocumentType.EXCEL,
  'image/png': DocumentType.IMAGE,
  'image/jpeg': DocumentType.IMAGE,
  'image/jpg': DocumentType.IMAGE,
};

export const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.bin', '.dll', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.msi',
  '.scr', '.pif', '.application', '.gadget', '.hta', '.cpl', '.msc', '.jar',
  '.js', '.jse', '.ws', '.wsf', '.wsc', '.wsh', '.py', '.php', '.asp', '.aspx'
]);

export const MAX_FILE_SIZE_BYTES = Math.min(env.MAX_FILE_SIZE_MB * 1024 * 1024, 100 * 1024 * 1024); // max capped at 100MB

const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const originalName = file.originalname || '';
  const ext = path.extname(originalName).toLowerCase();

  // 1. Explicitly reject dangerous executable extensions
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return cb(
      new Error(`Unsupported MIME type for executable file '${originalName}'. Upload of executable or script files is strictly forbidden.`)
    );
  }

  // 2. Validate MIME type
  const normalizedMime = file.mimetype.toLowerCase();
  if (!ALLOWED_MIME_TYPES[normalizedMime]) {
    return cb(
      new Error(`Unsupported MIME type '${file.mimetype}'. Supported formats: PDF, DOCX, XLSX, PNG, JPG/JPEG`)
    );
  }

  cb(null, true);
};

export const uploadSingleFile = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter,
}).single('file');

/**
 * Validates magic bytes / binary signatures to ensure the file contents
 * actually match the declared MIME type.
 */
export function validateFileMagicBytes(buffer: Buffer, mimeType: string): { valid: boolean; reason?: string } {
  if (!buffer || buffer.length < 4) {
    return { valid: false, reason: 'File payload is empty or corrupted' };
  }

  const normalizedMime = mimeType.toLowerCase();

  // PDF signature: %PDF- (0x25 0x50 0x44 0x46)
  if (normalizedMime === 'application/pdf') {
    const isPdf = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
    if (!isPdf) {
      return { valid: false, reason: 'File content does not match standard PDF binary signature' };
    }
  }

  // PNG signature: 0x89 0x50 0x4E 0x47
  if (normalizedMime === 'image/png') {
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    if (!isPng) {
      return { valid: false, reason: 'File content does not match standard PNG binary signature' };
    }
  }

  // JPEG signature: 0xFF 0xD8 0xFF
  if (normalizedMime === 'image/jpeg' || normalizedMime === 'image/jpg') {
    const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    if (!isJpeg) {
      return { valid: false, reason: 'File content does not match standard JPEG binary signature' };
    }
  }

  // DOCX / XLSX are ZIP packages: PK (0x50 0x4B 0x03 0x04)
  if (
    normalizedMime.includes('openxmlformats-officedocument') ||
    normalizedMime.includes('msword') ||
    normalizedMime.includes('ms-excel')
  ) {
    const isZip = buffer[0] === 0x50 && buffer[1] === 0x4B;
    if (!isZip) {
      return { valid: false, reason: 'File content does not match standard Office document structure' };
    }
  }

  return { valid: true };
}
