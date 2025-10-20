import express from 'express';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats
} from '../controllers/employeeController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// Routes accessible by all authenticated users
router.get('/', getEmployees);
router.get('/stats', getEmployeeStats);
router.get('/:id', getEmployeeById);

// Routes requiring HR or Admin role
router.post('/', requireRole(['admin', 'hr']), createEmployee);
router.put('/:id', requireRole(['admin', 'hr']), updateEmployee);
router.delete('/:id', requireRole(['admin']), deleteEmployee);

export default router;