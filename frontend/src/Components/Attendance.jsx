import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { attendanceAPI } from "../services/api";
import "../styles/Attendance.css";

const Attendance = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [clockInTime, setClockInTime] = useState("");
  const [clockOutTime, setClockOutTime] = useState("");
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);

  useEffect(() => {
    fetchAttendance();
    checkTodayAttendance();
  }, [selectedDate]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getRecords({ date: selectedDate });
      if (response.data.success) {
        setAttendance(response.data.attendance || []);
      }
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkTodayAttendance = async () => {
    const today = new Date().toISOString().split("T")[0];
    try {
      const response = await attendanceAPI.getRecords({ date: today });
      if (response.data.success && response.data.attendance) {
        const userAttendance = response.data.attendance.find(
          (record) => record.employee_id === user.employeeId
        );
        setTodayAttendance(userAttendance);
        setIsClockedIn(
          !!userAttendance?.clock_in && !userAttendance?.clock_out
        );
      }
    } catch (error) {
      console.error("Failed to check today attendance:", error);
    }
  };

  const handleClockIn = async () => {
    try {
      const now = new Date();
      const timeString = now.toTimeString().split(" ")[0];
      setClockInTime(timeString);

      const response = await attendanceAPI.record({
        employee_id: user.employeeId,
        date: new Date().toISOString().split("T")[0],
        clock_in: timeString,
        status: "present",
      });

      if (response.data.success) {
        setIsClockedIn(true);
        setTodayAttendance(response.data.attendance);
        fetchAttendance();
      }
    } catch (error) {
      console.error("Failed to clock in:", error);
      alert("Failed to clock in. Please try again.");
    }
  };

  const handleClockOut = async () => {
    try {
      const now = new Date();
      const timeString = now.toTimeString().split(" ")[0];
      setClockOutTime(timeString);

      const response = await attendanceAPI.record({
        employee_id: user.employeeId,
        date: new Date().toISOString().split("T")[0],
        clock_out: timeString,
      });

      if (response.data.success) {
        setIsClockedIn(false);
        setTodayAttendance(response.data.attendance);
        fetchAttendance();
      }
    } catch (error) {
      console.error("Failed to clock out:", error);
      alert("Failed to clock out. Please try again.");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      present: "#27ae60",
      absent: "#e74c3c",
      half_day: "#f39c12",
      holiday: "#9b59b6",
      weekend: "#34495e",
    };
    return colors[status] || "#95a5a6";
  };

  const calculateHours = (clockIn, clockOut) => {
    if (!clockIn || !clockOut) return "N/A";

    const [inHours, inMinutes] = clockIn.split(":").map(Number);
    const [outHours, outMinutes] = clockOut.split(":").map(Number);

    const totalMinutes =
      outHours * 60 + outMinutes - (inHours * 60 + inMinutes);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="attendance">
      <div className="page-header">
        <h1>Attendance Management</h1>
        <p>Track and manage employee attendance</p>
      </div>

      {/* Clock In/Out Section */}
      <div className="clock-section">
        <div className="clock-card">
          <h3>Today's Attendance</h3>
          <div className="current-time">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>

          <div className="clock-status">
            {todayAttendance ? (
              <div className="attendance-record">
                <div className="record-item">
                  <span>Clock In:</span>
                  <strong>{todayAttendance.clock_in || "Not recorded"}</strong>
                </div>
                <div className="record-item">
                  <span>Clock Out:</span>
                  <strong>{todayAttendance.clock_out || "Not recorded"}</strong>
                </div>
                <div className="record-item">
                  <span>Total Hours:</span>
                  <strong>
                    {calculateHours(
                      todayAttendance.clock_in,
                      todayAttendance.clock_out
                    )}
                  </strong>
                </div>
                <div className="record-item">
                  <span>Status:</span>
                  <span
                    className="status-badge"
                    style={{
                      backgroundColor: getStatusColor(todayAttendance.status),
                    }}
                  >
                    {todayAttendance.status?.replace("_", " ")}
                  </span>
                </div>
              </div>
            ) : (
              <p className="no-record">No attendance record for today</p>
            )}
          </div>

          <div className="clock-actions">
            {!isClockedIn && !todayAttendance?.clock_in && (
              <button className="btn-success" onClick={handleClockIn}>
                ⏰ Clock In
              </button>
            )}

            {isClockedIn && (
              <button className="btn-warning" onClick={handleClockOut}>
                🏠 Clock Out
              </button>
            )}

            {todayAttendance?.clock_in && todayAttendance?.clock_out && (
              <button className="btn-secondary" disabled>
                ✅ Completed for Today
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Attendance Records */}
      <div className="attendance-section">
        <div className="section-header">
          <h2>Attendance Records</h2>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-picker"
          />
        </div>

        {loading ? (
          <div className="loading">Loading attendance records...</div>
        ) : (
          <div className="attendance-table-container">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Total Hours</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((record) => (
                  <tr key={record.id}>
                    <td className="employee-cell">
                      <div className="employee-info">
                        <div className="avatar-sm">
                          {record.first_name?.[0]}
                          {record.last_name?.[0]}
                        </div>
                        <span>
                          {record.first_name} {record.last_name}
                        </span>
                      </div>
                    </td>
                    <td>{new Date(record.date).toLocaleDateString()}</td>
                    <td>{record.clock_in || "--:--"}</td>
                    <td>{record.clock_out || "--:--"}</td>
                    <td>{calculateHours(record.clock_in, record.clock_out)}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: getStatusColor(record.status),
                        }}
                      >
                        {record.status?.replace("_", " ")}
                      </span>
                    </td>
                    <td>{record.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {attendance.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h3>No attendance records found</h3>
                <p>No attendance data available for the selected date</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="stats-section">
        <h3>This Month's Summary</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon present">✅</div>
            <div className="stat-info">
              <h4>22</h4>
              <p>Present Days</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon absent">❌</div>
            <div className="stat-info">
              <h4>2</h4>
              <p>Absent Days</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon late">⏰</div>
            <div className="stat-info">
              <h4>1</h4>
              <p>Late Arrivals</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon hours">🕒</div>
            <div className="stat-info">
              <h4>176</h4>
              <p>Total Hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
