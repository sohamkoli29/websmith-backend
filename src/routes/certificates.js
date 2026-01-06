// src/routes/certificates.js
import express from 'express';
import { body, param, query } from 'express-validator';
import { certificatesController } from '../controllers/certificatesController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

// Get all certificates (GET - public)
router.get('/', certificatesController.getCertificates);

// Get single certificate (GET - public)
router.get('/:id',
  param('id').isUUID().withMessage('Invalid certificate ID'),
  validateRequest,
  certificatesController.getCertificate
);

// ==================== PROTECTED ADMIN ROUTES ====================

// Apply authentication middleware to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Create certificate (POST - admin only)
router.post('/',
  [
    body('title').notEmpty().trim().withMessage('Title is required'),
    body('issuer').notEmpty().trim().withMessage('Issuer is required'),
    body('issue_date').isDate().withMessage('Valid issue date is required'),
    body('credential_id').optional().trim(),

    body('image_url').optional().isURL().withMessage('Invalid image URL'),
    body('featured').optional().isBoolean(),
    body('sort_order').optional().isInt()
  ],
  validateRequest,
  certificatesController.createCertificate
);

// Update certificate (PUT - admin only)
router.put('/:id',
  [
    param('id').isUUID().withMessage('Invalid certificate ID'),
    body('issue_date').optional().isDate().withMessage('Valid issue date required'),

    body('image_url').optional().isURL().withMessage('Invalid image URL'),
    body('featured').optional().isBoolean(),
    body('sort_order').optional().isInt()
  ],
  validateRequest,
  certificatesController.updateCertificate
);

// Delete certificate (DELETE - admin only)
router.delete('/:id',
  param('id').isUUID().withMessage('Invalid certificate ID'),
  validateRequest,
  certificatesController.deleteCertificate
);

export default router;