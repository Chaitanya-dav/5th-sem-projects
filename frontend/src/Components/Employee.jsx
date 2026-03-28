import React, { useEffect, useState } from 'react';
import { employeesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/Employees.css';

const defaultCreateForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  jobTitle: '',
  department: '',
  role: 'employee',
  password: 'welcome@123',
};

const Employees = () => {
  const { user } = useAuth();
  const canManage = user?.role === 'ceo' || user?.role === 'manager';
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState(defaultCreateForm);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeesAPI.getAll({
        page: 1,
        limit: 200,
        ...(searchTerm ? { search: searchTerm } : {}),
      });
      if (response.data.success) {
        setEmployees(response.data.employees || []);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [searchTerm]);

  const handleCreateEmployee = async (event) => {
    event.preventDefault();
    try {
      const payload =
        user?.role === 'manager'
          ? { ...formData, role: 'employee' }
          : formData;

      const response = await employeesAPI.create(payload);
      if (response.data.success) {
        setShowCreateModal(false);
        setFormData(defaultCreateForm);
        fetchEmployees();
      }
    } catch (error) {
      console.error('Failed to create employee:', error);
      alert(error.response?.data?.message || 'Failed to create employee');
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    const confirmed = window.confirm('Do you want to remove this employee account?');
    if (!confirmed) return;

    try {
      await employeesAPI.remove(employeeId);
      fetchEmployees();
    } catch (error) {
      console.error('Failed to remove employee:', error);
      alert(error.response?.data?.message || 'Failed to remove employee');
    }
  };

  return (
    <div className="employees">
      <div className="page-header">
        <h1>Employees</h1>
        <p>
          {user?.role === 'ceo'
            ? 'Organization-wide employee management.'
            : user?.role === 'manager'
            ? 'Add or remove employee accounts and manage team records.'
            : 'View your employee profile.'}
        </p>
      </div>

      <div className="controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="filters">
          <button className="btn-primary" onClick={fetchEmployees}>
            Refresh
          </button>
          {canManage && (
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              Add Employee
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading employees...</div>
      ) : (
        <>
          <div className="employees-grid">
            {employees.map((employee) => (
              <div key={employee._id} className="employee-card">
                <div className="employee-header">
                  <div className="employee-avatar">
                    {(employee.firstName?.[0] || '').toUpperCase()}
                    {(employee.lastName?.[0] || '').toUpperCase()}
                  </div>
                  <div className="employee-basic-info">
                    <h3>
                      {employee.firstName} {employee.lastName}
                    </h3>
                    <p>{employee.jobTitle}</p>
                    <p>Role: {employee.user?.role || 'employee'}</p>
                  </div>
                  <span className={`status-badge status-${employee.status}`}>{employee.status}</span>
                </div>

                <div className="employee-details">
                  <div className="detail-item">
                    <span className="label">Employee ID:</span>
                    <span className="value">{employee.employeeId}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Department:</span>
                    <span className="value">{employee.department?.name || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Email:</span>
                    <span className="value">{employee.email}</span>
                  </div>
                </div>
                {(user?.role === 'ceo' || user?.role === 'manager') &&
                  employee.user?.role === 'employee' && (
                  <div className="employee-actions">
                    <button
                      className="btn-danger"
                      onClick={() => handleDeleteEmployee(employee._id)}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {employees.length === 0 && (
            <div className="empty-state">
              <h3>No employees found</h3>
            </div>
          )}
        </>
      )}

      {showCreateModal && canManage && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add Employee</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                X
              </button>
            </div>
            <form onSubmit={handleCreateEmployee} className="leave-form">
              <div className="form-row">
                <input
                  type="text"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, firstName: event.target.value }))
                  }
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, lastName: event.target.value }))
                  }
                  required
                />
              </div>
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
                />
                <input
                  type="text"
                  placeholder="Department"
                  value={formData.department}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, department: event.target.value }))
                  }
                />
              </div>
              <input
                type="text"
                placeholder="Job Title"
                value={formData.jobTitle}
                onChange={(event) => setFormData((prev) => ({ ...prev, jobTitle: event.target.value }))}
              />
              {user?.role === 'ceo' && (
                <select
                  value={formData.role}
                  onChange={(event) => setFormData((prev) => ({ ...prev, role: event.target.value }))}
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="ceo">CEO</option>
                </select>
              )}
              <input
                type="password"
                placeholder="Temporary Password"
                value={formData.password}
                onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
                minLength={6}
                required
              />
              <div className="form-actions">
                <button type="button" className="btn-outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
