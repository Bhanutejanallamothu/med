import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../Styles/Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(false); // Add loading state

  useEffect(() => {
    // Check for auth token and user type when component mounts
    const authToken = localStorage.getItem('authToken');
    const userType = localStorage.getItem('userType');

    if (authToken) {
      // Redirect based on user type
      if (userType === 'admin') {
        navigate('/dashboard-admin');
      } else if (userType === 'volunteer') {
        navigate('/dashboard');
      }
    }
  }, [navigate]);

  const handleVolunteerClick = () => {
    setLoading(true); // Set loading to true
    navigate('/volunteer-login');
  };

  const handleAdminClick = () => {
    setLoading(true); // Set loading to true
    navigate('/admin-login');
  };

  return (
    <div className="page-container">
      <header className="app-header">
        <h1 className='login-heading'>SWECHA Healthcare</h1>
      </header>
      <div className="login-container">
        <div className="login-section">
          <div className="login-content">
            <h2 className="login-title">Login</h2>
            <div className="login-button-group">
              <button
                onClick={handleVolunteerClick}
                className="login-volunteer-btn"
                disabled={loading} // Disable button while loading
              >
                {loading ? 'Loading...' : 'Volunteer'} {/* Show loading text */}
              </button>
              <button
                onClick={handleAdminClick}
                className="login-admin-btn"
                disabled={loading} // Disable button while loading
              >
                {loading ? 'Loading...' : 'Admin'} {/* Show loading text */}
              </button>
            </div>
          </div>
        </div>
        <div className="volunteer-signup">
          <p>New to volunteering? <button onClick={() => {
            navigate('/volunteer-signup');
          }}>Sign up</button></p>
        </div>
      </div>
    </div>
  );
};

export default Login;