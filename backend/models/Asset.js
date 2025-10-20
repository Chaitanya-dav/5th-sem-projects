import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Asset name is required'],
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['laptop', 'phone', 'monitor', 'tablet', 'accessory', 'furniture', 'equipment', 'other']
  },
  serialNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  model: String,
  brand: String,
  purchaseDate: {
    type: Date
  },
  warrantyExpiry: {
    type: Date
  },
  cost: {
    type: Number,
    min: 0
  },
  status: {
    type: String,
    enum: ['available', 'assigned', 'maintenance', 'retired', 'lost'],
    default: 'available'
  },
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  location: String,
  notes: {
    type: String,
    trim: true
  },
  specifications: {
    type: Map,
    of: String
  },
  purchaseInfo: {
    vendor: String,
    invoiceNumber: String,
    purchaseOrder: String
  }
}, {
  timestamps: true
});

const assetAssignmentSchema = new mongoose.Schema({
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  assignedDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expectedReturnDate: Date,
  actualReturnDate: Date,
  assignmentStatus: {
    type: String,
    enum: ['active', 'returned', 'lost', 'damaged'],
    default: 'active'
  },
  notes: String,
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  }
}, {
  timestamps: true
});

export const Asset = mongoose.model('Asset', assetSchema);
export const AssetAssignment = mongoose.model('AssetAssignment', assetAssignmentSchema);