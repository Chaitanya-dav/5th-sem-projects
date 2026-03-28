import mongoose from 'mongoose';

const salarySchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    allowances: {
        type: Number,
        default: 0
    },
    deductions: {
        type: Number,
        default: 0
    },
    netSalary: {
        type: Number,
        required: true
    },
    payDate: {
        type: Date,
        default: Date.now
    },
    payPeriod: {
        month: {
            type: String, // e.g., "October"
            required: true
        },
        year: {
            type: Number, // e.g., 2023
            required: true
        }
    },
    status: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'pending'
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

export default mongoose.model('Salary', salarySchema);
