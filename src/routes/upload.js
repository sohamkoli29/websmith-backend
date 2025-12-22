import express from 'express';
import { body, param, query } from 'express-validator';
import { uploadController } from '../controllers/uploadController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { upload, UPLOAD_CONFIGS } from '../config/upload.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

// Get signed URL for private file (if needed)
router.get('/signed/:id',
  [
    param('id').isUUID().withMessage('Invalid media ID'),
    query('expiresIn').optional().isInt({ min: 60, max: 604800 }).withMessage('ExpiresIn must be between 60 and 604800 seconds')
  ],
  validateRequest,
  uploadController.getSignedUrl
);

// ==================== PROTECTED ADMIN ROUTES ====================

// Apply authentication middleware to all upload routes
router.use(authenticateToken);
router.use(requireAdmin);

// Single file upload
router.post('/single',
  upload.single('file'),
  [
    body('type').optional().isIn(['profile', 'project', 'blog', 'avatar', 'document', 'general']),
    body('folder').optional().isString().trim()
  ],
  validateRequest,
  uploadController.uploadFile
);

// Multiple file upload
router.post('/multiple',
  upload.array('files', 10),
  [
    body('type').optional().isIn(['general', 'document']),
    body('folder').optional().isString().trim()
  ],
  validateRequest,
  uploadController.uploadMultiple
);

// Profile image upload (specific endpoint)
router.post('/profile',
  upload.single('image'),
  [
    body('type').equals('profile').optional()
  ],
  validateRequest,
  uploadController.uploadProfileImage
);

// List media files
router.get('/media',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('category').optional().isIn(['image', 'document', 'other']),
    query('type').optional().isString(),
    query('sort').optional().isIn(['created_at', 'updated_at', 'filename', 'size']),
    query('order').optional().isIn(['asc', 'desc'])
  ],
  validateRequest,
  uploadController.listMedia
);

// Get single media
router.get('/media/:id',
  param('id').isUUID().withMessage('Invalid media ID'),
  validateRequest,
  uploadController.getMedia
);

// Update media metadata
router.put('/media/:id',
  param('id').isUUID().withMessage('Invalid media ID'),
  [
    body('filename').optional().isString().trim(),
    body('metadata').optional().isObject()
  ],
  validateRequest,
  uploadController.updateMedia
);

// Delete single media
router.delete('/media/:id',
  param('id').isUUID().withMessage('Invalid media ID'),
  validateRequest,
  uploadController.deleteMedia
);

// Delete multiple media
router.delete('/media',
  [
    body('ids').isArray().withMessage('IDs must be an array'),
    body('ids.*').isUUID().withMessage('Invalid media ID')
  ],
  validateRequest,
  uploadController.deleteMultipleMedia
);

// Get storage statistics
router.get('/stats',
  uploadController.getStorageStats
);

// Test upload endpoint
router.post('/test',
  upload.single('testFile'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    res.status(200).json({
      success: true,
      message: 'File received successfully',
      data: {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });
  }
);

export default router;