import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import Employee from '../models/Employee.js';

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Register new user
export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password, firstName, lastName, phone, jobTitle, department } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = new User({
      email,
      password,
      role: 'employee'
    });

    await user.save();

    // Generate employee ID
    const employeeId = `EMP${Date.now()}`;

    // Create employee record
    const employee = new Employee({
      user: user._id,
      employeeId,
      firstName,
      lastName,
      email,
      phone,
      jobTitle,
      department
    });

    await employee.save();

    // Generate JWT token
    const token = generateToken(user._id);

    // Update user with employee reference
    user.employee = employee._id;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user and populate employee data
    const user = await User.findOne({ email, isActive: true })
      .populate('employee');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        employeeId: user.employee?.employeeId,
        firstName: user.employee?.firstName,
        lastName: user.employee?.lastName,
        jobTitle: user.employee?.jobTitle,
        department: user.employee?.department
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('employee');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        employeeId: user.employee?.employeeId,
        firstName: user.employee?.firstName,
        lastName: user.employee?.lastName,
        jobTitle: user.employee?.jobTitle,
        department: user.employee?.department
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user data'
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, jobTitle } = req.body;

    // Update employee data
    const employee = await Employee.findOne({ user: req.user._id });
    if (employee) {
      if (firstName) employee.firstName = firstName;
      if (lastName) employee.lastName = lastName;
      if (phone) employee.phone = phone;
      if (jobTitle) employee.jobTitle = jobTitle;
      
      await employee.save();
    }

    const updatedUser = await User.findById(req.user._id)
      .select('-password')
      .populate('employee');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};