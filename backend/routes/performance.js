import express from 'express';
import { getReviews, addReview, updateReview, deleteReview } from '../controllers/performanceController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { check } from 'express-validator';

const router = express.Router();

// Middleware
router.use(authMiddleware);

// Routes
router.get('/', getReviews);

router.post(
    '/',
    [
        check('employee', 'Employee is required').not().isEmpty(),
        check('rating', 'Rating is required').isNumeric(),
        check('feedback', 'Feedback is required').not().isEmpty()
    ],
    requireRole(['ceo', 'manager']),
    addReview
);

router.put('/:id', requireRole(['ceo', 'manager']), updateReview);

router.delete('/:id', requireRole(['ceo', 'manager']), deleteReview);

export default router;
