import React, { useEffect, useMemo, useState } from 'react';
import { attendanceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/Attendance.css';

const Attendance = () => {
  const { user } = useAuth();
  const isCEO = user?.role === 'ceo';
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    now.setDate(now.getDate() - 6);
    return now.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  const todayRecord = useMemo(
    () =>
      records.find(
        (record) =>
          record.employee?._id === user?.employee?._id &&
          new Date(record.date).toDateString() === new Date(selectedDate).toDateString()
      ),
    [records, selectedDate, user?.employee?._id]
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const attendanceParams = isCEO
        ? { startDate, endDate }
        : { date: selectedDate };

      const [recordsResponse, statsResponse] = await Promise.all([
        attendanceAPI.getRecords(attendanceParams),
        attendanceAPI.getStats(),
      ]);

      if (recordsResponse.data.success) {
        setRecords(recordsResponse.data.attendance || []);
      }
      if (statsResponse.data.success) {
        setStats(statsResponse.data.stats || {});
      }
    } catch (error) {
      console.error('Attendance fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate, startDate, endDate, isCEO]);

  const markAttendance = async (type) => {
    try {
      const time = new Date().toTimeString().slice(0, 5);
      const payload = {
        date: selectedDate,
        status: 'present',
      };

      if (type === 'in') payload.clockIn = time;
      if (type === 'out') payload.clockOut = time;

      await attendanceAPI.record(payload);
      fetchData();
    } catch (error) {
      console.error('Failed to mark attendance:', error);
      alert('Failed to mark attendance');
    }
  };

  return (
    <div className="attendance">
      <div className="page-header">
        <h1>Attendance</h1>
        <p>
          {user?.role === 'employee'
            ? 'Mark your attendance and view your records.'
            : 'Track attendance for your accessible team scope.'}
        </p>
      </div>

      <div className="clock-section">
        <div className="clock-card">
          <h3>Mark Attendance</h3>
          <div className="record-item">
            <span>Date:</span>
            <input
              type="date"
              className="date-picker"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </div>
          {isCEO && (
            <>
              <div className="record-item">
                <span>Report Start:</span>
                <input
                  type="date"
                  className="date-picker"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>
              <div className="record-item">
                <span>Report End:</span>
                <input
                  type="date"
                  className="date-picker"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </div>
            </>
          )}
          <div className="record-item">
            <span>Clock In:</span>
            <strong>{todayRecord?.clockIn || 'Not Marked'}</strong>
          </div>
          <div className="record-item">
            <span>Clock Out:</span>
            <strong>{todayRecord?.clockOut || 'Not Marked'}</strong>
          </div>
          <div className="clock-actions">
            <button className="btn-success" onClick={() => markAttendance('in')}>
              Clock In
            </button>
            <button className="btn-warning" onClick={() => markAttendance('out')}>
              Clock Out
            </button>
          </div>
        </div>
      </div>

      <div className="attendance-section">
        <div className="section-header">
          <h2>{isCEO ? 'Organization Attendance Report' : 'Attendance Records'}</h2>
        </div>
        {loading ? (
          <div className="loading">Loading attendance...</div>
        ) : (
          <div className="attendance-table-container">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record._id}>
                    <td>
                      {record.employee?.firstName} {record.employee?.lastName}
                    </td>
                    <td>{new Date(record.date).toLocaleDateString()}</td>
                    <td>{record.clockIn || '--:--'}</td>
                    <td>{record.clockOut || '--:--'}</td>
                    <td>{record.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {records.length === 0 && <p className="empty-state">No records found for this date.</p>}
          </div>
        )}
      </div>

      <div className="stats-section">
        <h3>Monthly Summary</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-info">
              <h4>{stats.present || 0}</h4>
              <p>Present</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <h4>{stats.absent || 0}</h4>
              <p>Absent</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <h4>{stats.half_day || 0}</h4>
              <p>Half Day</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <h4>{stats.totalHours || 0}</h4>
              <p>Total Hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
