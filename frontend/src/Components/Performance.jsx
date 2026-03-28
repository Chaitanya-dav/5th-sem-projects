import React, { useEffect, useState } from 'react';
import { employeesAPI, performanceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';

const defaultForm = {
  employee: '',
  rating: 5,
  feedback: '',
  goals: '',
};

const Performance = () => {
  const { user } = useAuth();
  const canReview = user?.role === 'ceo' || user?.role === 'manager';
  const [reviews, setReviews] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(defaultForm);

  const fetchData = async () => {
    try {
      setLoading(true);
      const reviewResponse = await performanceAPI.getAll();
      if (reviewResponse.data.success) {
        setReviews(reviewResponse.data.reviews || []);
      }

      if (canReview) {
        const employeeResponse = await employeesAPI.getAll({ page: 1, limit: 200 });
        if (employeeResponse.data.success) {
          setEmployees(employeeResponse.data.employees || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [canReview]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await performanceAPI.addReview(formData);
      if (response.data.success) {
        setShowModal(false);
        setFormData(defaultForm);
        fetchData();
      }
    } catch (error) {
      console.error('Failed to submit performance review:', error);
      alert('Failed to submit review');
    }
  };

  const handleDelete = async (reviewId) => {
    try {
      await performanceAPI.deleteReview(reviewId);
      fetchData();
    } catch (error) {
      console.error('Failed to delete review:', error);
      alert('Failed to delete review');
    }
  };

  if (loading) return <div className="loading">Loading performance data...</div>;

  return (
    <div className="dashboard-content">
      <div className="header-actions">
        <h1>Performance Management</h1>
        {canReview && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            Add Review
          </button>
        )}
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Reviewer</th>
              <th>Rating</th>
              <th>Feedback</th>
              <th>Goals</th>
              <th>Date</th>
              {canReview && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review._id}>
                <td>
                  {review.employee?.firstName} {review.employee?.lastName}
                </td>
                <td>
                  {review.reviewer?.firstName} {review.reviewer?.lastName}
                </td>
                <td>{review.rating}/5</td>
                <td>{review.feedback}</td>
                <td>{review.goals || '-'}</td>
                <td>{new Date(review.reviewDate || review.createdAt).toLocaleDateString()}</td>
                {canReview && (
                  <td>
                    <button className="btn-danger" onClick={() => handleDelete(review._id)}>
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {reviews.length === 0 && (
              <tr>
                <td colSpan={canReview ? 7 : 6} style={{ textAlign: 'center', padding: '2rem' }}>
                  No performance reviews found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add Performance Review</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Employee</label>
                <select
                  value={formData.employee}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, employee: event.target.value }))
                  }
                  required
                >
                  <option value="">Select employee</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.firstName} {employee.lastName} ({employee.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Rating</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.rating}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, rating: Number(event.target.value) }))
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Feedback</label>
                <textarea
                  value={formData.feedback}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, feedback: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Goals</label>
                <textarea
                  value={formData.goals}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, goals: event.target.value }))
                  }
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Performance;
