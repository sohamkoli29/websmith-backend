import express from 'express';
import { body, param, query } from 'express-validator';
import { contentController } from '../controllers/contentController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

// About (GET - public)
router.get('/about', contentController.getAbout);

// Skills (GET - public)
router.get('/skills', contentController.getSkills);

// Get single skill (GET - public)
router.get('/skills/:id',
  param('id').isUUID().withMessage('Invalid skill ID'),
  validateRequest,
  contentController.getSkill
);

// Projects (GET - public)
router.get('/projects', contentController.getProjects);

// Get single project (GET - public)
router.get('/projects/:id',
  param('id').isUUID().withMessage('Invalid project ID'),
  validateRequest,
  contentController.getProject
);

// Blogs (GET - public)
router.get('/blogs', contentController.getBlogs);

// Get single blog by ID or slug (GET - public)
router.get('/blogs/:idOrSlug', contentController.getBlog);

// Experience (GET - public)
router.get('/experience', contentController.getExperiences);

// Get single experience (GET - public)
router.get('/experience/:id',
  param('id').isUUID().withMessage('Invalid experience ID'),
  validateRequest,
  contentController.getExperience
);

// Testimonials (GET - public)
router.get('/testimonials', contentController.getTestimonials);

// Get single testimonial (GET - public)
router.get('/testimonials/:id',
  param('id').isUUID().withMessage('Invalid testimonial ID'),
  validateRequest,
  contentController.getTestimonial
);

// Services (GET - public)
router.get('/services', contentController.getServices);

// Get single service (GET - public)
router.get('/services/:id',
  param('id').isUUID().withMessage('Invalid service ID'),
  validateRequest,
  contentController.getService
);

// Contact message submission (POST - public)
router.post('/contact',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('message').notEmpty().withMessage('Message is required')
  ],
  validateRequest,
  contentController.createMessage
);

// ==================== PROTECTED ADMIN ROUTES ====================

// Apply authentication middleware to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// About (PUT - admin only)
router.put('/about',
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required')
  ],
  validateRequest,
  contentController.updateAbout
);

// Skills CRUD (admin only)
router.post('/skills',
  [
    body('name').notEmpty().withMessage('Skill name is required'),
    body('category').optional().isString(),
    body('proficiency').optional().isInt({ min: 1, max: 100 }),
    body('sort_order').optional().isInt()
  ],
  validateRequest,
  contentController.createSkill
);

router.put('/skills/:id',
  [
    param('id').isUUID().withMessage('Invalid skill ID'),
    body('name').optional().notEmpty(),
    body('proficiency').optional().isInt({ min: 1, max: 100 })
  ],
  validateRequest,
  contentController.updateSkill
);

router.delete('/skills/:id',
  param('id').isUUID().withMessage('Invalid skill ID'),
  validateRequest,
  contentController.deleteSkill
);

// Projects CRUD (admin only)
router.post('/projects',
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('technologies').optional().isArray(),
    body('featured').optional().isBoolean(),
    body('sort_order').optional().isInt()
  ],
  validateRequest,
  contentController.createProject
);

router.put('/projects/:id',
  [
    param('id').isUUID().withMessage('Invalid project ID')
  ],
  validateRequest,
  contentController.updateProject
);

router.delete('/projects/:id',
  param('id').isUUID().withMessage('Invalid project ID'),
  validateRequest,
  contentController.deleteProject
);

// Blogs CRUD (admin only)
router.post('/blogs',
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('slug').notEmpty().withMessage('Slug is required'),
    body('content').notEmpty().withMessage('Content is required'),
    body('tags').optional().isArray(),
    body('published').optional().isBoolean()
  ],
  validateRequest,
  contentController.createBlog
);

router.put('/blogs/:id',
  [
    param('id').isUUID().withMessage('Invalid blog ID')
  ],
  validateRequest,
  contentController.updateBlog
);

router.delete('/blogs/:id',
  param('id').isUUID().withMessage('Invalid blog ID'),
  validateRequest,
  contentController.deleteBlog
);

// Experience CRUD (admin only)
router.post('/experience',
  [
    body('company').notEmpty().withMessage('Company is required'),
    body('position').notEmpty().withMessage('Position is required'),
    body('start_date').isDate().withMessage('Valid start date is required'),
    body('end_date').optional().isDate(),
    body('current').optional().isBoolean(),
    body('technologies').optional().isArray(),
    body('sort_order').optional().isInt()
  ],
  validateRequest,
  contentController.createExperience
);

router.put('/experience/:id',
  [
    param('id').isUUID().withMessage('Invalid experience ID')
  ],
  validateRequest,
  contentController.updateExperience
);

router.delete('/experience/:id',
  param('id').isUUID().withMessage('Invalid experience ID'),
  validateRequest,
  contentController.deleteExperience
);

// Testimonials CRUD (admin only)
router.post('/testimonials',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('content').notEmpty().withMessage('Content is required'),
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('featured').optional().isBoolean()
  ],
  validateRequest,
  contentController.createTestimonial
);

router.put('/testimonials/:id',
  [
    param('id').isUUID().withMessage('Invalid testimonial ID')
  ],
  validateRequest,
  contentController.updateTestimonial
);

router.delete('/testimonials/:id',
  param('id').isUUID().withMessage('Invalid testimonial ID'),
  validateRequest,
  contentController.deleteTestimonial
);

// Services CRUD (admin only)
router.post('/services',
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('features').optional().isArray(),
    body('sort_order').optional().isInt()
  ],
  validateRequest,
  contentController.createService
);

router.put('/services/:id',
  [
    param('id').isUUID().withMessage('Invalid service ID')
  ],
  validateRequest,
  contentController.updateService
);

router.delete('/services/:id',
  param('id').isUUID().withMessage('Invalid service ID'),
  validateRequest,
  contentController.deleteService
);

// Messages management (admin only)
router.get('/messages', contentController.getMessages);

router.get('/messages/:id',
  param('id').isUUID().withMessage('Invalid message ID'),
  validateRequest,
  contentController.getMessage
);

router.put('/messages/:id',
  [
    param('id').isUUID().withMessage('Invalid message ID'),
    body('read').isBoolean().withMessage('Read status is required')
  ],
  validateRequest,
  contentController.updateMessage
);

router.delete('/messages/:id',
  param('id').isUUID().withMessage('Invalid message ID'),
  validateRequest,
  contentController.deleteMessage
);

// Dashboard statistics (admin only)
router.get('/stats', contentController.getStats);

export default router;