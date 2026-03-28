import React, { useEffect, useState } from 'react';
import { assetsAPI, employeesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/Assets.css';

const defaultAssignData = {
  employeeId: '',
  expectedReturnDate: '',
  notes: '',
};

const Assets = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [stats, setStats] = useState({});
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignData, setAssignData] = useState(defaultAssignData);

  const canManage = user?.role === 'ceo' || user?.role === 'manager';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assetsResponse, statsResponse] = await Promise.all([
        assetsAPI.getAll(),
        assetsAPI.getStats(),
      ]);

      if (assetsResponse.data.success) {
        setAssets(assetsResponse.data.assets || []);
      }
      if (statsResponse.data.success) {
        setStats(statsResponse.data.stats || {});
      }

      if (canManage) {
        const employeeResponse = await employeesAPI.getAll({ page: 1, limit: 200 });
        if (employeeResponse.data.success) {
          setEmployees(employeeResponse.data.employees || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch asset data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [canManage]);

  const handleAssign = async (event) => {
    event.preventDefault();
    if (!selectedAsset) return;

    try {
      await assetsAPI.assign({
        assetId: selectedAsset._id,
        ...assignData,
      });
      setShowAssignModal(false);
      setSelectedAsset(null);
      setAssignData(defaultAssignData);
      fetchData();
    } catch (error) {
      console.error('Failed to assign asset:', error);
      alert('Failed to assign asset');
    }
  };

  const handleReturn = async (assetId) => {
    try {
      await assetsAPI.returnAsset(assetId, { condition: 'good' });
      fetchData();
    } catch (error) {
      console.error('Failed to return asset:', error);
      alert('Failed to return asset');
    }
  };

  if (loading) return <div className="loading">Loading assets...</div>;

  return (
    <div className="dashboard-content">
      <div className="header-actions">
        <h1>Asset Management</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <h4>{stats.totalAssets || 0}</h4>
            <p>Total</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h4>{stats.availableAssets || 0}</h4>
            <p>Available</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h4>{stats.assignedAssets || 0}</h4>
            <p>Assigned</p>
          </div>
        </div>
      </div>

      <div className="assets-grid">
        {assets.map((asset) => (
          <div key={asset._id} className="asset-card">
            <div className={`asset-status status-${asset.status}`}>{asset.status}</div>
            <h3>{asset.name}</h3>
            <p className="asset-meta">SN: {asset.serialNumber || 'N/A'}</p>
            <p>Category: {asset.category}</p>
            <p>
              Current Holder:{' '}
              <strong>
                {asset.currentHolder
                  ? `${asset.currentHolder.firstName} ${asset.currentHolder.lastName}`
                  : 'Unassigned'}
              </strong>
            </p>

            {canManage && (
              <div className="asset-actions">
                {asset.status === 'available' && (
                  <button
                    className="btn-primary sm"
                    onClick={() => {
                      setSelectedAsset(asset);
                      setShowAssignModal(true);
                    }}
                  >
                    Assign
                  </button>
                )}
                {asset.status === 'assigned' && (
                  <button className="btn-secondary sm" onClick={() => handleReturn(asset._id)}>
                    Return
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Assign Asset: {selectedAsset?.name}</h2>
            <form onSubmit={handleAssign}>
              <div className="form-group">
                <label>Assign To</label>
                <select
                  value={assignData.employeeId}
                  onChange={(event) =>
                    setAssignData((prev) => ({ ...prev, employeeId: event.target.value }))
                  }
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.firstName} {employee.lastName} ({employee.employeeId})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Expected Return Date</label>
                <input
                  type="date"
                  value={assignData.expectedReturnDate}
                  onChange={(event) =>
                    setAssignData((prev) => ({ ...prev, expectedReturnDate: event.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={assignData.notes}
                  onChange={(event) => setAssignData((prev) => ({ ...prev, notes: event.target.value }))}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;
