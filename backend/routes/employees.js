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

// Hierarchy-aware management routes
router.post('/', requireRole(['ceo', 'manager']), createEmployee);
router.put('/:id', requireRole(['ceo', 'manager']), updateEmployee);
router.delete('/:id', requireRole(['ceo', 'manager']), deleteEmployee);

export default router;
