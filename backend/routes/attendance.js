import express from 'express';
import Attendance from '../models/Attendance.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Record attendance (clock in/out)
router.post('/record', authMiddleware, async (req, res) => {
  try {
    const { employeeId, date, clockIn, clockOut, status, notes } = req.body;

    // Find existing record for today
    const today = new Date().toISOString().split('T')[0];
    const existingRecord = await Attendance.findOne({
      employee: req.user.employee?._id || employeeId,
      date: date || today
    });

    if (existingRecord) {
      // Update existing record
      if (clockOut) existingRecord.clockOut = clockOut;
      if (status) existingRecord.status = status;
      if (notes) existingRecord.notes = notes;
      
      await existingRecord.save();
      await existingRecord.populate('employee', 'firstName lastName employeeId');

      return res.json({
        success: true,
        message: 'Attendance updated successfully',
        attendance: existingRecord
      });
    } else {
      // Create new record
      const attendance = new Attendance({
        employee: req.user.employee?._id || employeeId,
        date: date || today,
        clockIn,
        clockOut,
        status: status || 'present',
        notes
      });

      await attendance.save();
      await attendance.populate('employee', 'firstName lastName employeeId');

      res.status(201).json({
        success: true,
        message: 'Attendance recorded successfully',
        attendance
      });
    }
  } catch (error) {
    console.error('Record attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record attendance'
    });
  }
});

// Get attendance records
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { employeeId, date, startDate, endDate, department } = req.query;
    
    let filter = {};
    
    // Regular employees can only see their own records
    if (req.user.role === 'employee') {
      filter.employee = req.user.employee?._id;
    } else if (employeeId) {
      filter.employee = employeeId;
    }

    if (date) {
      filter.date = date;
    }

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(filter)
      .populate('employee', 'firstName lastName employeeId department')
      .sort({ date: -1 });

    res.json({
      success: true,
      attendance
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records'
    });
  }
});

// Get today's attendance
router.get('/today', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const attendance = await Attendance.find({ date: today })
      .populate('employee', 'firstName lastName employeeId department jobTitle');

    res.json({
      success: true,
      attendance
    });
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch today\'s attendance'
    });
  }
});

export default router;