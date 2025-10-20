import express from 'express';
import { Asset, AssetAssignment } from '../models/Asset.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all assets
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, category } = req.query;
    
    let filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const assets = await Asset.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      assets
    });
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assets'
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
        message: 'Asset not found'
      });
    }

    // Get assignment history
    const assignments = await AssetAssignment.find({ asset: req.params.id })
      .populate('employee', 'firstName lastName employeeId department')
      .populate('assignedBy', 'firstName lastName')
      .sort({ assignedDate: -1 });

    res.json({
      success: true,
      asset: {
        ...asset.toObject(),
        assignments
      }
    });
  } catch (error) {
    console.error('Get asset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch asset'
    });
  }
});

// Assign asset (IT/Admin only)
router.post('/assign', authMiddleware, requireRole(['admin', 'it']), async (req, res) => {
  try {
    const { assetId, employeeId, assignedDate, expectedReturnDate, notes } = req.body;

    // Check if asset exists and is available
    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    if (asset.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Asset is not available for assignment'
      });
    }

    // Create assignment
    const assignment = new AssetAssignment({
      asset: assetId,
      employee: employeeId,
      assignedDate: assignedDate || new Date(),
      expectedReturnDate,
      notes,
      assignedBy: req.user.employee?._id
    });

    await assignment.save();

    // Update asset status
    asset.status = 'assigned';
    await asset.save();

    await assignment.populate('employee', 'firstName lastName employeeId');
    await assignment.populate('assignedBy', 'firstName lastName');
    await assignment.populate('asset', 'name serialNumber category');

    res.status(201).json({
      success: true,
      message: 'Asset assigned successfully',
      assignment
    });
  } catch (error) {
    console.error('Assign asset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign asset'
    });
  }
});

// Return asset (IT/Admin only)
router.post('/:id/return', authMiddleware, requireRole(['admin', 'it']), async (req, res) => {
  try {
    const { condition, notes } = req.body;

    const assignment = await AssetAssignment.findOne({
      asset: req.params.id,
      assignmentStatus: 'active'
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Active assignment not found'
      });
    }

    assignment.assignmentStatus = 'returned';
    assignment.actualReturnDate = new Date();
    assignment.notes = notes || assignment.notes;
    await assignment.save();

    // Update asset status and condition
    const asset = await Asset.findById(req.params.id);
    asset.status = 'available';
    if (condition) asset.condition = condition;
    await asset.save();

    res.json({
      success: true,
      message: 'Asset returned successfully',
      assignment
    });
  } catch (error) {
    console.error('Return asset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to return asset'
    });
  }
});

// Get my assigned assets
router.get('/my-assets', authMiddleware, async (req, res) => {
  try {
    const assignments = await AssetAssignment.find({
      employee: req.user.employee?._id,
      assignmentStatus: 'active'
    })
      .populate('asset')
      .sort({ assignedDate: -1 });

    res.json({
      success: true,
      assignments
    });
  } catch (error) {
    console.error('Get my assets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned assets'
    });
  }
});

export default router;