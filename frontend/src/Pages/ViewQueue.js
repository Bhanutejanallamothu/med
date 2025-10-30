// src/Pages/ViewQueue.js

import React, { useState, useEffect } from 'react';
import { privateAxios } from '../api/axios';
import '../Styles/ViewQueue.css';
import { useNavigate } from 'react-router-dom';

export default function ViewQueue() {
  const [doctors, setDoctors] = useState([]);
  const [queues, setQueues] = useState({});
  const [queueCounts, setQueueCounts] = useState({});
  const [error, setError] = useState('');
  const [status, setStatus] = useState({});
  const [loadingItem, setLoadingItem] = useState({});
  const [isLoading, setIsLoading] = useState(true); // Main loading state
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch doctors
        const res = await privateAxios.get('/api/doctor-assign/get_doctors');
        setDoctors(res.data);
        
        if (res.data.length > 0) {
          const map = {};
          const countMap = {};
          
          // Fetch queue information for each doctor
          await Promise.all(
            res.data.map(async (doc) => {
              try {
                setLoadingItem(prev => ({ ...prev, [doc.doctor_id]: true }));
                
                // Fetch next patient in queue
                const queueRes = await privateAxios.get(`/api/queue/next/${doc.doctor_id}`);
                map[doc.doctor_id] = queueRes.data.book_no;
                
                // Fetch queue count
                const countRes = await privateAxios.get(`/api/queue/count/${doc.doctor_id}`);
                countMap[doc.doctor_id] = countRes.data.queueCount;
              } catch (err) {
                if (err.response?.status === 404) {
                  map[doc.doctor_id] = null;
                } else {
                  map[doc.doctor_id] = 'Error';
                  console.error(`Error fetching data for doctor ${doc.doctor_id}:`, err);
                }
                countMap[doc.doctor_id] = 0;
              } finally {
                setLoadingItem(prev => ({ ...prev, [doc.doctor_id]: false }));
              }
            })
          );
          
          setQueues(map);
          setQueueCounts(countMap);
        }
      } catch (err) {
        console.error('Error fetching doctors:', err);
        setError(err.response?.data?.message || 'Error loading doctors');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAssign = async (doctor) => {
    const bookNo = queues[doctor.doctor_id];
    if (!bookNo) return;
    
    try {
      // Update status to indicate processing
      setStatus((s) => ({ ...s, [doctor.doctor_id]: 'Processing...' }));
      
      // Assign doctor to patient
      await privateAxios.post('/api/doctor-assign', {
        book_no: bookNo,
        doc_name: doctor.doctor_name,
      });

      // Remove from queue
      await privateAxios.delete('/api/queue/remove', { data: { book_no: bookNo } });

      setStatus((s) => ({ ...s, [doctor.doctor_id]: 'Assigned' }));

      // Show popup and reload after a brief delay to show the status
      setTimeout(() => {
        alert(`Doctor ${doctor.doctor_name} assigned to Book #${bookNo}`);
        navigate('/view-queue'); // Redirect to the same page to refresh data
      }, 500);
    } catch (err) {
      console.error('Assign error:', err);
      setStatus((s) => ({
        ...s,
        [doctor.doctor_id]: err.response?.data?.message || 'Error',
      }));
    }
  };

  const getStatusClass = (statusValue) => {
    if (!statusValue) return '';
    if (statusValue === 'Assigned') return 'status-assigned';
    if (statusValue === 'Processing...') return 'status-processing';
    return 'status-error';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="view-queues-container">
        <h1 className="view-queues-title">Doctor Queues</h1>
        <div className="view-queues-loading-container">
          <div className="view-queues-loading-spinner"></div>
          <div className="view-queues-loading-text">Loading doctors and queues...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="view-queues-container">
      <h1 className="view-queues-title">Doctor Queues</h1>
      {error && <div className="view-queues-error">{error}</div>}
      {doctors.length > 0 ? (
        <ul className="view-queues-list">
          {doctors.map((doc) => {
            const bookNo = queues[doc.doctor_id];
            const count = queueCounts[doc.doctor_id];
            const isItemLoading = loadingItem[doc.doctor_id];
            return (
              <li key={doc.doctor_id} className="view-queues-item">
                <div className="doctor-info">
                  <span className="doctor-name">{doc.doctor_name}</span>
                  <div className="queue-details">
                    <span className="queue-count">Queue: {count === undefined ? '...' : count}</span>
                    {isItemLoading ? (
                      <span className="loading-text">
                        <span className="loading-spinner"></span>
                        Loading next patient...
                      </span>
                    ) : (
                      bookNo === undefined ? (
                        <span className="loading-text">Loading next patient...</span>
                      ) : bookNo === null ? (
                        <span className="no-queue">No patients in queue</span>
                      ) : (
                        <span className="next-patient">Next: Book #{bookNo}</span>
                      )
                    )}
                  </div>
                </div>
                
                <div className="view-queues-controls">
                  {bookNo && (
                    <button
                      className="view-queues-assign-btn"
                      onClick={() => handleAssign(doc)}
                      disabled={status[doc.doctor_id] === 'Assigned' || status[doc.doctor_id] === 'Processing...'}
                    >
                      {status[doc.doctor_id] && status[doc.doctor_id] !== 'Error' 
                        ? status[doc.doctor_id] 
                        : 'Assign'}
                    </button>
                  )}
                  {status[doc.doctor_id] === 'Error' && (
                    <span className={`view-queues-status ${getStatusClass(status[doc.doctor_id])}`}>
                      {status[doc.doctor_id]}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="no-doctors-message">No doctors available</p>
      )}
    </div>
  );
}
