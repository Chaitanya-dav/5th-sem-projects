import express from 'express';
import Attendance from '../models/Attendance.js';
import Employee from '../models/Employee.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';
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

const getAllEmployeeIds = async () => {
  const employeeUsers = await User.find({ role: 'employee' }).select('_id');
  const userIds = employeeUsers.map((user) => user._id);
  const employees = await Employee.find({ user: { $in: userIds } }).select('_id');
  return employees.map((employee) => employee._id.toString());
};

const resolveTargetEmployeeId = async (req, requestedEmployeeId) => {
  const role = normalizeRole(req.user.role);
  const selfEmployeeId = req.user.employee?._id?.toString();

  if (!selfEmployeeId) return null;
  if (role === 'employee') return selfEmployeeId;
  if (role === 'ceo') return requestedEmployeeId || selfEmployeeId;

  if (!requestedEmployeeId) return selfEmployeeId;
  if (requestedEmployeeId === selfEmployeeId) return selfEmployeeId;

  const employeeIds = await getAllEmployeeIds();
  return employeeIds.includes(requestedEmployeeId) ? requestedEmployeeId : null;
};

const getScopeFilter = async (req) => {
  const role = normalizeRole(req.user.role);
  const selfEmployeeId = req.user.employee?._id?.toString();
  if (!selfEmployeeId) return { employee: null };

  if (role === 'ceo') return {};
  if (role === 'employee') return { employee: selfEmployeeId };

  const employeeIds = await getAllEmployeeIds();
  return { employee: { $in: employeeIds } };
};

// Record attendance (clock in/out)
router.post('/record', authMiddleware, async (req, res) => {
  try {
    const {
      employeeId,
      employee_id,
      date,
      clockIn,
      clockOut,
      clock_in,
      clock_out,
      status,
      notes,
      location,
    } = req.body;

    const targetEmployeeId = await resolveTargetEmployeeId(req, employeeId || employee_id);
    if (!targetEmployeeId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to record attendance for this employee',
      });
    }

    const attendanceDate = startOfDay(date || new Date());
    const existingRecord = await Attendance.findOne({
      employee: targetEmployeeId,
      date: {
        $gte: startOfDay(attendanceDate),
        $lte: endOfDay(attendanceDate),
      },
    });

    const normalizedClockIn = clockIn || clock_in;
    const normalizedClockOut = clockOut || clock_out;

    if (existingRecord) {
      if (normalizedClockIn) existingRecord.clockIn = normalizedClockIn.slice(0, 5);
      if (normalizedClockOut) existingRecord.clockOut = normalizedClockOut.slice(0, 5);
      if (status) existingRecord.status = status;
      if (notes) existingRecord.notes = notes;
      if (location) existingRecord.location = location;

      await existingRecord.save();
      await existingRecord.populate('employee', 'firstName lastName employeeId department');

      return res.json({
        success: true,
        message: 'Attendance updated successfully',
        attendance: existingRecord,
      });
    }

    const attendance = new Attendance({
      employee: targetEmployeeId,
      date: attendanceDate,
      clockIn: normalizedClockIn ? normalizedClockIn.slice(0, 5) : undefined,
      clockOut: normalizedClockOut ? normalizedClockOut.slice(0, 5) : undefined,
      status: status || 'present',
      notes,
      location: location || 'office',
    });

    await attendance.save();
    await attendance.populate('employee', 'firstName lastName employeeId department');

    return res.status(201).json({
      success: true,
      message: 'Attendance recorded successfully',
      attendance,
    });
  } catch (error) {
    console.error('Record attendance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record attendance',
      error: error.message,
    });
  }
});

// Get attendance records
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { employeeId, date, startDate, endDate } = req.query;

    const scopeFilter = await getScopeFilter(req);
    const filter = { ...scopeFilter };

    if (employeeId) {
      const allowedEmployeeId = await resolveTargetEmployeeId(req, employeeId);
      if (!allowedEmployeeId) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to access this employee attendance data',
        });
      }
      filter.employee = allowedEmployeeId;
    }

    if (date) {
      filter.date = {
        $gte: startOfDay(date),
        $lte: endOfDay(date),
      };
    }

    if (startDate && endDate) {
      filter.date = {
        $gte: startOfDay(startDate),
        $lte: endOfDay(endDate),
      };
    }

    const attendance = await Attendance.find(filter)
      .populate('employee', 'firstName lastName employeeId department jobTitle manager')
      .sort({ date: -1 });

    return res.json({
      success: true,
      attendance,
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records',
      error: error.message,
    });
  }
});

// Get today's attendance
router.get('/today', authMiddleware, async (req, res) => {
  try {
    const scopeFilter = await getScopeFilter(req);

    const attendance = await Attendance.find({
      ...scopeFilter,
      date: {
        $gte: startOfDay(new Date()),
        $lte: endOfDay(new Date()),
      },
    }).populate('employee', 'firstName lastName employeeId department jobTitle');

    return res.json({
      success: true,
      attendance,
    });
  } catch (error) {
    console.error("Get today attendance error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch today's attendance",
      error: error.message,
    });
  }
});

// Get attendance statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;
    const now = new Date();
    const currentMonth = month ? Number(month) : now.getMonth() + 1;
    const currentYear = year ? Number(year) : now.getFullYear();

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    const scopeFilter = await getScopeFilter(req);
    const match = {
      ...scopeFilter,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    if (employeeId) {
      const allowedEmployeeId = await resolveTargetEmployeeId(req, employeeId);
      if (!allowedEmployeeId) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to access this employee attendance statistics',
        });
      }
      match.employee = allowedEmployeeId;
    }

    const records = await Attendance.find(match);
    const statusCounts = records.reduce(
      (acc, record) => {
        acc[record.status] = (acc[record.status] || 0) + 1;
        return acc;
      },
      {}
    );

    const totalHours = records.reduce((sum, record) => sum + (record.totalHours || 0), 0);

    return res.json({
      success: true,
      stats: {
        present: statusCounts.present || 0,
        absent: statusCounts.absent || 0,
        half_day: statusCounts.half_day || 0,
        holiday: statusCounts.holiday || 0,
        weekend: statusCounts.weekend || 0,
        totalRecords: records.length,
        totalHours: Number(totalHours.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance statistics',
      error: error.message,
    });
  }
});

export default router;
