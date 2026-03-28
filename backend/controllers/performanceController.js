import Performance from '../models/Performance.js';
import Employee from '../models/Employee.js';
import User from '../models/User.js';
import { validationResult } from 'express-validator';
import { normalizeRole } from '../utils/roles.js';

const getAllEmployeeIds = async () => {
  const employeeUsers = await User.find({ role: 'employee' }).select('_id');
  const userIds = employeeUsers.map((user) => user._id);
  const employees = await Employee.find({ user: { $in: userIds } }).select('_id');
  return employees.map((employee) => employee._id.toString());
};

const getScopeFilter = async (reqUser) => {
  const role = normalizeRole(reqUser.role);
  const selfEmployeeId = reqUser.employee?._id?.toString();

  if (!selfEmployeeId) return { employee: null };
  if (role === 'ceo') return {};
  if (role === 'manager') {
    const employeeIds = await getAllEmployeeIds();
    return { employee: { $in: employeeIds } };
  }
  return { employee: selfEmployeeId };
};

const canReviewEmployee = async (reqUser, employeeId) => {
  const role = normalizeRole(reqUser.role);
  const selfEmployeeId = reqUser.employee?._id?.toString();
  if (!selfEmployeeId) return false;
  if (role === 'ceo') return true;
  if (role !== 'manager') return false;

  const targetEmployee = await Employee.findById(employeeId).populate('user', 'role');
  return normalizeRole(targetEmployee?.user?.role) === 'employee';
};

export const getReviews = async (req, res) => {
  try {
    const filter = await getScopeFilter(req.user);
    const reviews = await Performance.find(filter)
      .populate({
        path: 'employee',
        select: 'firstName lastName employeeId department manager',
        populate: { path: 'department', select: 'name' },
      })
      .populate('reviewer', 'firstName lastName role')
      .sort({ createdAt: -1 });

    res.json({ success: true, reviews });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

export const addReview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { employee, rating, feedback, goals } = req.body;
    const isAllowed = await canReviewEmployee(req.user, employee);

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: 'Managers can only review direct reports',
      });
    }

    const review = new Performance({
      employee,
      rating,
      feedback,
      goals,
      reviewer: req.user.id,
    });

    await review.save();

    await review.populate('employee', 'firstName lastName employeeId');
    await review.populate('reviewer', 'firstName lastName role');

    res.status(201).json({ success: true, review });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { rating, feedback, goals } = req.body;
    const actorRole = normalizeRole(req.user.role);

    const review = await Performance.findById(req.params.id).populate('employee', 'manager');
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const isReviewer = review.reviewer.toString() === req.user.id;
    const isCEO = actorRole === 'ceo';
    const isManagerForReviewee =
      actorRole === 'manager' &&
      review.employee?.manager?.toString() === req.user.employee?._id?.toString();

    if (!isReviewer && !isCEO && !isManagerForReviewee) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    review.rating = rating || review.rating;
    review.feedback = feedback || review.feedback;
    review.goals = goals || review.goals;

    await review.save();
    await review.populate('employee', 'firstName lastName employeeId');
    await review.populate('reviewer', 'firstName lastName role');

    res.json({ success: true, review });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const actorRole = normalizeRole(req.user.role);
    const review = await Performance.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const isReviewer = review.reviewer.toString() === req.user.id;
    if (actorRole !== 'ceo' && !isReviewer) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await review.deleteOne();
    res.json({ success: true, message: 'Review removed' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
