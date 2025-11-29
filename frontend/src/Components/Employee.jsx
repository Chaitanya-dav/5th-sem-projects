import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { employeesAPI } from "../services/api";
import "../styles/Employees.css";

const Employees = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchEmployees();
  }, [currentPage, departmentFilter, statusFilter, searchTerm]);

  // Reset page on filter change to avoid empty pages
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, departmentFilter, statusFilter]);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        ...(departmentFilter && { department: departmentFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      };

      const response = await employeesAPI.getAll(params);
      if (response.data.success) {
        setEmployees(response.data.employees);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, departmentFilter, statusFilter, searchTerm]);

  const handleViewDetails = (employee) => {
    setSelectedEmployee(employee);
    setShowModal(true);
  };

  // Stub for edit functionality (replace with real logic, e.g., navigation or modal)
  const handleEdit = (employee) => {
    console.log("Edit employee:", employee);
    // Example: navigate(`/employees/edit/${employee.id}`);
  };

  const departments = [
    "Human Resources",
    "Information Technology",
    "Finance",
    "Marketing",
    "Operations",
  ];
  const statuses = ["active", "on_leave", "terminated", "resigned"];

  return (
    <div className="employees">
      <div className="page-header">
        <h1>Employee Management</h1>
        <p>Manage your organization's workforce</p>
      </div>

      <div className="controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filters">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() +
                  status.slice(1).replace("_", " ")}
              </option>
            ))}
          </select>

          <button className="btn-primary" onClick={fetchEmployees}>
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading employees...</div>
      ) : (
        <>
          <div className="employees-grid">
            {employees.map((employee) => (
              <div key={employee.id} className="employee-card">
                <div className="employee-header">
                  <div className="employee-avatar">
                    {employee.first_name?.[0]} {employee.last_name?.[0]}
                  </div>
                  <div className="employee-basic-info">
                    <h3>
                      {employee.first_name} {employee.last_name}
                    </h3>
                    <p>{employee.job_title}</p>
                  </div>
                  <span className={`status-badge status-${employee.status}`}>
                    {employee.status?.replace("_", " ")}
                  </span>
                </div>

                <div className="employee-details">
                  <div className="detail-item">
                    <span className="label">Employee ID:</span>
                    <span className="value">{employee.employee_id}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Department:</span>
                    <span className="value">
                      {employee.department?.name || employee.department || "N/A"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Email:</span>
                    <span className="value">{employee.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Phone:</span>
                    <span className="value">{employee.phone || "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Hire Date:</span>
                    <span className="value">
                      {employee.hire_date
                        ? new Date(employee.hire_date).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </div>

                <div className="employee-actions">
                  <button
                    className="btn-outline"
                    onClick={() => handleViewDetails(employee)}
                  >
                    View Details
                  </button>
                  {user?.role === "admin" || user?.role === "hr" ? (
                    <button className="btn-primary" onClick={() => handleEdit(employee)}>
                      Edit
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {employees.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>No employees found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </button>

              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Employee Details Modal */}
      {showModal && selectedEmployee && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Employee Details</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="employee-profile">
                <div className="profile-header">
                  <div className="profile-avatar">
                    {selectedEmployee.first_name?.[0]} {selectedEmployee.last_name?.[0]}
                  </div>
                  <div className="profile-info">
                    <h3>
                      {selectedEmployee.first_name} {selectedEmployee.last_name}
                    </h3>
                    <p>
                      {selectedEmployee.job_title} •{" "}
                      {selectedEmployee.department?.name || selectedEmployee.department}
                    </p>
                    <span
                      className={`status-badge status-${selectedEmployee.status}`}
                    >
                      {selectedEmployee.status?.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="profile-details">
                  <div className="detail-section">
                    <h4>Personal Information</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="label">Employee ID:</span>
                        <span className="value">
                          {selectedEmployee.employee_id}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Email:</span>
                        <span className="value">{selectedEmployee.email}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Phone:</span>
                        <span className="value">
                          {selectedEmployee.phone || "N/A"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Date of Birth:</span>
                        <span className="value">
                          {selectedEmployee.date_of_birth
                            ? new Date(
                                selectedEmployee.date_of_birth
                              ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Employment Information</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="label">Hire Date:</span>
                        <span className="value">
                          {selectedEmployee.hire_date
                            ? new Date(
                                selectedEmployee.hire_date
                              ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Employment Type:</span>
                        <span className="value">
                          {selectedEmployee.employment_type?.replace(
                            "_",
                            " "
                          ) || "N/A"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Salary:</span>
                        <span className="value">
                          {selectedEmployee.salary
                            ? `$${selectedEmployee.salary.toLocaleString()}`
                            : "N/A"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Manager:</span>
                        <span className="value">
                          {selectedEmployee.manager?.name ||
                           (selectedEmployee.manager_first_name
                             ? `${selectedEmployee.manager_first_name} ${selectedEmployee.manager_last_name}`
                             : "N/A")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedEmployee.address && (
                    <div className="detail-section">
                      <h4>Address</h4>
                      <p>{selectedEmployee.address}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-outline"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
              {(user?.role === "admin" || user?.role === "hr") && (
                <button className="btn-primary" onClick={() => handleEdit(selectedEmployee)}>
                  Edit Employee
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
