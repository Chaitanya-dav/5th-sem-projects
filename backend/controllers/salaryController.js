import Salary from '../models/Salary.js';
import Employee from '../models/Employee.js';

// Get all salary records (Admin/HR)
export const getAllSalaries = async (req, res) => {
    try {
        const salaries = await Salary.find()
            .populate('employee', 'firstName lastName employeeId department')
            .populate('processedBy', 'firstName lastName')
            .sort({ payDate: -1 });
        res.json({ success: true, salaries });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get current user's salary history
export const getMySalaries = async (req, res) => {
    try {
        // Find employee associated with current user
        const employee = await Employee.findOne({ user: req.user.id });
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee profile not found' });
        }

        const salaries = await Salary.find({ employee: employee._id })
            .sort({ payDate: -1 });
        res.json({ success: true, salaries });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Process a salary payment (Admin/HR)
export const processSalary = async (req, res) => {
    try {
        const { employeeId, amount, allowances, deductions, payPeriod } = req.body;

        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        const netSalary = Number(amount) + Number(allowances || 0) - Number(deductions || 0);

        const newSalary = new Salary({
            employee: employeeId,
            amount,
            allowances,
            deductions,
            netSalary,
            payPeriod,
            status: 'paid',
            processedBy: req.user.id
        });

        await newSalary.save();
        await newSalary.populate('employee', 'firstName lastName');

        res.status(201).json({ success: true, salary: newSalary });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
