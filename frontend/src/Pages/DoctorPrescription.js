import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Styles/DoctorPrescription.css';
import { privateAxios } from '../api/axios';

function DoctorPrescription() {
  const navigate = useNavigate();
  const [bookNo, setBookNo] = useState('');
  const [prescriptions, setPrescriptions] = useState([
    { medicine_id: '', days: 0, morning: false, afternoon: false, night: false, quantity: 0, isMedicine: true }
  ]);
  const [medicineDetails, setMedicineDetails] = useState([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const debounceTimeout = useRef(null);

  const handlePrescriptionChange = async (index, field, value) => {
    const updatedPrescriptions = prescriptions.map((prescription, i) => {
      if (i === index) {
        const updated = { ...prescription, [field]: value };

        // Only calculate quantity for medicine items (not non-medicine items)
        if (updated.isMedicine && field !== 'quantity') {
          const trueCount =
            (updated.morning ? 1 : 0) +
            (updated.afternoon ? 1 : 0) +
            (updated.night ? 1 : 0);
          updated.quantity = updated.days * trueCount;
        }

        return updated;
      }
      return prescription;
    });

    setPrescriptions(updatedPrescriptions);

    // Fetch medicine info when ID changes (for both medicine and non-medicine items)
    if (field === 'medicine_id') {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      if (value !== '') {
        debounceTimeout.current = setTimeout(async () => {
          try {
            setIsLoading(true); // Set loading to true while fetching medicine details
            const response = await privateAxios.get(`/api/inventory/${value}`);
            const detailsCopy = [...medicineDetails];
            detailsCopy[index] = response.data;
            setMedicineDetails(detailsCopy);
          } catch (err) {
            const detailsCopy = [...medicineDetails];
            detailsCopy[index] = { error: 'Item not found' };
            setMedicineDetails(detailsCopy);
          } finally {
            setIsLoading(false); // Set loading back to false after fetching
          }
        }, 500); // Debounce for 500ms
      } else {
        // Clear medicine details if medicine_id is empty
        const detailsCopy = [...medicineDetails];
        detailsCopy[index] = null;
        setMedicineDetails(detailsCopy);
      }
    }
  };

  const handlePrescriptionTypeChange = (index, isMedicine) => {
    const updatedPrescriptions = prescriptions.map((prescription, i) => {
      if (i === index) {
        // Reset fields based on type
        if (isMedicine) {
          return {
            ...prescription,
            isMedicine: true,
            medicine_id: '',
            days: 0,
            morning: false,
            afternoon: false,
            night: false,
            quantity: 0
          };
        } else {
          return {
            ...prescription,
            isMedicine: false,
            medicine_id: '',
            quantity: 0,
            // Don't need these for non-medicine items
            days: 0,
            morning: false,
            afternoon: false,
            night: false
          };
        }
      }
      return prescription;
    });

    // Clear medicine details for this row
    const updatedMedicineDetails = [...medicineDetails];
    updatedMedicineDetails[index] = null;

    setPrescriptions(updatedPrescriptions);
    setMedicineDetails(updatedMedicineDetails);
  };

  const addPrescriptionRow = () => {
    setPrescriptions([
      ...prescriptions,
      { medicine_id: '', days: 0, morning: false, afternoon: false, night: false, quantity: 0, isMedicine: true }
    ]);
    setMedicineDetails([...medicineDetails, null]);
  };

  const removePrescriptionRow = (index) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
    setMedicineDetails(medicineDetails.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Set loading to true when submitting starts

    // Format the prescriptions for the backend
    const formattedPrescriptions = prescriptions.map(p => {
      if (p.isMedicine) {
        return {
          medicine_id: p.medicine_id.toString(),
          dosage_schedule: {
            days: Number(p.days),
            morning: p.morning,
            afternoon: p.afternoon,
            night: p.night,
          },
          quantity: p.quantity,
        };
      } else {
        return {
          medicine_id: p.medicine_id || "NON-MED", // Special identifier for non-medicines
          quantity: Number(p.quantity),
          is_medicine: false
        };
      }
    });

    const payload = {
      book_no: bookNo,
      prescriptions: formattedPrescriptions
    };

    try {
      const response = await privateAxios.post(
        `/api/patient-history/doctor-prescription`,
        payload
      );
      if (response.status >= 200 && response.status < 300) {
        setMessage('Prescription submitted successfully!');
        setBookNo('');
        setPrescriptions([
          { medicine_id: '', days: 0, morning: false, afternoon: false, night: false, quantity: 0, isMedicine: true }
        ]);
        setMedicineDetails([]);
      } else {
        setMessage('Failed to submit prescription.');
      }
    } catch (error) {
      setMessage('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false); // Set loading back to false after submission
    }
  };

  return (
    <div className="doctor-prescription-container">
      <div className="doctor-prescription-card">
        <h1 className="doctor-prescription-title">Doctor Prescription</h1>
        <form onSubmit={handleSubmit} className="doctor-prescription-form">
          <div className="doctor-prescription-form-group">
            <label>Book No</label>
            <input
              type="text"
              value={bookNo}
              onChange={(e) => setBookNo(e.target.value)}
              required
              placeholder="Enter Book No"
              disabled={isLoading} // Disable input while loading
            />
          </div>
          <h3 className="doctor-prescription-subheading">Medicines</h3>
          {prescriptions.map((prescription, index) => (
            <div key={index} className="doctor-prescription-row">
              <div className="prescription-type-toggle">
                <div className={`toggle-option ${prescription.isMedicine ? 'active' : ''}`}
                  onClick={() => handlePrescriptionTypeChange(index, true)}>
                  By Dosing Schedule
                </div>
                <div className={`toggle-option ${!prescription.isMedicine ? 'active' : ''}`}
                  onClick={() => handlePrescriptionTypeChange(index, false)}>
                  By Quantity
                </div>
              </div>

              <div className="doctor-prescription-form-group">
                <label>Medicine ID</label>
                <input
                  type="text"
                  value={prescription.medicine_id}
                  onChange={(e) =>
                    handlePrescriptionChange(index, 'medicine_id', e.target.value)
                  }
                  required
                  placeholder="e.g. 101"
                />
                {medicineDetails[index] && (
                  <div className="doctor-prescription-medicine-info">
                    {medicineDetails[index].error ? (
                      <p style={{ color: 'red' }}>{medicineDetails[index].error}</p>
                    ) : (
                      <>
                        <p><strong>{prescription.isMedicine ? "Formulation" : "Item"}:</strong> {medicineDetails[index].medicine_formulation}</p>
                        <p><strong>Available Stock:</strong> {medicineDetails[index].total_quantity}</p> {/* Display total_quantity */}
                        <ul>
                          {medicineDetails[index].details && medicineDetails[index].details.map((med, i) => (
                            <li key={i}>
                              Qty: {med.quantity} — Exp: {new Date(med.expiry_date).toLocaleDateString()}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}
              </div>

              {prescription.isMedicine ? (
                <>
                  <div className="doctor-prescription-form-group">
                    <label>Days</label>
                    <input
                      type="number"
                      value={prescription.days === 0 ? '' : prescription.days}
                      onChange={(e) =>
                        handlePrescriptionChange(index, 'days', Number(e.target.value))
                      }
                      required
                      placeholder="e.g. 3"
                      disabled={isLoading} // Disable input while loading
                    />
                  </div>

                  <div className="doctor-prescription-form-group doctor-prescription-checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={prescription.morning}
                        onChange={(e) =>
                          handlePrescriptionChange(index, 'morning', e.target.checked)
                        }
                        disabled={isLoading} // Disable checkbox while loading
                      />
                      Morning
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={prescription.afternoon}
                        onChange={(e) =>
                          handlePrescriptionChange(index, 'afternoon', e.target.checked)
                        }
                        disabled={isLoading} // Disable checkbox while loading
                      />
                      Afternoon
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={prescription.night}
                        onChange={(e) =>
                          handlePrescriptionChange(index, 'night', e.target.checked)
                        }
                        disabled={isLoading} // Disable checkbox while loading
                      />
                      Night
                    </label>
                  </div>

                  <div className="doctor-prescription-form-group">
                    <strong>Calculated Quantity:</strong> {prescription.quantity}
                  </div>
                </>
              ) : (
                <div className="doctor-prescription-form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    value={prescription.quantity === 0 ? '' : prescription.quantity}
                    onChange={(e) =>
                      handlePrescriptionChange(index, 'quantity', Number(e.target.value))
                    }
                    required
                    placeholder="Enter quantity"
                    min="1"
                    disabled={isLoading} // Disable input while loading
                  />
                </div>
              )}

              <button
                type="button"
                className="doctor-prescription-remove-btn"
                onClick={() => removePrescriptionRow(index)}
                disabled={isLoading} // Disable button while loading
              >
                Remove
              </button>
            </div>
          ))}

          <div className="doctor-prescription-btn-container">
            <button
              type="button"
              className="doctor-prescription-add-btn"
              onClick={addPrescriptionRow}
              disabled={isLoading} // Disable button while loading
            >
              Add Item
            </button>
          </div>

          <div className="doctor-prescription-btn-container">
            <button
              type="submit"
              className="doctor-prescription-submit-btn"
              disabled={isLoading} // Disable button while loading
            >
              {isLoading ? 'Submitting...' : 'Submit Prescription'} {/* Show loading text */}
            </button>
          </div>
        </form>
      </div>
      {message && (
        <div className="doctor-prescription-popup-overlay">
          <div className="doctor-prescription-popup">
            <p>{message}</p>
            <button className="doctor-prescription-close-popup" onClick={() => setMessage('')}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorPrescription;
