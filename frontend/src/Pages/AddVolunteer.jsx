import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { privateAxios, publicAxios } from '../api/axios';

const styles = {
    container: {
        padding: '20px',
        width: '100%',
        maxWidth: '500px',
        margin: '40px auto',
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        boxSizing: 'border-box',
    },
    containerDesktop: {
        padding: '40px',
    },
    h2: {
        textAlign: 'center',
        color: '#333',
        marginBottom: '25px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    group: {
        display: 'flex',
        flexDirection: 'column',
    },
    label: {
        marginBottom: '8px',
        fontWeight: '600',
        color: '#555',
    },
    required: {
        color: '#d9534f',
        marginLeft: '4px',
    },
    input: {
        padding: '12px 15px',
        border: '1px solid #ccc',
        borderRadius: '6px',
        fontSize: '1rem',
        transition: 'border-color 0.3s, box-shadow 0.3s',
    },
    errorInput: {
        borderColor: '#d9534f',
    },
    fieldError: {
        color: '#d9534f',
        fontSize: '0.875rem',
        marginTop: '5px',
    },
    messageBase: {
        padding: '15px',
        marginBottom: '20px',
        borderRadius: '6px',
        textAlign: 'center',
    },
    successMessage: {
        backgroundColor: '#d4edda',
        color: '#155724',
        border: '1px solid #c3e6cb',
    },
    errorMessage: {
        backgroundColor: '#f8d7da',
        color: '#721c24',
        border: '1px solid #f5c6cb',
    },
    actions: {
        marginTop: '10px',
    },
    submitButton: {
        width: '100%',
        padding: '15px',
        fontSize: '1.1rem',
        fontWeight: '700',
        color: '#fff',
        backgroundColor: '#007bff',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'background-color 0.3s, transform 0.2s',
    },
    submitButtonHover: {
        backgroundColor: '#0056b3',
        transform: 'translateY(-2px)',
    },
    submitButtonDisabled: {
        backgroundColor: '#a0c3e6',
        cursor: 'not-allowed',
        transform: 'none',
    },
};


