import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
import { privateAxios } from '../api/axios';
import '../Styles/MedicinePickup.css';

function MedicineVerification({ bookNo, showVerification, setShowVerification }) {
  const [verificationData, setVerificationData] = useState({
    medicines_prescribed: [],
    medicines_given: []
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  useEffect(() => {
    if (bookNo && showVerification) {
      fetchVerificationData();
    }
  }, [bookNo, showVerification]);

  const fetchVerificationData = async () => {
    setIsLoading(true); // Set loading to true when fetching starts
    try {
      const response = await privateAxios.get(
        `/api/patient-history/medicine-verification/${bookNo}`
      );
      setVerificationData(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch verification data');
    } finally {
      setIsLoading(false); // Set loading back to false after fetching
    }
  };

  if (!showVerification) return null;

  return (
    <div className="medicine-verification-overlay">
      <div className="medicine-verification-popup">
        <h2>Medicine Verification - Book #{bookNo}</h2>
        
        <div className="verification-section">
          <h3>Prescribed Medicines</h3>
          {isLoading ? ( // Show loading state while fetching data
            <p>Loading prescribed medicines...</p>
          ) : verificationData.medicines_prescribed.length > 0 ? (
            <table className="verification-table">
              <thead>
                <tr>
                  <th>Medicine ID</th>
                  <th>Quantity</th>
                  <th>Schedule</th>
                </tr>
              </thead>
              <tbody>
                {verificationData.medicines_prescribed.map((med, index) => (
                  <tr key={`prescribed-${index}`}>
                    <td>{med.medicine_id}</td>
                    <td>{med.quantity}</td>
                    <td>
                      {med.dosage_schedule ? (
                        <>
                          {med.dosage_schedule.days} days
                          <br />
                          {med.dosage_schedule.morning && '✓ Morning '}
                          {med.dosage_schedule.afternoon && '✓ Afternoon '}
                          {med.dosage_schedule.night && '✓ Night'}
                        </>
                      ) : (
                        'No schedule'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No prescribed medicines found</p>
          )}
        </div>
        
        <div className="verification-section">
          <h3>Medicines Given</h3>
          {isLoading ? ( // Show loading state while fetching data
            <p>Loading medicines given...</p>
          ) : verificationData.medicines_given.length > 0 ? (
            <table className="verification-table">
              <thead>
                <tr>
                  <th>Medicine ID</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {verificationData.medicines_given.map((med, index) => (
                  <tr key={`given-${index}`}>
                    <td>{med.medicine_id}</td>
                    <td>{med.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No medicines have been given yet</p>
          )}
        </div>

        {error && <div className="verification-error">{error}</div>}
        
        <button 
          className="medicine-pickup-close-popup"
          onClick={() => setShowVerification(false)}
          disabled={isLoading} // Disable the button while loading
        >
          {isLoading ? 'Loading...' : 'Close'} {/* Show loading text */}
        </button>
      </div>
    </div>
  );
}

export default MedicineVerification;