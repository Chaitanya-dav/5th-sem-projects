import React, { useEffect, useMemo, useState } from 'react';
import { leavesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/Leaves.css';

const defaultForm = {
  leaveType: 'vacation',
  startDate: '',
  endDate: '',
  reason: '',
  emergencyContact: '',
};

const Leaves = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [formData, setFormData] = useState(defaultForm);

  const canApprove = user?.role === 'manager' || user?.role === 'ceo';
  const pendingApprovals = useMemo(
    () =>
      leaves.filter(
        (leave) => leave.status === 'pending' && leave.employee?._id !== user?.employee?._id
      ),
    [leaves, user?.employee?._id]
  );
  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  );

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const requests = [
        leavesAPI.getLeaves(),
        leavesAPI.getStats(),
      ];
      if (user?.role === 'employee') {
        requests.push(leavesAPI.getNotifications());
      }

      const [leaveResponse, statsResponse, notificationsResponse] = await Promise.all(requests);

      if (leaveResponse.data.success) {
        setLeaves(leaveResponse.data.leaves || []);
      }
      if (statsResponse.data.success) {
        setStats(statsResponse.data.stats || {});
      }
      if (notificationsResponse?.data?.success) {
        setNotifications(notificationsResponse.data.notifications || []);
      } else if (user?.role !== 'employee') {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleApplyLeave = async (event) => {
    event.preventDefault();
    try {
      const response = await leavesAPI.apply(formData);
      if (response.data.success) {
        setShowApplyForm(false);
        setFormData(defaultForm);
        fetchLeaves();
      }
    } catch (error) {
      console.error('Failed to apply leave:', error);
      alert('Failed to apply leave');
    }
  };

  const handleApproval = async (leaveId, status) => {
    try {
      await leavesAPI.updateStatus(leaveId, { status });
      fetchLeaves();
    } catch (error) {
      console.error('Failed to update leave status:', error);
      alert('Failed to update leave status');
    }
  };

  const handleNotificationRead = async (notificationId) => {
    try {
      await leavesAPI.markNotificationRead(notificationId);
      fetchLeaves();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleDeleteRejectedLeave = async (leaveId) => {
    const confirmed = window.confirm(
      'Do you want to delete this rejected leave request? You can also keep it in history.'
    );
    if (!confirmed) return;

    try {
      await leavesAPI.deleteLeave(leaveId);
      fetchLeaves();
    } catch (error) {
      console.error('Failed to delete rejected leave:', error);
      alert(error.response?.data?.message || 'Failed to delete leave request');
    }
  };

  return (
    <div className="leaves">
      <div className="page-header">
        <h1>Leave Management</h1>
        <p>
          {canApprove
            ? 'Review leave requests based on your authority and submit your own leave.'
            : 'Submit and monitor your own leave requests.'}
        </p>
      </div>

      <div className="leave-stats">
        <div className="stat-card">
          <div className="stat-info">
            <h4>{stats.totalLeaves || 0}</h4>
            <p>Total Leaves</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h4>{stats.pendingLeaves || 0}</h4>
            <p>Pending</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h4>{stats.approvedLeaves || 0}</h4>
            <p>Approved</p>
          </div>
        </div>
      </div>

      <div className="action-section">
        <button className="btn-primary apply-btn" onClick={() => setShowApplyForm(true)}>
          Apply for Leave
        </button>
      </div>

      {user?.role === 'employee' && notifications.length > 0 && (
        <div className="pending-approvals">
          <h2>Notifications ({unreadNotifications} unread)</h2>
          <div className="approvals-list">
            {notifications.map((notification) => (
              <div key={notification._id} className="approval-card">
                <div className="approval-details">
                  <p>
                    <strong>{notification.title}</strong>
                  </p>
                  <p>{notification.message}</p>
                  <p>
                    <strong>Time:</strong> {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="approval-actions">
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => handleNotificationRead(notification._id)}
                    >
                      Mark as Read
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showApplyForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Apply for Leave</h2>
              <button className="close-btn" onClick={() => setShowApplyForm(false)}>
                X
              </button>
            </div>
            <form onSubmit={handleApplyLeave} className="leave-form">
              <div className="form-group">
                <label>Leave Type</label>
                <select
                  value={formData.leaveType}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, leaveType: event.target.value }))
                  }
                >
                  <option value="vacation">Vacation</option>
                  <option value="sick">Sick</option>
                  <option value="personal">Personal</option>
                  <option value="maternity">Maternity</option>
                  <option value="paternity">Paternity</option>
                  <option value="wfh">Work From Home</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, startDate: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, endDate: event.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Reason</label>
                <textarea
                  rows={3}
                  value={formData.reason}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, reason: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Emergency Contact</label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, emergencyContact: event.target.value }))
                  }
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-outline" onClick={() => setShowApplyForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="leave-history">
        <h2>Leave Requests</h2>
        {loading ? (
          <div className="loading">Loading leave requests...</div>
        ) : (
          <div className="leaves-list">
            {leaves.map((leave) => (
              <div key={leave._id} className="leave-card">
                <div className="leave-header">
                  <div className="leave-type">
                    <div>
                      <h4>{leave.leaveType}</h4>
                      <p>
                        {new Date(leave.startDate).toLocaleDateString()} -{' '}
                        {new Date(leave.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="status-badge">{leave.status}</span>
                </div>
                <div className="leave-details">
                  <p>
                    <strong>Employee:</strong> {leave.employee?.firstName} {leave.employee?.lastName}
                  </p>
                  <p>
                    <strong>Reason:</strong> {leave.reason}
                  </p>
                  {leave.comments && (
                    <p>
                      <strong>Comments:</strong> {leave.comments}
                    </p>
                  )}
                </div>
                {user?.role === 'employee' && leave.status === 'rejected' && (
                  <div className="leave-actions">
                    <button
                      className="btn-danger btn-sm"
                      onClick={() => handleDeleteRejectedLeave(leave._id)}
                    >
                      Delete Rejected Request
                    </button>
                  </div>
                )}
              </div>
            ))}
            {leaves.length === 0 && <p className="empty-state">No leave requests found.</p>}
          </div>
        )}
      </div>

      {canApprove && (
        <div className="pending-approvals">
          <h2>Pending Approvals</h2>
          <div className="approvals-list">
            {pendingApprovals.map((leave) => (
              <div key={leave._id} className="approval-card">
                <div className="approval-details">
                  <p>
                    <strong>Employee:</strong> {leave.employee?.firstName} {leave.employee?.lastName}
                  </p>
                  <p>
                    <strong>Type:</strong> {leave.leaveType}
                  </p>
                  <p>
                    <strong>Duration:</strong> {new Date(leave.startDate).toLocaleDateString()} -{' '}
                    {new Date(leave.endDate).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Reason:</strong> {leave.reason}
                  </p>
                </div>
                <div className="approval-actions">
                  <button className="btn-success btn-sm" onClick={() => handleApproval(leave._id, 'approved')}>
                    Approve
                  </button>
                  <button className="btn-danger btn-sm" onClick={() => handleApproval(leave._id, 'rejected')}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {pendingApprovals.length === 0 && <p className="text-muted">No pending approvals.</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;
