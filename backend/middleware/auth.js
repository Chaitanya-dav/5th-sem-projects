import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import { normalizeRole } from '../utils/roles.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided or invalid format",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const dbUser = await User.findById(decoded.id).select('-password');
    if (!dbUser || !dbUser.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive or does not exist'
      });
    }

    req.user = {
      id: dbUser._id.toString(),
      email: dbUser.email,
      role: normalizeRole(dbUser.role),
      firstName: dbUser.firstName,
      lastName: dbUser.lastName
    };

    // Fetch and attach employee record if it exists
    try {
      const employee = dbUser.employee
        ? await Employee.findById(dbUser.employee).populate('department', 'name')
        : await Employee.findOne({ user: decoded.id }).populate('department', 'name');

      if (employee) {
        req.user.employee = employee;
      }
    } catch (empError) {
      console.error("Error fetching employee context:", empError);
      // Continue without employee context (e.g. for pure admins)
    }

    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// Role-based authorization middleware
export const requireRole = (roles) => {
  const normalizedRoles = roles.map(normalizeRole);
  return (req, res, next) => {
    const actorRole = normalizeRole(req.user?.role);
    if (!req.user || !normalizedRoles.includes(actorRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }
    next();
  };
};

// Check if user is owner or has specific role
export const requireOwnershipOrRole = (roles) => {
  const normalizedRoles = roles.map(normalizeRole);
  return (req, res, next) => {
    const isOwner = req.params.id === req.user.id;
    const hasRole = normalizedRoles.includes(normalizeRole(req.user.role));

    if (!isOwner && !hasRole) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }
    next();
  };
};
