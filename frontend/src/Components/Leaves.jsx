import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { leavesAPI } from "../services/api";
import "../styles/Leaves.css";

const Leaves = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: "vacation",
    start_date: "",
    end_date: "",
    reason: "",
  });

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const response = await leavesAPI.getLeaves();
      if (response.data.success) {
        setLeaves(response.data.leaves || []);
      }
    } catch (error) {
      console.error("Failed to fetch leaves:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      const response = await leavesAPI.apply({
        ...formData,
        employee_id: user.employeeId,
      });

      if (response.data.success) {
        setShowApplyForm(false);
        setFormData({
          leave_type: "vacation",
          start_date: "",
          end_date: "",
          reason: "",
        });
        fetchLeaves();
        alert("Leave application submitted successfully!");
      }
    } catch (error) {
      console.error("Failed to apply for leave:", error);
      alert("Failed to apply for leave. Please try again.");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "#f39c12",
      approved: "#27ae60",
      rejected: "#e74c3c",
      cancelled: "#95a5a6",
    };
    return colors[status] || "#95a5a6";
  };

  const getLeaveTypeIcon = (type) => {
    const icons = {
      vacation: "🏖️",
      sick: "🤒",
      personal: "👤",
      maternity: "🤰",
      paternity: "👨",
      wfh: "🏠",
    };
    return icons[type] || "📋";
  };

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  };

  const leaveTypes = [
    { value: "vacation", label: "Vacation Leave", icon: "🏖️" },
    { value: "sick", label: "Sick Leave", icon: "🤒" },
    { value: "personal", label: "Personal Leave", icon: "👤" },
    { value: "maternity", label: "Maternity Leave", icon: "🤰" },
    { value: "paternity", label: "Paternity Leave", icon: "👨" },
    { value: "wfh", label: "Work From Home", icon: "🏠" },
  ];

  return (
    <div className="leaves">
      <div className="page-header">
        <h1>Leave Management</h1>
        <p>Manage leave requests and approvals</p>
      </div>

      {/* Quick Stats */}
      <div className="leave-stats">
        <div className="stat-card">
          <div className="stat-icon pending">⏳</div>
          <div className="stat-info">
            <h4>3</h4>
            <p>Pending</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon approved">✅</div>
          <div className="stat-info">
            <h4>12</h4>
            <p>Approved</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon remaining">📅</div>
          <div className="stat-info">
            <h4>18</h4>
            <p>Days Left</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon used">🏖️</div>
          <div className="stat-info">
            <h4>7</h4>
            <p>Days Used</p>
          </div>
        </div>
      </div>

      {/* Apply Leave Button */}
      <div className="action-section">
        <button
          className="btn-primary apply-btn"
          onClick={() => setShowApplyForm(true)}
        >
          📝 Apply for Leave
        </button>
      </div>

      {/* Apply Leave Form Modal */}
      {showApplyForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Apply for Leave</h2>
              <button
                className="close-btn"
                onClick={() => setShowApplyForm(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="leave-form">
              <div className="form-group">
                <label>Leave Type</label>
                <select
                  value={formData.leave_type}
                  onChange={(e) =>
                    setFormData({ ...formData, leave_type: e.target.value })
                  }
                  required
                >
                  {leaveTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {formData.start_date && formData.end_date && (
                <div className="days-calculator">
                  <strong>
                    Total Days:{" "}
                    {calculateDays(formData.start_date, formData.end_date)}
                  </strong>
                </div>
              )}

              <div className="form-group">
                <label>Reason</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="Please provide a reason for your leave..."
                  rows="4"
                  required
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setShowApplyForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave History */}
      <div className="leave-history">
        <h2>Leave History</h2>

        {loading ? (
          <div className="loading">Loading leave history...</div>
        ) : (
          <div className="leaves-list">
            {leaves.map((leave) => (
              <div key={leave.id} className="leave-card">
                <div className="leave-header">
                  <div className="leave-type">
                    <span className="type-icon">
                      {getLeaveTypeIcon(leave.leave_type)}
                    </span>
                    <div>
                      <h4>
                        {leave.leave_type?.charAt(0).toUpperCase() +
                          leave.leave_type?.slice(1)}{" "}
                        Leave
                      </h4>
                      <p>
                        {new Date(leave.start_date).toLocaleDateString()} -{" "}
                        {new Date(leave.end_date).toLocaleDateString()}(
                        {calculateDays(leave.start_date, leave.end_date)} days)
                      </p>
                    </div>
                  </div>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(leave.status) }}
                  >
                    {leave.status?.charAt(0).toUpperCase() +
                      leave.status?.slice(1)}
                  </span>
                </div>

                <div className="leave-details">
                  <p>
                    <strong>Reason:</strong> {leave.reason}
                  </p>
                  <p>
                    <strong>Applied On:</strong>{" "}
                    {new Date(leave.created_at).toLocaleDateString()}
                  </p>

                  {leave.approved_by && (
                    <p>
                      <strong>Approved By:</strong> {leave.approver_name}
                    </p>
                  )}

                  {leave.comments && (
                    <p>
                      <strong>Comments:</strong> {leave.comments}
                    </p>
                  )}
                </div>

                {leave.status === "pending" && (
                  <div className="leave-actions">
                    <button className="btn-outline btn-sm">Cancel</button>
                  </div>
                )}
              </div>
            ))}

            {leaves.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>No leave applications found</h3>
                <p>You haven't applied for any leaves yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* For Managers/HR: Pending Approvals */}
      {(user?.role === "manager" ||
        user?.role === "hr" ||
        user?.role === "admin") && (
        <div className="pending-approvals">
          <h2>Pending Approvals</h2>
          <div className="approvals-list">
            <div className="approval-card">
              <div className="approval-header">
                <div className="employee-info">
                  <div className="avatar-sm">JD</div>
                  <div>
                    <h4>John Doe</h4>
                    <p>Software Developer • IT Department</p>
                  </div>
                </div>
                <span className="leave-type-badge vacation">🏖️ Vacation</span>
              </div>

              <div className="approval-details">
                <p>
                  <strong>Duration:</strong> Dec 15, 2024 - Dec 20, 2024 (6
                  days)
                </p>
                <p>
                  <strong>Reason:</strong> Family vacation and year-end break
                </p>
                <p>
                  <strong>Applied On:</strong> Dec 1, 2024
                </p>
              </div>

              <div className="approval-actions">
                <button className="btn-success btn-sm">Approve</button>
                <button className="btn-danger btn-sm">Reject</button>
                <button className="btn-outline btn-sm">View Details</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;
