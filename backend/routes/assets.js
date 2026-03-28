import express from 'express';
import { Asset, AssetAssignment } from '../models/Asset.js';
import Employee from '../models/Employee.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { normalizeRole } from '../utils/roles.js';

const router = express.Router();

const getManagerTeamIds = async (managerEmployeeId) => {
  const team = await Employee.find({
    $or: [{ _id: managerEmployeeId }, { manager: managerEmployeeId }],
  }).select('_id');
  return team.map((emp) => emp._id.toString());
};

const ensureManagerCanAccessEmployee = async (req, employeeId) => {
  const actorRole = normalizeRole(req.user.role);
  if (actorRole === 'ceo') return true;
  if (actorRole !== 'manager') return false;

  const teamIds = await getManagerTeamIds(req.user.employee?._id?.toString());
  return teamIds.includes(employeeId);
};

const withCurrentHolders = async (assets) => {
  const assetIds = assets.map((asset) => asset._id);
  const activeAssignments = await AssetAssignment.find({
    asset: { $in: assetIds },
    assignmentStatus: 'active',
  }).populate('employee', 'firstName lastName employeeId');

  const assignmentMap = activeAssignments.reduce((acc, assignment) => {
    acc[assignment.asset.toString()] = assignment.employee;
    return acc;
  }, {});

  return assets.map((asset) => ({
    ...asset.toObject(),
    currentHolder: assignmentMap[asset._id.toString()] || null,
  }));
};

// Create a new asset (CEO only)
router.post('/', authMiddleware, requireRole(['ceo']), async (req, res) => {
  try {
    const asset = await Asset.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Asset created successfully',
      asset,
    });
  } catch (error) {
    console.error('Create asset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create asset',
      error: error.message,
    });
  }
});

// Get all assets with role-based visibility
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, category } = req.query;
    const actorRole = normalizeRole(req.user.role);
    const baseFilter = {};

    if (status) baseFilter.status = status;
    if (category) baseFilter.category = category;

    if (actorRole === 'employee') {
      const assignments = await AssetAssignment.find({
        employee: req.user.employee?._id,
        assignmentStatus: 'active',
      }).populate('asset');

      const assets = assignments
        .map((assignment) => assignment.asset)
        .filter(Boolean)
        .filter((asset) => {
          if (status && asset.status !== status) return false;
          if (category && asset.category !== category) return false;
          return true;
        });

      return res.json({
        success: true,
        assets: assets.map((asset) => ({ ...asset.toObject(), currentHolder: req.user.employee })),
      });
    }

    let filter = { ...baseFilter };
    if (actorRole === 'manager') {
      const teamIds = await getManagerTeamIds(req.user.employee?._id?.toString());
      const assignedIds = await AssetAssignment.find({
        employee: { $in: teamIds },
        assignmentStatus: 'active',
      }).select('asset');

      const scopedAssetIds = assignedIds.map((item) => item.asset);
      filter = {
        ...baseFilter,
        $or: [{ _id: { $in: scopedAssetIds } }, { status: 'available' }],
      };
    }

    const assets = await Asset.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      assets: await withCurrentHolders(assets),
    });
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assets',
      error: error.message,
    });
  }
});

// Get asset statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const actorRole = normalizeRole(req.user.role);

    if (actorRole === 'employee') {
      const myAssignedAssets = await AssetAssignment.countDocuments({
        employee: req.user.employee?._id,
        assignmentStatus: 'active',
      });

      return res.json({
        success: true,
        stats: {
          totalAssets: myAssignedAssets,
          assignedAssets: myAssignedAssets,
          availableAssets: 0,
          maintenanceAssets: 0,
          retiredAssets: 0,
        },
      });
    }

    if (actorRole === 'manager') {
      const teamIds = await getManagerTeamIds(req.user.employee?._id?.toString());
      const assignmentRows = await AssetAssignment.find({
        employee: { $in: teamIds },
        assignmentStatus: 'active',
      }).select('asset');
      const teamAssetIds = assignmentRows.map((row) => row.asset);

      const availableCount = await Asset.countDocuments({ status: 'available' });
      const teamAssetTotal = await Asset.countDocuments({ _id: { $in: teamAssetIds } });
      const maintenanceAssets = await Asset.countDocuments({
        _id: { $in: teamAssetIds },
        status: 'maintenance',
      });

      return res.json({
        success: true,
        stats: {
          totalAssets: teamAssetTotal + availableCount,
          availableAssets: availableCount,
          assignedAssets: teamAssetTotal,
          maintenanceAssets,
          retiredAssets: 0,
        },
      });
    }

    const totalAssets = await Asset.countDocuments();
    const availableAssets = await Asset.countDocuments({ status: 'available' });
    const assignedAssets = await Asset.countDocuments({ status: 'assigned' });
    const maintenanceAssets = await Asset.countDocuments({ status: 'maintenance' });
    const retiredAssets = await Asset.countDocuments({ status: 'retired' });

    return res.json({
      success: true,
      stats: {
        totalAssets,
        availableAssets,
        assignedAssets,
        maintenanceAssets,
        retiredAssets,
      },
    });
  } catch (error) {
    console.error('Get asset stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch asset statistics',
      error: error.message,
    });
  }
});

