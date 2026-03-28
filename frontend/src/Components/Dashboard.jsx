import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';
import '../styles/Dashboard.css';

const roleLabels = {
  ceo: 'CEO Dashboard',
  manager: 'Manager Dashboard',
  employee: 'Employee Dashboard',
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [authority, setAuthority] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityForm, setActivityForm] = useState({
    action: '',
    user: '',
    type: 'announcement',
    isGlobal: true,
  });
  const [activitySaving, setActivitySaving] = useState(false);

  const moduleActions = useMemo(
    () => [
      { label: 'Attendance', path: '/attendance' },
      { label: 'Leave Management', path: '/leaves' },
      { label: 'Asset Management', path: '/assets' },
      { label: 'Performance', path: '/performance' },
      ...(user?.role !== 'employee' ? [{ label: 'Employees', path: '/employees' }] : []),
    ],
    [user?.role]
  );

  const fetchDashboard = async () => {
    try {
      const [summaryResponse, activityResponse] = await Promise.all([
        dashboardAPI.getSummary(),
        dashboardAPI.getActivity(),
      ]);

      if (summaryResponse.data.success) {
        setSummary(summaryResponse.data.summary);
        setAuthority(summaryResponse.data.authority);
      }

      if (activityResponse.data.success) {
        setActivities(activityResponse.data.activities || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    setActivityForm((prev) => ({
      ...prev,
      user:
        `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
        (user?.role ? user.role.toUpperCase() : ''),
      type: user?.role === 'manager' ? 'announcement' : prev.type,
      isGlobal: true,
    }));
  }, [user?.firstName, user?.lastName, user?.role]);

  const handleAddActivity = async (event) => {
    event.preventDefault();
    if (!activityForm.action.trim()) return;

    try {
      setActivitySaving(true);
      await dashboardAPI.addActivity(activityForm);
      setActivityForm({
        action: '',
        user:
          `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
          (user?.role ? user.role.toUpperCase() : ''),
        type: user?.role === 'manager' ? 'announcement' : 'announcement',
        isGlobal: true,
      });
      fetchDashboard();
    } catch (error) {
      console.error('Failed to add activity:', error);
      alert(error.response?.data?.message || 'Failed to add activity');
    } finally {
      setActivitySaving(false);
    }
  };

  const handleRemoveActivity = async (activityId) => {
    try {
      await dashboardAPI.removeActivity(activityId);
      fetchDashboard();
    } catch (error) {
      console.error('Failed to remove activity:', error);
      alert(error.response?.data?.message || 'Failed to remove activity');
    }
  };

  const canManageAnnouncements = user?.role === 'ceo' || user?.role === 'manager';
  const canDeleteActivity = (activity) => {
    if (user?.role === 'ceo') return true;
    if (user?.role === 'manager') {
      return (
        activity?.type === 'announcement' &&
        activity?.createdBy?.id &&
        activity.createdBy.id === user?.id
      );
    }
    return false;
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>{roleLabels[user?.role] || 'Dashboard'}</h1>
            <p>
              Welcome {user?.firstName} {user?.lastName} ({user?.role})
            </p>
          </div>
          <div className="header-actions">
            <button className="btn-secondary" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <h3>{summary?.totalEmployees ?? 0}</h3>
            <p>{user?.role === 'employee' ? 'Visible Team Size' : 'Total Employees'}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>{summary?.presentToday ?? 0}</h3>
            <p>Present Today</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>{summary?.pendingLeaves ?? 0}</h3>
            <p>Pending Leaves</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>{summary?.activeAssets ?? 0}</h3>
            <p>Active Assets</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="quick-actions">
          <h2>Authority Access</h2>
          <div className="actions-grid">
            <button className="action-btn" disabled={!authority?.canApproveLeave}>
              {authority?.canApproveLeave ? 'Can Approve Leave' : 'Cannot Approve Leave'}
            </button>
            <button className="action-btn" disabled={!authority?.canManageAssets}>
              {authority?.canManageAssets ? 'Can Manage Assets' : 'View Assets Only'}
            </button>
            <button className="action-btn" disabled={!authority?.canReviewPerformance}>
              {authority?.canReviewPerformance ? 'Can Review Performance' : 'View Performance Only'}
            </button>
            <button className="action-btn" disabled={!authority?.canViewOrganizationWide}>
              {authority?.canViewOrganizationWide ? 'Organization Wide Access' : 'Restricted Scope Access'}
            </button>
          </div>
        </div>

        <div className="quick-actions">
          <h2>Module Navigation</h2>
          <div className="actions-grid">
            {moduleActions.map((module) => (
              <button key={module.path} className="action-btn" onClick={() => navigate(module.path)}>
                {module.label}
              </button>
            ))}
          </div>
        </div>

        <div className="recent-activities">
          <h2>Recent Activities</h2>
          {canManageAnnouncements && (
            <form onSubmit={handleAddActivity} className="leave-form" style={{ marginBottom: '1rem' }}>
              <div className="form-group">
                <label>Activity Text</label>
                <input
                  type="text"
                  value={activityForm.action}
                  onChange={(event) =>
                    setActivityForm((prev) => ({ ...prev, action: event.target.value }))
                  }
                  placeholder="Add global activity update"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Display User</label>
                  <input
                    type="text"
                    value={activityForm.user}
                    onChange={(event) =>
                      setActivityForm((prev) => ({ ...prev, user: event.target.value }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={activityForm.type}
                    onChange={(event) =>
                      setActivityForm((prev) => ({ ...prev, type: event.target.value }))
                    }
                    disabled={user?.role === 'manager'}
                  >
                    <option value="announcement">Announcement</option>
                    {user?.role === 'ceo' && <option value="policy">Policy</option>}
                    {user?.role === 'ceo' && <option value="performance">Performance</option>}
                    {user?.role === 'ceo' && <option value="attendance">Attendance</option>}
                    {user?.role === 'ceo' && <option value="general">General</option>}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={activitySaving}>
                {activitySaving ? 'Saving...' : 'Add Announcement'}
              </button>
            </form>
          )}
          <div className="activities-list">
            {activities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-content">
                  <h4>{activity.action}</h4>
                  <p>{activity.user}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className="activity-time">{new Date(activity.time).toLocaleString()}</span>
                  {canDeleteActivity(activity) && (
                    <button className="btn-danger" onClick={() => handleRemoveActivity(activity.id)}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
            {activities.length === 0 && <p>No recent activities available.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
