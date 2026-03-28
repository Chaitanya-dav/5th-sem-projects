import express from 'express';
import Leave from '../models/Leave.js';
import Employee from '../models/Employee.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { normalizeRole } from '../utils/roles.js';

const router = express.Router();

const getAllEmployeeIds = async () => {
  const employeeUsers = await User.find({ role: 'employee' }).select('_id');
  const userIds = employeeUsers.map((user) => user._id);
  const employees = await Employee.find({ user: { $in: userIds } }).select('_id');
  return employees.map((employee) => employee._id.toString());
};

const getScopeFilter = async (req) => {
  const role = normalizeRole(req.user.role);
  const selfEmployeeId = req.user.employee?._id?.toString();

  if (!selfEmployeeId) return { employee: null };
  if (role === 'ceo') return {};
  if (role === 'manager') {
    const employeeIds = await getAllEmployeeIds();
    return {
      $or: [{ employee: { $in: employeeIds } }, { employee: selfEmployeeId }],
    };
  }
  return { employee: selfEmployeeId };
};

const canManagerApprove = async (managerEmployeeId, leave) => {
  if (!managerEmployeeId) return false;
  const leaveOwner = await Employee.findById(leave.employee).populate('user', 'role');
  if (!leaveOwner) return false;
  const ownerRole = normalizeRole(leaveOwner.user?.role);

  return ownerRole === 'employee';
};

// Apply for leave
router.post('/apply', authMiddleware, async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason, emergencyContact } = req.body;

    if (!req.user.employee?._id) {
      return res.status(400).json({
        success: false,
        message: 'Employee profile is required before applying leave',
      });
    }

    const leave = new Leave({
      employee: req.user.employee._id,
      leaveType,
      startDate,
      endDate,
      reason,
      emergencyContact,
    });

    await leave.save();
    await leave.populate('employee', 'firstName lastName employeeId department');

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      leave,
    });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply for leave',
      error: error.message,
    });
  }
});

// Get leave requests
router.get('/', authMiddleware, async (req, res) => {
  try {
    const filter = await getScopeFilter(req);

    const leaves = await Leave.find(filter)
      .populate({
        path: 'employee',
        select: 'firstName lastName employeeId department jobTitle manager user',
        populate: { path: 'department', select: 'name' },
      })
      .populate({
        path: 'approvedBy',
        select: 'firstName lastName employeeId',
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      leaves,
    });
  } catch (error) {
    console.error('Get leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave requests',
      error: error.message,
    });
  }
});

// Update leave status (Manager/CEO)
router.put('/:id/status', authMiddleware, requireRole(['ceo', 'manager']), async (req, res) => {
  try {
    const { status, comments } = req.body;

    if (!['approved', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid leave status value',
      });
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
      });
    }

    const actorRole = normalizeRole(req.user.role);
    const previousStatus = leave.status;

    if (actorRole === 'manager') {
      const allowed = await canManagerApprove(req.user.employee?._id?.toString(), leave);
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: 'Managers can only approve/reject direct report leave requests',
        });
      }
    }

    leave.status = status;
    leave.comments = comments;
    leave.approvedBy = req.user.employee?._id;
    await leave.save();

    if (status === 'rejected' && previousStatus !== 'rejected') {
      const approverName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Manager/CEO';
      await Notification.create({
        recipient: leave.employee,
        type: 'leave_rejected',
        title: 'Leave request rejected',
        message: comments
          ? `Your leave request was rejected by ${approverName}. Comment: ${comments}`
          : `Your leave request was rejected by ${approverName}.`,
        leave: leave._id,
      });
    }

    await leave.populate({
      path: 'employee',
      select: 'firstName lastName employeeId department',
      populate: { path: 'department', select: 'name' },
    });
    await leave.populate('approvedBy', 'firstName lastName employeeId');

    res.json({
      success: true,
      message: `Leave request ${status} successfully`,
      leave,
    });
  } catch (error) {
    console.error('Update leave status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update leave status',
      error: error.message,
    });
  }
});

// Employee notifications for leave decisions
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const employeeId = req.user.employee?._id;
    if (!employeeId) {
      return res.json({ success: true, notifications: [] });
    }

    const notifications = await Notification.find({ recipient: employeeId })
      .populate('leave', 'leaveType startDate endDate status')
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error('Get leave notifications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message,
    });
  }
});

// Mark a notification as read (recipient only)
router.patch('/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    const employeeId = req.user.employee?._id;
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    if (!employeeId || notification.recipient.toString() !== employeeId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this notification',
      });
    }

    notification.isRead = true;
    await notification.save();

    return res.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update notification',
      error: error.message,
    });
  }
});

// Employee can delete their own rejected leave request
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
      });
    }

    const role = normalizeRole(req.user.role);
    const employeeId = req.user.employee?._id?.toString();

    if (role !== 'employee') {
      return res.status(403).json({
        success: false,
        message: 'Only employees can delete their own leave requests',
      });
    }

    if (!employeeId || leave.employee.toString() !== employeeId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own leave requests',
      });
    }

    if (leave.status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Only rejected leave requests can be deleted',
      });
    }

    await Notification.deleteMany({ leave: leave._id, recipient: leave.employee });
    await leave.deleteOne();

    return res.json({
      success: true,
      message: 'Rejected leave request deleted successfully',
    });
  } catch (error) {
    console.error('Delete leave error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete leave request',
      error: error.message,
    });
  }
});

// Get leave statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const filter = await getScopeFilter(req);

    const stats = await Leave.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const totalLeaves = await Leave.countDocuments(filter);
    const approvedLeaves = await Leave.countDocuments({ ...filter, status: 'approved' });
    const pendingLeaves = await Leave.countDocuments({ ...filter, status: 'pending' });

    res.json({
      success: true,
      stats: {
        totalLeaves,
        approvedLeaves,
        pendingLeaves,
        statusBreakdown: stats,
      },
    });
  } catch (error) {
    console.error('Get leave stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave statistics',
      error: error.message,
    });
  }
});

export default router;
