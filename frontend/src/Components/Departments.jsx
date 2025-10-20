import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "./Departments.css";

const Departments = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Mock data - in real app, fetch from API
    const mockDepartments = [
      {
        id: 1,
        name: "Human Resources",
        description:
          "Handles recruitment, employee relations, and HR operations",
        manager: "Sarah Johnson",
        employee_count: 15,
        teams: ["Recruitment", "Employee Relations", "Training & Development"],
      },
      {
        id: 2,
        name: "Information Technology",
        description: "Manages technology infrastructure and support",
        manager: "Mike Chen",
        employee_count: 25,
        teams: [
          "Software Development",
          "IT Support",
          "Infrastructure",
          "Security",
        ],
      },
      {
        id: 3,
        name: "Finance",
        description: "Handles financial operations and accounting",
        manager: "David Wilson",
        employee_count: 12,
        teams: ["Accounting", "Financial Planning", "Payroll", "Audit"],
      },
      {
        id: 4,
        name: "Marketing",
        description: "Responsible for marketing and brand management",
        manager: "Emily Davis",
        employee_count: 18,
        teams: [
          "Digital Marketing",
          "Content Creation",
          "Brand Management",
          "Social Media",
        ],
      },
      {
        id: 5,
        name: "Operations",
        description: "Manages daily business operations",
        manager: "Robert Brown",
        employee_count: 22,
        teams: [
          "Logistics",
          "Quality Assurance",
          "Process Improvement",
          "Facilities",
        ],
      },
      {
        id: 6,
        name: "Sales",
        description: "Handles customer acquisition and revenue generation",
        manager: "Jennifer Lee",
        employee_count: 30,
        teams: [
          "Enterprise Sales",
          "SMB Sales",
          "Account Management",
          "Sales Operations",
        ],
      },
    ];

    setDepartments(mockDepartments);
    setLoading(false);
  }, []);

  const handleViewDetails = (department) => {
    setSelectedDepartment(department);
    setShowModal(true);
  };

  const getDepartmentIcon = (deptName) => {
    const icons = {
      "Human Resources": "👥",
      "Information Technology": "💻",
      Finance: "💰",
      Marketing: "📢",
      Operations: "⚙️",
      Sales: "📈",
    };
    return icons[deptName] || "🏢";
  };

  return (
    <div className="departments">
      <div className="page-header">
        <h1>Department Management</h1>
        <p>Organize and manage company departments</p>
      </div>

      {/* Department Statistics */}
      <div className="dept-stats">
        <div className="stat-card">
          <div className="stat-icon total">🏢</div>
          <div className="stat-info">
            <h4>{departments.length}</h4>
            <p>Total Departments</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon employees">👥</div>
          <div className="stat-info">
            <h4>122</h4>
            <p>Total Employees</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon teams">👨‍👩‍👧‍👦</div>
          <div className="stat-info">
            <h4>24</h4>
            <p>Teams</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon growth">📈</div>
          <div className="stat-info">
            <h4>+8%</h4>
            <p>Growth Rate</p>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      {(user?.role === "admin" || user?.role === "hr") && (
        <div className="action-bar">
          <button className="btn-primary">+ Add New Department</button>
        </div>
      )}

      {/* Departments Grid */}
      {loading ? (
        <div className="loading">Loading departments...</div>
      ) : (
        <div className="departments-grid">
          {departments.map((dept) => (
            <div key={dept.id} className="department-card">
              <div className="dept-header">
                <div className="dept-icon">{getDepartmentIcon(dept.name)}</div>
                <div className="dept-basic-info">
                  <h3>{dept.name}</h3>
                  <p>{dept.employee_count} employees</p>
                </div>
              </div>

              <div className="dept-description">
                <p>{dept.description}</p>
              </div>

              <div className="dept-details">
                <div className="detail-item">
                  <span className="label">Manager:</span>
                  <span className="value">{dept.manager}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Teams:</span>
                  <span className="value">{dept.teams.length} teams</span>
                </div>
              </div>

              <div className="teams-preview">
                <div className="teams-tags">
                  {dept.teams.slice(0, 3).map((team, index) => (
                    <span key={index} className="team-tag">
                      {team}
                    </span>
                  ))}
                  {dept.teams.length > 3 && (
                    <span className="team-tag more">
                      +{dept.teams.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="dept-actions">
                <button
                  className="btn-outline"
                  onClick={() => handleViewDetails(dept)}
                >
                  View Details
                </button>
                {(user?.role === "admin" || user?.role === "hr") && (
                  <button className="btn-primary">Manage</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Department Details Modal */}
      {showModal && selectedDepartment && (
        <div className="modal-overlay">
          <div className="modal large-modal">
            <div className="modal-header">
              <h2>{selectedDepartment.name}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="dept-profile">
                <div className="profile-header">
                  <div className="dept-icon-large">
                    {getDepartmentIcon(selectedDepartment.name)}
                  </div>
                  <div className="profile-info">
                    <h3>{selectedDepartment.name}</h3>
                    <p>{selectedDepartment.description}</p>
                    <div className="dept-stats-small">
                      <span className="stat">
                        <strong>{selectedDepartment.employee_count}</strong>{" "}
                        Employees
                      </span>
                      <span className="stat">
                        <strong>{selectedDepartment.teams.length}</strong> Teams
                      </span>
                    </div>
                  </div>
                </div>

                <div className="dept-details-grid">
                  <div className="detail-section">
                    <h4>Department Information</h4>
                    <div className="detail-list">
                      <div className="detail-item">
                        <span className="label">Department Manager:</span>
                        <span className="value">
                          {selectedDepartment.manager}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Total Employees:</span>
                        <span className="value">
                          {selectedDepartment.employee_count}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Teams:</span>
                        <span className="value">
                          {selectedDepartment.teams.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Teams</h4>
                    <div className="teams-list">
                      {selectedDepartment.teams.map((team, index) => (
                        <div key={index} className="team-item">
                          <span className="team-icon">👨‍👩‍👧‍👦</span>
                          <span className="team-name">{team}</span>
                          <span className="team-size">12 members</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="detail-section">
                  <h4>Recent Activity</h4>
                  <div className="activity-list">
                    <div className="activity-item">
                      <div className="activity-icon">➕</div>
                      <div className="activity-content">
                        <p>
                          <strong>2 new employees</strong> joined the department
                        </p>
                        <span className="activity-time">2 days ago</span>
                      </div>
                    </div>
                    <div className="activity-item">
                      <div className="activity-icon">🔄</div>
                      <div className="activity-content">
                        <p>
                          <strong>Team restructuring</strong> completed
                        </p>
                        <span className="activity-time">1 week ago</span>
                      </div>
                    </div>
                    <div className="activity-item">
                      <div className="activity-icon">📊</div>
                      <div className="activity-content">
                        <p>
                          <strong>Quarterly review</strong> meeting conducted
                        </p>
                        <span className="activity-time">2 weeks ago</span>
                      </div>
                    </div>
                  </div>
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
                <button className="btn-primary">Edit Department</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
