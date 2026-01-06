// src/routes/achievements.js
import express from 'express';
import { body, param, query } from 'express-validator';
import { achievementsController } from '../controllers/achievementsController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

// Get all achievements (GET - public)
router.get('/', achievementsController.getAchievements);

// Get single achievement (GET - public)
router.get('/:id',
  param('id').isUUID().withMessage('Invalid achievement ID'),
  validateRequest,
  achievementsController.getAchievement
);

// ==================== PROTECTED ADMIN ROUTES ====================

// Apply authentication middleware to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Create achievement (POST - admin only)
router.post('/',
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required').isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
    body('achievement_date').isDate().withMessage('Valid achievement date is required'),
    body('category').optional().isIn(['award', 'competition', 'publication', 'milestone', 'certification', 'other']).withMessage('Invalid category'),
    body('image_url').optional().isURL().withMessage('Invalid image URL'),

    body('icon').optional().isString(),
    body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Invalid color hex code'),
    body('featured').optional().isBoolean(),
    body('sort_order').optional().isInt()
  ],
  validateRequest,
  achievementsController.createAchievement
);

// Update achievement (PUT - admin only)
router.put('/:id',
  [
    param('id').isUUID().withMessage('Invalid achievement ID'),
    body('description').optional().isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
    body('achievement_date').optional().isDate().withMessage('Valid achievement date required'),
    body('category').optional().isIn(['award', 'competition', 'publication', 'milestone', 'certification', 'other']).withMessage('Invalid category'),
    body('image_url').optional().isURL().withMessage('Invalid image URL'),

    body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Invalid color hex code'),
    body('featured').optional().isBoolean(),
    body('sort_order').optional().isInt()
  ],
  validateRequest,
  achievementsController.updateAchievement
);

// Delete achievement (DELETE - admin only)
router.delete('/:id',
  param('id').isUUID().withMessage('Invalid achievement ID'),
  validateRequest,
  achievementsController.deleteAchievement
);

export default router;