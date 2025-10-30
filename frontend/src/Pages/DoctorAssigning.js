import React, { useState, useEffect } from "react";
import { privateAxios } from "../api/axios";
import "../Styles/DoctorAssigning.css";

function DoctorAssigning() {
  const [formData, setFormData] = useState({ bookNumber: '', doc_name: '' });
  const [doctors, setDoctors] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  useEffect(() => {
    const fetchDoctors = async () => {
      setIsLoading(true); // Set loading to true while fetching doctors
      try {
        const response = await privateAxios.get('/api/doctor-assign/get_doctors');
        setDoctors(response.data);
        setError('');
      } catch (error) {
        console.error('Error fetching doctors:', error);
        setError('Error fetching doctors');
      } finally {
        setIsLoading(false); // Set loading back to false after fetching
      }
    };

    fetchDoctors();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Set loading to true when submitting starts
    try {
      const response = await privateAxios.post('/api/doctor-assign', {
        book_no: formData.bookNumber,
        doc_name: formData.doc_name,
      });
      setMessage(response.data.message || 'Doctor-patient mapping successful!');
      setError('');
      setFormData({ bookNumber: '', doc_name: '' });
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.message || 'An error occurred');
      setMessage('');
    } finally {
      setIsLoading(false); // Set loading back to false after submission
    }
  };

  return (
    <div className="doctor-assigning-container">
      <h1 className="doctor-assigning-title">Doctor Assigning</h1>
      {message && <div className="doctor-assigning-success-msg">{message}</div>}
      {error && <div className="doctor-assigning-error-msg">{error}</div>}
      <form onSubmit={handleSubmit} className="doctor-assigning-form">
        <div className="doctor-assigning-form-group">
          <label>Book Number</label>
          <input
            type="number"
            name="bookNumber"
            value={formData.bookNumber}
            onChange={handleChange}
            required
            disabled={isLoading} // Disable input while loading
          />
        </div>
        <div className="doctor-assigning-form-group">
          <label>Doctor Assigned</label>
          <div className="doctor-assigning-radio-group">
          {doctors.length > 0 ? (
              doctors.map((doctor) => (
                <label key={doctor._id}>
                  <input
                    type="radio"
                    name="doc_name"
                    value={doctor.doctor_name}
                    checked={formData.doc_name === doctor.doctor_name}
                    onChange={handleChange}
                    required
                    disabled={isLoading} // Disable input while loading
                  />
                  {doctor.doctor_name} ({doctor.specialization})
                </label>
              ))
            ) : (
              <p>No doctors available</p>
            )}
          </div>
        </div>
        <button
          type="submit"
          className="doctor-assigning-submit-btn"
          disabled={isLoading} // Disable button while loading
        >
          {isLoading ? 'Submitting...' : 'Submit'} {/* Show loading text */}
        </button>
      </form>
    </div>
  );
}

export default DoctorAssigning;