const AddVolunteer = ({ fromLogin = false }) => {
	    const [formData, setFormData] = useState({
        user_name: '', user_phone_no: '', user_email: '', user_age: '', user_password: ''
    });
    const [fieldErrors, setFieldErrors] = useState({
        user_name: '', user_phone_no: '', user_email: '', user_age: '', user_password: '', otp: ''
    });
    const [showOtpField, setShowOtpField] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [otp, setOtp] = useState('');
    const [pendingUserId, setPendingUserId] = useState(null);
    const navigate = useNavigate();

    // --- STATE FOR INLINE STYLES ---
    const [isButtonHovered, setIsButtonHovered] = useState(false);
    const [isDesktopView, setIsDesktopView] = useState(window.innerWidth >= 600);

    // --- HOOK FOR RESPONSIVENESS ---
    useEffect(() => {
        const handleResize = () => setIsDesktopView(window.innerWidth >= 600);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

	    const validateField = (name, value) => {
        if (!value.trim()) return 'This field is required';
        switch (name) {
            case 'user_email': if (!/\S+@\S+\.\S+/.test(value)) return 'Please enter a valid email address'; break;
            case 'user_phone_no': if (!/^\d{10}$/.test(value)) return 'Phone number must be exactly 10 digits'; break;
            case 'user_age': const age = parseInt(value, 10); if (isNaN(age) || age < 18 || age > 100) return 'Age must be between 18 and 100'; break;
            case 'user_password': if (value.length < 6) return 'Password must be at least 6 characters long'; break;
            case 'otp': if (!/^\d{6}$/.test(value)) return 'OTP must be 6 digits'; break;
            default: break;
        }
        return '';
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setFieldErrors({ ...fieldErrors, [name]: '' });
    };

    const validateForm = () => {
        const newErrors = {};
        let isValid = true;
        for (const key in formData) {
            const error = validateField(key, formData[key]);
            if (error) {
                newErrors[key] = error;
                isValid = false;
            }
        }
        setFieldErrors(newErrors);
        return isValid;
    };



    const handleOtpVerification = async () => {
        if (validateField('otp', otp)) {
            setFieldErrors({ ...fieldErrors, otp: 'OTP must be 6 digits' });
            return;
        }
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            // CALL THE NEW ENDPOINT
            // Send phone_no instead of user_id
            await publicAxios.post('/api/auth/signup-verify-otp', {
                phone_no: formData.user_phone_no,
                otp: otp
            });

            setMessage('Account created successfully! Redirecting...');
            setTimeout(() => {
                navigate('/');
            }, 2000);

        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to verify OTP.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // --- MAIN FORM SUBMISSION HANDLER (UPDATED) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (showOtpField) {
            await handleOtpVerification();
            return;
        }

        if (!validateForm()) {
            setError('Please correct the errors before submitting.');
            return;
        }

        setIsLoading(true);

        // This component now has two distinct modes.
        if (fromLogin) {
            // MODE 1: User Signup Flow
            try {
                // CALL THE NEW ENDPOINT to send OTP
                await publicAxios.post('/api/auth/signup-send-otp', formData);
                
                // No user_id is returned, just proceed to show OTP field
                setMessage('OTP sent to your phone! Please enter it below.');
                setShowOtpField(true);

            } catch (err) {
                const errorMessage = err.response?.data?.message || 'An unexpected error occurred.';
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        } else {
            // MODE 2: Admin Adding a Volunteer Directly
            try {
                // This call remains, but it's now only for direct creation
                await privateAxios.post('/api/admin/add_volunteer?verifyOtp=false', formData);
                
                setMessage('Volunteer created successfully! Redirecting...');
                setTimeout(() => {
                    navigate('/get-volunteers');
                }, 2000);

            } catch (err) {
                const errorMessage = err.response?.data?.message || 'Failed to add volunteer.';
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        }
    };

	    const containerStyle = isDesktopView ? { ...styles.container, ...styles.containerDesktop } : styles.container;
    
    // Logic to determine the final button style based on its state
    let buttonStyle = styles.submitButton;
    if (isLoading) {
        buttonStyle = { ...buttonStyle, ...styles.submitButtonDisabled };
    } else if (isButtonHovered) {
        buttonStyle = { ...buttonStyle, ...styles.submitButtonHover };
    }


	    return (
        <div style={containerStyle}>
            <h2 style={styles.h2}>{fromLogin ? 'Create Your Account' : 'Add New Volunteer'}</h2>

            {message && <div style={{...styles.messageBase, ...styles.successMessage}}>{message}</div>}
            {error && <div style={{...styles.messageBase, ...styles.errorMessage}}>{error}</div>}

            <form onSubmit={handleSubmit} style={styles.form} noValidate>
                {!showOtpField && (
                    <>
                        <div style={styles.group}>
                            <label htmlFor="user_name" style={styles.label}>Username <span style={styles.required}>*</span></label>
                            <input
                                type="text" id="user_name" name="user_name" value={formData.user_name} onChange={handleChange} placeholder="Enter username"
                                style={fieldErrors.user_name ? { ...styles.input, ...styles.errorInput } : styles.input}
                            />
                            {fieldErrors.user_name && <div style={styles.fieldError}>{fieldErrors.user_name}</div>}
                        </div>

                        {/* ... other form fields ... */}
                        <div style={styles.group}>
                            <label htmlFor="user_email" style={styles.label}>Email <span style={styles.required}>*</span></label>
                            <input
                                type="email" id="user_email" name="user_email" value={formData.user_email} onChange={handleChange} placeholder="Enter email address"
                                style={fieldErrors.user_email ? { ...styles.input, ...styles.errorInput } : styles.input}
                            />
                            {fieldErrors.user_email && <div style={styles.fieldError}>{fieldErrors.user_email}</div>}
                        </div>

                        <div style={styles.group}>
                            <label htmlFor="user_phone_no" style={styles.label}>Phone Number <span style={styles.required}>*</span></label>
                            <input
                                type="tel" id="user_phone_no" name="user_phone_no" value={formData.user_phone_no} onChange={handleChange} placeholder="Enter 10-digit phone number" maxLength="10"
                                style={fieldErrors.user_phone_no ? { ...styles.input, ...styles.errorInput } : styles.input}
                            />
                            {fieldErrors.user_phone_no && <div style={styles.fieldError}>{fieldErrors.user_phone_no}</div>}
                        </div>

                        <div style={styles.group}>
                            <label htmlFor="user_age" style={styles.label}>Age <span style={styles.required}>*</span></label>
                            <input
                                type="number" id="user_age" name="user_age" value={formData.user_age} onChange={handleChange} min="18" max="100" placeholder="Enter age (18-100)"
                                style={fieldErrors.user_age ? { ...styles.input, ...styles.errorInput } : styles.input}
                            />
                            {fieldErrors.user_age && <div style={styles.fieldError}>{fieldErrors.user_age}</div>}
                        </div>

                        <div style={styles.group}>
                            <label htmlFor="user_password" style={styles.label}>Password <span style={styles.required}>*</span></label>
                            <input
                                type="password" id="user_password" name="user_password" value={formData.user_password} onChange={handleChange} placeholder="Enter password (min 6 characters)"
                                style={fieldErrors.user_password ? { ...styles.input, ...styles.errorInput } : styles.input}
                            />
                            {fieldErrors.user_password && <div style={styles.fieldError}>{fieldErrors.user_password}</div>}
                        </div>
                    </>
                )}

                {showOtpField && (
                    <div style={styles.group}>
                        <label htmlFor="otp" style={styles.label}>OTP <span style={styles.required}>*</span></label>
                        <input
                            type="text" id="otp" name="otp" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter 6-digit OTP" maxLength="6"
                            style={fieldErrors.otp ? { ...styles.input, ...styles.errorInput } : styles.input}
                        />
                        {fieldErrors.otp && <div style={styles.fieldError}>{fieldErrors.otp}</div>}
                    </div>
                )}

                <div style={styles.actions}>
                    <button
                        type="submit"
                        style={buttonStyle}
                        disabled={isLoading}
                        onMouseEnter={() => setIsButtonHovered(true)}
                        onMouseLeave={() => setIsButtonHovered(false)}
                    >
                        {isLoading
                            ? (showOtpField ? 'Verifying...' : 'Submitting...')
                            : (showOtpField ? 'Verify OTP' : (fromLogin ? 'Sign Up' : 'Add Volunteer'))}
                    </button>
                </div>
            </form>
        </div>
    );

};

export default AddVolunteer;
