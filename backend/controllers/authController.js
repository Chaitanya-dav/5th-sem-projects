import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import { normalizeRole } from '../utils/roles.js';

const generateEmployeeId = async () => {
  const count = await Employee.countDocuments();
  return `EMP${String(count + 1).padStart(4, '0')}`;
};

const signToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: normalizeRole(user.role) },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

const resolveDepartmentId = async (departmentInput) => {
  if (!departmentInput) return null;

  if (mongoose.Types.ObjectId.isValid(departmentInput)) {
    const existingById = await Department.findById(departmentInput);
    if (existingById) return existingById._id;
  }

  const existingByName = await Department.findOne({ name: departmentInput });
  if (existingByName) return existingByName._id;

  const created = await Department.create({
    name: departmentInput,
    description: `${departmentInput} department`,
  });

  return created._id;
};

const buildAuthUserPayload = async (user) => {
  const employee = await Employee.findOne({ user: user._id }).populate('department', 'name');
  const firstName = user.firstName || employee?.firstName || '';
  const lastName = user.lastName || employee?.lastName || '';

  return {
    id: user._id.toString(),
    firstName,
    lastName,
    email: user.email,
    role: normalizeRole(user.role),
    employeeId: employee?.employeeId || null,
    employee: employee || null,
  };
};

export const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      jobTitle,
      department,
      role,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    const normalizedRole = normalizeRole(role);
    const departmentId = await resolveDepartmentId(department);

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: normalizedRole,
      phone,
    });

    const employee = await Employee.create({
      user: user._id,
      employeeId: await generateEmployeeId(),
      firstName,
      lastName,
      email,
      phone,
      jobTitle: jobTitle || (normalizedRole === 'ceo' ? 'Chief Executive Officer' : 'Employee'),
      department: departmentId || undefined,
    });

    user.employee = employee._id;
    await user.save();

    const token = signToken(user);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: await buildAuthUserPayload(user),
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: err.message,
    });
  }
};

export const updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = `/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      filePath,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Use updateOne so legacy users missing newly-required fields can still login.
    await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

    const token = signToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: await buildAuthUserPayload(user),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: err.message,
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: await buildAuthUserPayload(user) });
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, jobTitle } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName, phone },
      { new: true, runValidators: true }
    ).select('-password');

    await Employee.findOneAndUpdate(
      { user: req.user.id },
      { firstName, lastName, phone, ...(jobTitle ? { jobTitle } : {}) },
      { new: true }
    );

    res.json({ success: true, user: await buildAuthUserPayload(user) });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
