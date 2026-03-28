import React, { useState, useEffect } from "react";
import { salaryAPI, employeesAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../styles/Dashboard.css"; // Reuse dashboard styles

const Salary = () => {
    const { user } = useAuth();
    const isAdminOrHR = user?.role === "ceo" || user?.role === "manager";

    const [salaries, setSalaries] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showProcessModal, setShowProcessModal] = useState(false);

    // Form data for processing payroll
    const [formData, setFormData] = useState({
        employeeId: "",
        amount: "",
        allowances: 0,
        deductions: 0,
        payPeriod: {
            month: new Date().toLocaleString('default', { month: 'long' }),
            year: new Date().getFullYear()
        }
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            // If admin/hr, fetch all salaries. If employee, fetch own history.
            const response = isAdminOrHR
                ? await salaryAPI.getAll()
                : await salaryAPI.getMyHistory();

            if (response.data.success) {
                setSalaries(response.data.salaries);
            }

            if (isAdminOrHR) {
                const empResponse = await employeesAPI.getAll();
                if (empResponse.data.success) {
                    setEmployees(empResponse.data.employees);
                }
            }
        } catch (error) {
            console.error("Failed to fetch salary data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleProcessPayroll = async (e) => {
        e.preventDefault();
        try {
            const response = await salaryAPI.process(formData);
            if (response.data.success) {
                alert("Payroll processed successfully!");
                setShowProcessModal(false);
                setFormData({
                    employeeId: "",
                    amount: "",
                    allowances: 0,
                    deductions: 0,
                    payPeriod: {
                        month: new Date().toLocaleString('default', { month: 'long' }),
                        year: new Date().getFullYear()
                    }
                });
                fetchData();
            }
        } catch (error) {
            console.error("Payroll processing failed:", error);
            alert("Failed to process payroll");
        }
    };

    if (loading) return <div className="loading">Loading payroll data...</div>;

    return (
        <div className="dashboard-content">
            <div className="header-actions">
                <h1>{isAdminOrHR ? "Payroll Management" : "My Payslips"}</h1>
                {isAdminOrHR && (
                    <button className="btn-primary" onClick={() => setShowProcessModal(true)}>
                        Process Payroll
                    </button>
                )}
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            {isAdminOrHR && <th>Employee</th>}
                            <th>Pay Period</th>
                            <th>Pay Date</th>
                            <th>Amount</th>
                            <th>Allowances</th>
                            <th>Deductions</th>
                            <th>Net Salary</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {salaries.map((salary) => (
                            <tr key={salary._id}>
                                {isAdminOrHR && (
                                    <td>
                                        {salary.employee?.firstName} {salary.employee?.lastName}
                                        <br />
                                        <small className="text-muted">{salary.employee?.employeeId}</small>
                                    </td>
                                )}
                                <td>{salary.payPeriod.month} {salary.payPeriod.year}</td>
                                <td>{new Date(salary.payDate).toLocaleDateString()}</td>
                                <td>${salary.amount.toLocaleString()}</td>
                                <td className="text-success">+${salary.allowances.toLocaleString()}</td>
                                <td className="text-danger">-${salary.deductions.toLocaleString()}</td>
                                <td style={{ fontWeight: 'bold' }}>${salary.netSalary.toLocaleString()}</td>
                                <td>
                                    <span className={`status-badge status-${salary.status === 'paid' ? 'approved' : 'pending'}`}>
                                        {salary.status.toUpperCase()}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {salaries.length === 0 && (
                            <tr>
                                <td colSpan={isAdminOrHR ? 8 : 7} style={{ textAlign: 'center', padding: '2rem' }}>
                                    No payroll records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Process Payroll Modal */}
            {showProcessModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Process Payroll</h2>
                        <form onSubmit={handleProcessPayroll}>
                            <div className="form-group">
                                <label>Employee</label>
                                <select
                                    value={formData.employeeId}
                                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                    required
                                >
                                    <option value="">Select Employee</option>
                                    {employees.map(emp => (
                                        <option key={emp._id} value={emp._id}>
                                            {emp.firstName} {emp.lastName} ({emp.employeeId})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Base Salary</label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Allowances</label>
                                    <input
                                        type="number"
                                        value={formData.allowances}
                                        onChange={(e) => setFormData({ ...formData, allowances: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Deductions</label>
                                    <input
                                        type="number"
                                        value={formData.deductions}
                                        onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Month</label>
                                    <select
                                        value={formData.payPeriod.month}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            payPeriod: { ...formData.payPeriod, month: e.target.value }
                                        })}
                                    >
                                        {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Year</label>
                                    <input
                                        type="number"
                                        value={formData.payPeriod.year}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            payPeriod: { ...formData.payPeriod, year: e.target.value }
                                        })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Net Salary Calculation</label>
                                <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '5px', textAlign: 'center', fontWeight: 'bold' }}>
                                    ${(Number(formData.amount) + Number(formData.allowances) - Number(formData.deductions)).toLocaleString()}
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowProcessModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Process Payment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Salary;
