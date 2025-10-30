import React, { useState } from 'react';
import { privateAxios } from '../api/axios';
import '../Styles/CounsellingPage.css'; // Assuming a new CSS file for styling

const CounsellingPage = () => {
  const [bookNo, setBookNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' }); // For success/error messages

  const handleBookNoChange = (e) => {
    setBookNo(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' }); // Clear previous messages
    try {
      await privateAxios.post('/api/patient-history/counselling', { book_no: bookNo });
      setMessage({ text: 'Counselling status updated successfully!', type: 'success' });
      setBookNo('');
    } catch (error) {
      console.error('Error updating counselling status:', error);
      setMessage({ text: 'Failed to update counselling status.', type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 5000); // Clear message after 5 seconds
    }
  };

  return (
    <div className="counselling-container">
      <h2>Counselling Page</h2>
      <form onSubmit={handleSubmit} className="counselling-form">
        <div className="form-group">
          <label htmlFor="bookNo">Book Number:</label>
          <input
            type="text"
            id="bookNo"
            value={bookNo}
            onChange={handleBookNoChange}
            placeholder="Enter Book Number"
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Mark as Counselled'}
        </button>
        {message.text && (
          <p className={`message ${message.type === 'success' ? 'success-message' : 'error-message'}`}>
            {message.text}
          </p>
        )}
      </form>
    </div>
  );
};

export default CounsellingPage;
