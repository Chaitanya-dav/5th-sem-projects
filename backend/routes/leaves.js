import express from 'express';
import Leave from '../models/Leave.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Apply for leave
router.post('/apply', authMiddleware, async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason, emergencyContact } = req.body;

    const leave = new Leave({
      employee: req.user.employee?._id,
      leaveType,
      startDate,
      endDate,
      reason,
      emergencyContact
    });

    await leave.save();
    await leave.populate('employee', 'firstName lastName employeeId department');

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      leave
    });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply for leave'
    });
  }
});

// Get leave requests
router.get('/', authMiddleware, async (req, res) => {
  try {
    let filter = {};
    
    // Employees can only see their own leaves
    if (req.user.role === 'employee') {
      filter.employee = req.user.employee?._id;
    }

    // Managers can see their team's leaves
    if (req.user.role === 'manager') {
      // This would need additional logic to get team members
      filter.employee = req.user.employee?._id; // Temporary - see own leaves only
    }

    const leaves = await Leave.find(filter)
      .populate('employee', 'firstName lastName employeeId department jobTitle')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      leaves
    });
  } catch (error) {
    console.error('Get leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave requests'
    });
  }
});

// Update leave status (Manager/HR/Admin only)
router.put('/:id/status', authMiddleware, requireRole(['admin', 'hr', 'manager']), async (req, res) => {
  try {
    const { status, comments } = req.body;

    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      {
        status,
        comments,
        approvedBy: req.user.employee?._id
      },
      { new: true, runValidators: true }
    )
      .populate('employee', 'firstName lastName employeeId')
      .populate('approvedBy', 'firstName lastName');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    res.json({
      success: true,
      message: `Leave request ${status} successfully`,
      leave
    });
  } catch (error) {
    console.error('Update leave status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update leave status'
    });
  }
});

// Get leave statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const employeeId = req.user.employee?._id;

    const stats = await Leave.aggregate([
      {
        $match: { employee: employeeId }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalLeaves = await Leave.countDocuments({ employee: employeeId });
    const approvedLeaves = await Leave.countDocuments({ 
      employee: employeeId, 
      status: 'approved' 
    });

    res.json({
      success: true,
      stats: {
        totalLeaves,
        approvedLeaves,
        statusBreakdown: stats
      }
    });
  } catch (error) {
    console.error('Get leave stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave statistics'
    });
  }
});

export default router;