import express from 'express';
import Department from '../models/Department.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all departments
router.get('/', authMiddleware, async (req, res) => {
  try {
    const departments = await Department.find()
      .populate('manager', 'firstName lastName email')
      .populate('parentDepartment', 'name');

    res.json({
      success: true,
      departments
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments'
    });
  }
});

// Get department by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('manager', 'firstName lastName email jobTitle')
      .populate('parentDepartment', 'name');

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.json({
      success: true,
      department
    });
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department'
    });
  }
});

// Create new department (Admin/HR only)
router.post('/', authMiddleware, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const department = new Department(req.body);
    await department.save();

    await department.populate('manager', 'firstName lastName');
    await department.populate('parentDepartment', 'name');

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      department
    });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create department'
    });
  }
});

// Update department (Admin/HR only)
router.put('/:id', authMiddleware, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('manager', 'firstName lastName')
      .populate('parentDepartment', 'name');

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.json({
      success: true,
      message: 'Department updated successfully',
      department
    });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update department'
    });
  }
});

export default router;