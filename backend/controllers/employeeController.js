import Employee from '../models/Employee.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import mongoose from 'mongoose';
import { normalizeRole } from '../utils/roles.js';

const generateEmployeeId = async () => {
  const count = await Employee.countDocuments();
  return `EMP${String(count + 1).padStart(4, '0')}`;
};

const getScopedFilter = (reqUser) => {
  const role = normalizeRole(reqUser.role);
  const employeeId = reqUser.employee?._id;

  if (role === 'ceo') return {};
  if (role === 'manager' && employeeId) {
    return {
      $or: [{ _id: employeeId }, { manager: employeeId }],
    };
  }

  return employeeId ? { _id: employeeId } : { _id: null };
};

const canAccessEmployee = (reqUser, employeeDoc) => {
  const role = normalizeRole(reqUser.role);
  const selfEmployeeId = reqUser.employee?._id?.toString();
  const targetId = employeeDoc._id.toString();
  const targetManagerId = employeeDoc.manager?.toString();

  if (role === 'ceo') return true;
  if (role === 'manager') return targetId === selfEmployeeId || targetManagerId === selfEmployeeId;
  return targetId === selfEmployeeId;
};

const resolveDepartment = async (department) => {
  if (!department) return null;
  if (mongoose.Types.ObjectId.isValid(department)) {
    const byId = await Department.findById(department);
    if (byId) return byId._id;
  }

  const byName = await Department.findOne({ name: department });
  if (byName) return byName._id;

  const created = await Department.create({ name: department, description: `${department} department` });
  return created._id;
};

export const getEmployees = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      department,
      status,
      search,
      sortBy = 'firstName',
      sortOrder = 'asc',
    } = req.query;

    const scopeFilter = getScopedFilter(req.user);
    const conditions = [];

    if (Object.keys(scopeFilter).length > 0) {
      conditions.push(scopeFilter);
    }
    if (department) conditions.push({ department });
    if (status) conditions.push({ status });
    if (search) {
      conditions.push({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { employeeId: { $regex: search, $options: 'i' } },
        ],
      });
    }

    const filter = conditions.length === 0 ? {} : conditions.length === 1 ? conditions[0] : { $and: conditions };

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const employees = await Employee.find(filter)
      .populate('department', 'name')
      .populate('manager', 'firstName lastName employeeId')
      .populate('user', 'role')
      .sort(sort)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Employee.countDocuments(filter);

    res.json({
      success: true,
      employees,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
    });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('department', 'name description')
      .populate('manager', 'firstName lastName email jobTitle')
      .populate('user', 'role isActive lastLogin firstName lastName');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    if (!canAccessEmployee(req.user, employee)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied for this employee record',
      });
    }

    res.json({
      success: true,
      employee,
    });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee',
    });
  }
};

export const createEmployee = async (req, res) => {
  try {
    const actorRole = normalizeRole(req.user.role);
    const actorEmployee = req.user.employee;
    const {
      firstName,
      lastName,
      email,
      phone,
      jobTitle,
      department,
      manager,
      salary,
      employmentType,
      role = 'employee',
      password = 'welcome@123',
    } = req.body;

    const requestedRole = normalizeRole(role);

    if (actorRole === 'manager' && requestedRole !== 'employee') {
      return res.status(403).json({
        success: false,
        message: 'Managers can only create employee accounts',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Employee already exists with this email',
      });
    }

    const departmentId =
      actorRole === 'manager'
        ? actorEmployee?.department?._id || actorEmployee?.department
        : await resolveDepartment(department);

    const managerId =
      actorRole === 'manager'
        ? actorEmployee?._id
        : manager || null;

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: requestedRole,
      phone,
    });

    const employee = await Employee.create({
      user: user._id,
      employeeId: await generateEmployeeId(),
      firstName,
      lastName,
      email,
      phone,
      jobTitle: jobTitle || 'Employee',
      department: departmentId || undefined,
      manager: managerId || undefined,
      salary,
      employmentType,
    });

    user.employee = employee._id;
    await user.save();

    await employee.populate('department', 'name');
    await employee.populate('manager', 'firstName lastName employeeId');

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      employee,
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create employee',
      error: error.message,
    });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const actorRole = normalizeRole(req.user.role);
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    if (!canAccessEmployee(req.user, employee)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to update this employee',
      });
    }

    const updates = { ...req.body };

    if (actorRole === 'manager') {
      // Managers should not alter reporting hierarchy or department boundaries.
      delete updates.department;
      delete updates.manager;
      delete updates.role;
    }

    if (updates.department) {
      updates.department = await resolveDepartment(updates.department);
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('department', 'name')
      .populate('manager', 'firstName lastName employeeId');

    if (updates.role && actorRole === 'ceo') {
      await User.findByIdAndUpdate(updatedEmployee.user, { role: normalizeRole(updates.role) });
    }

    if (updates.firstName || updates.lastName || updates.phone) {
      await User.findByIdAndUpdate(updatedEmployee.user, {
        ...(updates.firstName ? { firstName: updates.firstName } : {}),
        ...(updates.lastName ? { lastName: updates.lastName } : {}),
        ...(updates.phone ? { phone: updates.phone } : {}),
      });
    }

    res.json({
      success: true,
      message: 'Employee updated successfully',
      employee: updatedEmployee,
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update employee',
      error: error.message,
    });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const actorRole = normalizeRole(req.user.role);
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const targetUser = await User.findById(employee.user).select('role');
    const targetRole = normalizeRole(targetUser?.role);

    if (targetRole === 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'CEO account cannot be removed',
      });
    }

    if (actorRole === 'manager' && targetRole !== 'employee') {
      return res.status(403).json({
        success: false,
        message: 'Managers can remove only employee accounts',
      });
    }

    if (employee.user?.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot remove your own account',
      });
    }

    await User.findByIdAndDelete(employee.user);
    await Employee.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Employee deleted successfully',
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete employee',
    });
  }
};

export const getEmployeeStats = async (req, res) => {
  try {
    const scopedFilter = getScopedFilter(req.user);
    const totalEmployees = await Employee.countDocuments(scopedFilter);
    const activeEmployees = await Employee.countDocuments({ ...scopedFilter, status: 'active' });
    const onLeave = await Employee.countDocuments({ ...scopedFilter, status: 'on_leave' });

    const matchStage = Object.keys(scopedFilter).length ? [{ $match: scopedFilter }] : [];

    const departmentStats = await Employee.aggregate([
      ...matchStage,
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'dept',
        },
      },
      {
        $unwind: {
          path: '$dept',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$dept.name',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          department: { $ifNull: ['$_id', 'Unassigned'] },
          count: 1,
        },
      },
    ]);

    res.json({
      success: true,
      stats: {
        totalEmployees,
        activeEmployees,
        onLeave,
        departmentStats,
      },
    });
  } catch (error) {
    console.error('Get employee stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee statistics',
    });
  }
};
