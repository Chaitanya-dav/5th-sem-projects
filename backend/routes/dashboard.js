import express from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import Employee from '../models/Employee.js';
import Leave from '../models/Leave.js';
import Attendance from '../models/Attendance.js';
import { Asset, AssetAssignment } from '../models/Asset.js';
import Performance from '../models/Performance.js';
import Activity from '../models/Activity.js';
import { normalizeRole } from '../utils/roles.js';

const router = express.Router();

const startOfDay = (value = new Date()) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value = new Date()) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const getManagerTeamIds = async (managerEmployeeId) => {
  const team = await Employee.find({
    $or: [{ _id: managerEmployeeId }, { manager: managerEmployeeId }],
  }).select('_id');
  return team.map((employee) => employee._id.toString());
};

const getScopedEmployeeIds = async (reqUser) => {
  const role = normalizeRole(reqUser.role);
  const selfId = reqUser.employee?._id?.toString();
  if (!selfId) return [];
  if (role === 'ceo') {
    const all = await Employee.find().select('_id');
    return all.map((employee) => employee._id.toString());
  }
  if (role === 'manager') {
    return getManagerTeamIds(selfId);
  }
  return [selfId];
};

router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const role = normalizeRole(req.user.role);
    const employeeIds = await getScopedEmployeeIds(req.user);

    const totalEmployees =
      role === 'ceo'
        ? await Employee.countDocuments()
        : employeeIds.length;

    const presentToday = await Attendance.countDocuments({
      employee: { $in: employeeIds },
      date: { $gte: startOfDay(), $lte: endOfDay() },
      status: 'present',
    });

    const pendingLeaves = await Leave.countDocuments({
      employee: { $in: employeeIds },
      status: 'pending',
    });

    const myAssetsCount =
      role === 'employee'
        ? await AssetAssignment.countDocuments({
            employee: req.user.employee?._id,
            assignmentStatus: 'active',
          })
        : await Asset.countDocuments({
            status: 'assigned',
          });

    const performanceReviews = await Performance.countDocuments({
      employee: { $in: employeeIds },
    });

    const authority = {
      canApproveLeave: role === 'ceo' || role === 'manager',
      canManageAssets: role === 'ceo' || role === 'manager',
      canReviewPerformance: role === 'ceo' || role === 'manager',
      canViewOrganizationWide: role === 'ceo',
    };

    res.json({
      success: true,
      summary: {
        role,
        totalEmployees,
        presentToday,
        pendingLeaves,
        activeAssets: myAssetsCount,
        performanceReviews,
      },
      authority,
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard summary',
      error: error.message,
    });
  }
});

router.get('/activity', authMiddleware, async (req, res) => {
  try {
    const actorRole = normalizeRole(req.user.role);
    const filter = actorRole === 'ceo' ? {} : { isGlobal: true };

    const activities = await Activity.find(filter)
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('createdBy', 'firstName lastName role');

    res.json({
      success: true,
      activities: activities.map((activity) => ({
        id: activity._id.toString(),
        action: activity.action,
        user: activity.user,
        type: activity.type,
        isGlobal: activity.isGlobal,
        time: activity.createdAt,
        createdBy: activity.createdBy
          ? {
              id: activity.createdBy._id.toString(),
              firstName: activity.createdBy.firstName,
              lastName: activity.createdBy.lastName,
              role: normalizeRole(activity.createdBy.role),
            }
          : null,
      })),
    });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activities',
      error: error.message,
    });
  }
});

router.post('/activity', authMiddleware, requireRole(['ceo', 'manager']), async (req, res) => {
  try {
    const actorRole = normalizeRole(req.user.role);
    const { action, user, type = 'general', isGlobal = true } = req.body;

    if (!action || !action.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Activity action is required',
      });
    }

    // Managers are limited to announcement publishing only.
    if (actorRole === 'manager' && type !== 'announcement') {
      return res.status(403).json({
        success: false,
        message: 'Managers can only create announcement activities',
      });
    }

    const activity = await Activity.create({
      action: action.trim(),
      user: user?.trim() || `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || actorRole.toUpperCase(),
      type: actorRole === 'manager' ? 'announcement' : type,
      isGlobal: actorRole === 'manager' ? true : isGlobal,
      createdBy: req.user.id,
    });

    await activity.populate('createdBy', 'firstName lastName role');

    return res.status(201).json({
      success: true,
      message: 'Activity added successfully',
      activity: {
        id: activity._id.toString(),
        action: activity.action,
        user: activity.user,
        type: activity.type,
        isGlobal: activity.isGlobal,
        time: activity.createdAt,
        createdBy: activity.createdBy
          ? {
              id: activity.createdBy._id.toString(),
              firstName: activity.createdBy.firstName,
              lastName: activity.createdBy.lastName,
              role: normalizeRole(activity.createdBy.role),
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Create activity error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create activity',
      error: error.message,
    });
  }
});

router.delete('/activity/:id', authMiddleware, requireRole(['ceo', 'manager']), async (req, res) => {
  try {
    const actorRole = normalizeRole(req.user.role);
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found',
      });
    }

    if (
      actorRole === 'manager' &&
      (activity.type !== 'announcement' || activity.createdBy.toString() !== req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Managers can remove only their own announcements',
      });
    }

    await activity.deleteOne();

    return res.json({
      success: true,
      message: 'Activity removed successfully',
    });
  } catch (error) {
    console.error('Delete activity error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove activity',
      error: error.message,
    });
  }
});

export default router;
