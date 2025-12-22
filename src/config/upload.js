import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Multer storage configuration
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

// Multer upload configuration
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10 // Max 10 files at once
  }
});

// Generate unique filename
export const generateFilename = (originalname, prefix = '') => {
  const ext = path.extname(originalname);
  const filename = path.basename(originalname, ext);
  const sanitized = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const uniqueId = uuidv4().split('-')[0];
  return `${prefix}${sanitized}_${uniqueId}${ext}`;
};

// Get file category based on mimetype
export const getFileCategory = (mimetype) => {
  if (ALLOWED_IMAGE_TYPES.includes(mimetype)) return 'image';
  if (ALLOWED_DOCUMENT_TYPES.includes(mimetype)) return 'document';
  return 'other';
};

// Allowed file upload configurations
export const UPLOAD_CONFIGS = {
  PROFILE_IMAGE: {
    fieldName: 'profileImage',
    maxCount: 1,
    allowedTypes: ALLOWED_IMAGE_TYPES,
    maxSize: 5 * 1024 * 1024, // 5MB
    resize: { width: 400, height: 400 }
  },
  PROJECT_IMAGE: {
    fieldName: 'projectImage',
    maxCount: 1,
    allowedTypes: ALLOWED_IMAGE_TYPES,
    maxSize: 5 * 1024 * 1024,
    resize: { width: 1200, height: 800 }
  },
  BLOG_IMAGE: {
    fieldName: 'blogImage',
    maxCount: 1,
    allowedTypes: ALLOWED_IMAGE_TYPES,
    maxSize: 5 * 1024 * 1024,
    resize: { width: 1200, height: 630 }
  },
  TESTIMONIAL_AVATAR: {
    fieldName: 'avatar',
    maxCount: 1,
    allowedTypes: ALLOWED_IMAGE_TYPES,
    maxSize: 2 * 1024 * 1024, // 2MB
    resize: { width: 200, height: 200 }
  },
  DOCUMENT: {
    fieldName: 'document',
    maxCount: 1,
    allowedTypes: ALLOWED_DOCUMENT_TYPES,
    maxSize: 10 * 1024 * 1024 // 10MB
  },
  GENERAL: {
    fieldName: 'files',
    maxCount: 10,
    allowedTypes: [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES],
    maxSize: MAX_FILE_SIZE
  }
};