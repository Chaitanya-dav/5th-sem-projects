import express from 'express';
import { getAllSalaries, getMySalaries, processSalary } from '../controllers/salaryController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { check } from 'express-validator';

const router = express.Router();

// Middleware
router.use(authMiddleware);

// Routes
router.get('/', requireRole(['ceo', 'manager']), getAllSalaries);
router.get('/my-history', getMySalaries);
router.post(
    '/process',
    [
        check('employeeId', 'Employee ID is required').not().isEmpty(),
        check('amount', 'Amount is required').isNumeric(),
        check('payPeriod', 'Pay period is required').not().isEmpty()
    ],
    requireRole(['ceo', 'manager']),
    processSalary
);

export default router;
