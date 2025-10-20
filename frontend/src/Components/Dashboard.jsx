import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { employeesAPI, attendanceAPI } from "../services/api";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    onLeave: 0,
    activeAssets: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch employee count
      const empResponse = await employeesAPI.getAll({ page: 1, limit: 1 });

      // Fetch today's attendance
      const today = new Date().toISOString().split("T")[0];
      const attResponse = await attendanceAPI.getRecords({ date: today });

      setStats({
        totalEmployees: empResponse.data.pagination?.total || 0,
        presentToday:
          attResponse.data.attendance?.filter((a) => a.status === "present")
            .length || 0,
        onLeave: 3, // Mock data
        activeAssets: 12, // Mock data
      });

      // Mock recent activities
      setRecentActivities([
        {
          id: 1,
          action: "New employee registered",
          user: "John Doe",
          time: "2 hours ago",
        },
        {
          id: 2,
          action: "Leave request approved",
          user: "Jane Smith",
          time: "4 hours ago",
        },
        {
          id: 3,
          action: "Asset assigned",
          user: "IT Department",
          time: "1 day ago",
        },
        {
          id: 4,
          action: "Performance review completed",
          user: "HR Team",
          time: "2 days ago",
        },
      ]);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>Welcome back, {user?.firstName}!</h1>
            <p>Here's what's happening in your organization today</p>
          </div>
          <div className="header-actions">
            <button className="btn-primary">Quick Action</button>
            <button className="btn-secondary" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon employees">👥</div>
          <div className="stat-info">
            <h3>{stats.totalEmployees}</h3>
            <p>Total Employees</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon attendance">✅</div>
          <div className="stat-info">
            <h3>{stats.presentToday}</h3>
            <p>Present Today</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon leaves">🏖️</div>
          <div className="stat-info">
            <h3>{stats.onLeave}</h3>
            <p>On Leave</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon assets">💻</div>
          <div className="stat-info">
            <h3>{stats.activeAssets}</h3>
            <p>Active Assets</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="recent-activities">
          <h2>Recent Activities</h2>
          <div className="activities-list">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-content">
                  <h4>{activity.action}</h4>
                  <p>By {activity.user}</p>
                </div>
                <span className="activity-time">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <button
              className="action-btn"
              onClick={() => (window.location.href = "/employees")}
            >
              👥 Manage Employees
            </button>
            <button
              className="action-btn"
              onClick={() => (window.location.href = "/attendance")}
            >
              📊 View Attendance
            </button>
            <button
              className="action-btn"
              onClick={() => (window.location.href = "/leaves")}
            >
              🏖️ Leave Management
            </button>
            <button
              className="action-btn"
              onClick={() => (window.location.href = "/assets")}
            >
              💻 Asset Tracking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