// Get my assigned assets
router.get('/my-assets', authMiddleware, async (req, res) => {
  try {
    const assignments = await AssetAssignment.find({
      employee: req.user.employee?._id,
      assignmentStatus: 'active',
    })
      .populate('asset')
      .sort({ assignedDate: -1 });

    res.json({
      success: true,
      assignments,
    });
  } catch (error) {
    console.error('Get my assets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned assets',
      error: error.message,
    });
  }
});

// Get asset by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found',
      });
    }

    const assignments = await AssetAssignment.find({ asset: req.params.id })
      .populate('employee', 'firstName lastName employeeId department')
      .populate('assignedBy', 'firstName lastName employeeId')
      .sort({ assignedDate: -1 });

    const actorRole = normalizeRole(req.user.role);
    if (actorRole === 'employee') {
      const hasOwnership = assignments.some(
        (assignment) =>
          assignment.employee?._id?.toString() === req.user.employee?._id?.toString()
      );

      if (!hasOwnership) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view this asset',
        });
      }
    }

    if (actorRole === 'manager') {
      const teamIds = await getManagerTeamIds(req.user.employee?._id?.toString());
      const visible = assignments.some((assignment) =>
        teamIds.includes(assignment.employee?._id?.toString())
      );

      if (!visible && asset.status !== 'available') {
        return res.status(403).json({
          success: false,
          message: 'Managers can only view team or available assets',
        });
      }
    }

    return res.json({
      success: true,
      asset: {
        ...asset.toObject(),
        assignments,
      },
    });
  } catch (error) {
    console.error('Get asset error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch asset',
      error: error.message,
    });
  }
});

// Assign asset (CEO/Manager)
router.post('/assign', authMiddleware, requireRole(['ceo', 'manager']), async (req, res) => {
  try {
    const { assetId, employeeId, assignedDate, expectedReturnDate, notes } = req.body;

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found',
      });
    }

    if (asset.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Asset is not available for assignment',
      });
    }

    const allowed = await ensureManagerCanAccessEmployee(req, employeeId);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'Managers can only assign assets to their direct reports',
      });
    }

    const assignment = new AssetAssignment({
      asset: assetId,
      employee: employeeId,
      assignedDate: assignedDate || new Date(),
      expectedReturnDate,
      notes,
      assignedBy: req.user.employee?._id,
    });

    await assignment.save();

    asset.status = 'assigned';
    await asset.save();

    await assignment.populate('employee', 'firstName lastName employeeId');
    await assignment.populate('assignedBy', 'firstName lastName employeeId');
    await assignment.populate('asset', 'name serialNumber category');

    return res.status(201).json({
      success: true,
      message: 'Asset assigned successfully',
      assignment,
    });
  } catch (error) {
    console.error('Assign asset error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to assign asset',
      error: error.message,
    });
  }
});

// Return asset (CEO/Manager)
router.post('/:id/return', authMiddleware, requireRole(['ceo', 'manager']), async (req, res) => {
  try {
    const { condition, notes } = req.body;

    const assignment = await AssetAssignment.findOne({
      asset: req.params.id,
      assignmentStatus: 'active',
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Active assignment not found',
      });
    }

    const allowed = await ensureManagerCanAccessEmployee(req, assignment.employee.toString());
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'Managers can only return assets assigned to their direct reports',
      });
    }

    assignment.assignmentStatus = 'returned';
    assignment.actualReturnDate = new Date();
    assignment.notes = notes || assignment.notes;
    await assignment.save();

    const asset = await Asset.findById(req.params.id);
    asset.status = 'available';
    if (condition) asset.condition = condition;
    await asset.save();

    return res.json({
      success: true,
      message: 'Asset returned successfully',
      assignment,
    });
  } catch (error) {
    console.error('Return asset error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to return asset',
      error: error.message,
    });
  }
});

export default router;
