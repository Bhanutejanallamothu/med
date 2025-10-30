import React, { useState, useRef, useEffect } from "react";
import { privateAxios } from "../api/axios";
import { useNavigate } from "react-router-dom";
import "../Styles/PatientRegistration.css";

function PatientRegistration({ initialBookNumber = '', hideEidField = false, initialGender = '' }) {
  const [formData, setFormData] = useState({
    bookNumber: initialBookNumber,
    name: '',
    phoneNumber: '',
    age: '',
    gender: initialGender,
    area: '',
    ...(hideEidField ? {} : { eid: '' })
  });
  
  const [fieldErrors, setFieldErrors] = useState({
    bookNumber: '',
    name: '',
    phoneNumber: '',
    age: '',
    gender: '',
    area: '',
    ...(hideEidField ? {} : { eid: '' })
  });
  
  useEffect(() => {
    if (initialGender) {
      setFormData(prev => ({ ...prev, gender: initialGender }));
    }
  }, [initialGender]);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isBookNumberSubmitted, setIsBookNumberSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // 🔹 Area state
  const [areas, setAreas] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef(null);

  // ------------------ VALIDATION ------------------
  const validateField = (name, value) => {
    let errorMessage = '';
    
    switch (name) {
      case 'bookNumber':
        if (!value) {
          errorMessage = 'Book number is required';
        }
        break;
      case 'name':
        if (!value && isBookNumberSubmitted) {
          errorMessage = 'Name is required';
        }
        break;
      case 'phoneNumber':
        if (!value) {
          errorMessage = 'Phone number is required';
        } else if (!/^\d{10}$/.test(value) || isNaN(value)) {
          errorMessage = 'Phone number must be exactly 10 digits and contain only numbers';
        }
        break;
      case 'age':
        if (!value) {
          errorMessage = 'Age is required';
        } else {
          const ageValue = parseFloat(value);
          if (isNaN(ageValue) || ageValue <= 0 || ageValue > 150) {
            errorMessage = 'Age must be a valid decimal number between 0.1 and 150';
          }
        }
        break;
      case 'area':
        if (!value) {
          errorMessage = 'Area is required';
        }
        break;
      case 'eid':
        if (!hideEidField && !value) { // Only validate if not hidden and value is missing
          errorMessage = 'Token Number is required';
        }
        break;
      default:
        break;
    }
    
    return errorMessage;
  };

  // ------------------ AREA FETCH ------------------
  const fetchAreas = async (query) => {
    if (query.length < 3) {
      setAreas([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const res = await privateAxios.get(`/api/patients/patient-areas?q=${query}`);
      setAreas(res.data);
      setShowSuggestions(res.data.length > 0);
    } catch (err) {
      console.error("Error fetching areas", err);
      setShowSuggestions(false);
    }
  };

  // ------------------ HANDLE CHANGE ------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === 'phoneNumber') {
      newValue = value.slice(0, 10); // Limit to 10 digits
    }

    setFormData({ ...formData, [name]: newValue });
    setFieldErrors({ ...fieldErrors, [name]: '' });

    // 🔹 Debounced area fetch
    if (name === "area") {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => fetchAreas(value), 300);
    }
  };

  // ------------------ AREA SELECT ------------------
  const handleSuggestionClick = (area) => {
    setFormData({ ...formData, area });
    setShowSuggestions(false);
  };

  // ------------------ VALIDATE BOOK NO. FORM ------------------
  const validateBookNumberForm = () => {
    const error = validateField('bookNumber', formData.bookNumber);
    setFieldErrors({ ...fieldErrors, bookNumber: error });
    return !error;
  };

  // ------------------ VALIDATE PATIENT FORM ------------------
  const validatePatientForm = () => {
    const newErrors = {};
    let isValid = true;
    
    const requiredFields = ['name', 'phoneNumber', 'age', 'area'];
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });
    
    const optionalFields = hideEidField ? [] : ['eid']; // Conditionally include eid in optional fields
    optionalFields.forEach(field => {
      if (formData[field]) {
        const error = validateField(field, formData[field]);
        if (error) {
          newErrors[field] = error;
          isValid = false;
        }
      }
    });
    
    setFieldErrors({ ...fieldErrors, ...newErrors });
    return isValid;
  };

  // ------------------ BOOK NUMBER SUBMIT ------------------
  const handleBookNumberSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateBookNumberForm()) {
      return;
    }
    
    setError('');
    setMessage('');
    setIsLoading(true);
    
    try {
      const response = await privateAxios.get(`/api/patients/${formData.bookNumber}`);
      if (response.data) {
        setFormData({
          bookNumber: response.data.book_no,
          name: response.data.patient_name || '',
          phoneNumber: response.data.patient_phone_no || '',
          age: response.data.patient_age || '',
          gender: response.data.patient_sex || '',
          area: response.data.patient_area || '',
          ...(hideEidField ? {} : { eid: response.data.eid || '' })
        });

        if (!response.data?.eid && !hideEidField) { // Only generate token if eid is not hidden
          try {
            const tokenRes = await privateAxios.post('/api/token', {
              bookNumber: formData.bookNumber,
              gender: response.data?.patient_sex || 'unknown'
            });

            if (tokenRes.data?.tokenNumber) {
              setFormData(prev => ({
                ...prev,
                eid: tokenRes.data.tokenNumber
              }));
            }
          } catch (tokenError) {
            console.error('Error generating token:', tokenError);
          }
        }
        setMessage('Patient data loaded successfully!');
      } else {
        setMessage('No patient found. Please fill out the form.');
        setFormData(prev => ({
          ...prev,
          bookNumber: formData.bookNumber,
          name: '',
          phoneNumber: '',
          age: '',
          gender: initialGender, // Use initialGender here
          area: '',
          ...(hideEidField ? {} : { eid: '' })
        }));
      }
      setError('');
      setIsBookNumberSubmitted(true);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setMessage('No patient found. Please fill out the form.');
        setFormData(prev => ({
          ...prev,
          bookNumber: formData.bookNumber,
          name: '',
          phoneNumber: '',
          age: '',
          gender: initialGender, // Use initialGender here
          area: '',
          oldNew: '',
          ...(hideEidField ? {} : { eid: '' })
        }));
        setIsBookNumberSubmitted(true);
      } else {
        setError(error.response?.data?.message || 'An error occurred while fetching patient data.');
        setMessage('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------ SAVE PATIENT ------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePatientForm()) {
      setError('Please correct the errors before submitting');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setMessage('');
    
    try {
      const response = await privateAxios.post('/api/patients', {
        book_no: formData.bookNumber,
        patient_name: formData.name,
        patient_age: formData.age,
        patient_sex: formData.gender,
        patient_phone_no: formData.phoneNumber,
        patient_area: formData.area,
        ...(hideEidField ? {} : { eid: formData.eid }) // Conditionally include eid in payload
      });
      setMessage(response.data.message || 'Patient data saved successfully!');
      setError('');
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred while saving patient data.');
      setMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------ RENDER ------------------
  return (
    <div className="patient-registration-container">

        <button className="back-btn" hidden = {!isBookNumberSubmitted} onClick={() => {
            setIsBookNumberSubmitted(false);
            setMessage('');
            setError('');
        }}>
          <svg fill="#000000" xmlns="http://www.w3.org/2000/svg" 
            width="24px" height="24px" viewBox="0 0 52 52" enable-background="new 0 0 52 52">
          <path d="M48.6,23H15.4c-0.9,0-1.3-1.1-0.7-1.7l9.6-9.6c0.6-0.6,0.6-1.5,0-2.1l-2.2-2.2c-0.6-0.6-1.5-0.6-2.1,0
            L2.5,25c-0.6,0.6-0.6,1.5,0,2.1L20,44.6c0.6,0.6,1.5,0.6,2.1,0l2.1-2.1c0.6-0.6,0.6-1.5,0-2.1l-9.6-9.6C14,30.1,14.4,29,15.3,29
            h33.2c0.8,0,1.5-0.6,1.5-1.4v-3C50,23.8,49.4,23,48.6,23z"/>
          </svg>

        </button>

      <h1 className="patient-registration-title">Patient Registration</h1>
      {message && <div className="patient-registration-success-msg">{message}</div>}
      {error && <div className="patient-registration-error-msg">{error}</div>}

      {/* Book Number Step */}
      {!isBookNumberSubmitted ? (
        <form onSubmit={handleBookNumberSubmit} className="patient-registration-form">
          <div className="patient-registration-form-group">
            <label>
              Book Number <span className="required">*</span>
            </label>
            <input
              type="text"
              name="bookNumber"
              value={formData.bookNumber}
              onChange={handleChange}
              className={fieldErrors.bookNumber ? "error-input" : ""}
              placeholder="Enter patient book number"
            />
            {fieldErrors.bookNumber && <div className="field-error">{fieldErrors.bookNumber}</div>}
          </div>
          <button 
            type="submit" 
            className="patient-registration-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Submit"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="patient-registration-form">

          {/* Book Number */}
          <div className="patient-registration-form-group">
            <label>Book Number</label>
            <input
              type="text"
              name="bookNumber"
              value={formData.bookNumber}
              disabled
            />
          </div>

          {/* Name */}
          <div className="patient-registration-form-group">
            <label>
              Name <span className="required">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={fieldErrors.name ? "error-input" : ""}
              placeholder="Enter patient name"
            />
            {fieldErrors.name && <div className="field-error">{fieldErrors.name}</div>}
          </div>

          {/* Phone Number */}
          <div className="patient-registration-form-group">
            <label>
              Phone Number <span className="required">*</span>
            </label>
            <input
              type="number"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              maxLength="10"
              placeholder="Enter 10-digit phone number"
              className={fieldErrors.phoneNumber ? "error-input" : ""}
            />
            {fieldErrors.phoneNumber && <div className="field-error">{fieldErrors.phoneNumber}</div>}
          </div>

          {/* Age */}
          <div className="patient-registration-form-group">
            <label>
              Age <span className="required">*</span>
            </label>
            <input
              type="text"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="Enter patient age"
              className={fieldErrors.age ? "error-input" : ""}
            />
            {fieldErrors.age && <div className="field-error">{fieldErrors.age}</div>}
          </div>

          {/* Gender */}
          <div className="patient-registration-form-group">
            <label>Gender</label>
            <div className="patient-registration-radio-group">
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === 'male'}
                  onChange={handleChange}
                />
                Male
              </label>
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === 'female'}
                  onChange={handleChange}
                />
                Female
              </label>
            </div>
          </div>

          {/* Area with autocomplete */}
          <div className="patient-registration-form-group">
            <label>
              Area <span className="required">*</span>
            </label>
            <div className="area-input">
              <input
                type="text"
                name="area"
                placeholder="Area"
                value={formData.area}
                onChange={handleChange}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
                autoComplete="off"
              />
              {showSuggestions && (
                <ul className="suggestions-dropdown">
                  {areas.length > 0 ? (
                    areas.map((area, i) => (
                      <li key={i} onClick={() => handleSuggestionClick(area)}>
                        {area}
                      </li>
                    ))
                  ) : (
                    <li className="no-results">No results found</li>
                  )}
                </ul>
              )}
            </div>
          </div>

          {/* EID */}
          {!hideEidField && (
            <div className="patient-registration-form-group">
              <label>Token Number</label>
              <input
                type="number"
                name="eid"
                value={formData.eid}
                onChange={handleChange}
                placeholder="Enter patient Token Number (optional)"
                className={fieldErrors.eid ? "error-input" : ""}
              />
              {fieldErrors.eid && <div className="field-error">{fieldErrors.eid}</div>}
            </div>
          )}

          <button 
            type="submit" 
            className="patient-registration-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
        </form>
      )}
    </div>
  );
}

export default PatientRegistration;
