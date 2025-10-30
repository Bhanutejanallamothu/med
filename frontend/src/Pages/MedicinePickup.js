import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
import { privateAxios } from '../api/axios';
import '../Styles/MedicinePickup.css';

function MedicinePickup() {
  const navigate = useNavigate();
  const [bookNo, setBookNo] = useState('');
  const [prescribedMeds, setPrescribedMeds] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const [editingMedIndex, setEditingMedIndex] = useState(null); // State to track which medicine is being edited
  const [editedQuantity, setEditedQuantity] = useState(0); // State to hold the edited quantity


  const handleFetchPrescription = async () => {
    setError('');
    setMessage('');
    setPrescribedMeds([]);

    if (!bookNo) {
      setError('Please enter a valid Book No.');
      return;
    }

    setIsLoading(true); // Set loading to true when fetching starts
    try {
      const response = await privateAxios.get(
        `/api/patient-history/medicine-pickup/${bookNo}`
      );

      console.log(response.data);

      if (!response.data.medicines_prescribed || response.data.medicines_prescribed.length === 0) {
        setError('No medicines found for this patient.');
        return;
      }

      // Add quantity_taken field to each batch, pre-filling with prescribed quantity
      const medsWithInput = response.data.medicines_prescribed.map((med) => ({
        ...med,
        batches: med.batches.map((batch) => ({
          ...batch,
          quantity_taken: parseInt(med.quantity) // Pre-fill with prescribed quantity
        }))
      }));

      setPrescribedMeds(medsWithInput);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch prescription.');
    } finally {
      setIsLoading(false); // Set loading back to false after fetching
    }
  };

  const handleQuantityChange = (medIndex, batchIndex, value) => {
    setPrescribedMeds(prevMeds =>
      prevMeds.map((med, i) => {
        if (i === medIndex) {
          const updatedBatches = med.batches.map((batch, j) => {
            if (j === batchIndex) {
              return { ...batch, quantity_taken: value === '' ? '' : Math.max(0, parseInt(value)) };
            }
            return batch;
          });
          return { ...med, batches: updatedBatches };
        }
        return med;
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // If currently editing a prescribed medicine quantity, prevent the main form submission
    if (editingMedIndex !== null) {
      // Optionally, you could trigger handleSavePrescribedQuantity here,
      // but for now, we'll just prevent the main form submission.
      return;
    }

    setError('');
    setMessage('');

    // Check if quantities match prescribed amounts
    const quantityMismatch = prescribedMeds.filter(med => {
      const totalGiven = med.batches.reduce((sum, batch) => 
        sum + (parseInt(batch.quantity_taken) || 0), 0);
      return totalGiven !== parseInt(med.quantity);
    });

    if (quantityMismatch.length > 0) {
      const mismatchItems = quantityMismatch.map(med => 
        `${med.medicine_id} (Prescribed: ${med.quantity}, Given: ${med.batches.reduce((sum, batch) => 
          sum + (parseInt(batch.quantity_taken) || 0), 0)})`
      ).join(', ');
      
      setError(`Quantity mismatch for medicine(s): ${mismatchItems}. Please ensure the total quantity given matches the prescribed amount.`);
      return;
    }

    const medicinesGiven = [];

    prescribedMeds.forEach((med) => {
      med.batches.forEach((batch) => {
        if (batch.quantity_taken > 0) {
          medicinesGiven.push({
            medicine_id: med.medicine_id,
            expiry_date: batch.expiry_date,
            quantity: batch.quantity_taken
          });
        }
      });
    });

    if (medicinesGiven.length === 0) {
      setError('No medicines were selected as given.');
      return;
    }

    setIsLoading(true); // Set loading to true when submitting starts
    try {
      const response = await privateAxios.post(
        '/api/patient-history/medicine-pickup',
        {
          book_no: bookNo,
          medicinesGiven
        }
      );

      let successMessage = response.data.message || 'Medicines given updated successfully!';
      if (response.data.updated_quantities && response.data.updated_quantities.length > 0) {
        successMessage += '\n\nInventory Updates:';
        response.data.updated_quantities.forEach(item => {
          successMessage += `\n- Medicine ID: ${item.medicine_id}, Picked Up: ${item.picked_up_quantity}, Before: ${item.before_quantity}, After: ${item.after_quantity}`;
        });
      }
      setMessage(successMessage);
      setPrescribedMeds([]); // Show verification component after successful submission
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update medicines given.');
    } finally {
      setIsLoading(false); // Set loading back to false after submission
    }
  };

  const handleDeletePrescribedMedicine = async (prescriptionId) => {
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await privateAxios.delete(
        `/api/patient-history/${bookNo}/prescription/${prescriptionId}`
      );

      if (response.status === 200) {
        setMessage('Prescribed medicine deleted successfully!');
        setPrescribedMeds(prevMeds =>
          prevMeds.filter(med => med._id !== prescriptionId)
        );
      } else {
        setError(response.data.message || 'Failed to delete prescribed medicine.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete prescribed medicine.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPrescribedQuantity = (index, currentQuantity) => {
    setEditingMedIndex(index);
    setEditedQuantity(currentQuantity);
  };

  const handleCancelEdit = () => {
    setEditingMedIndex(null);
    setEditedQuantity(0);
  };

  const handleSavePrescribedQuantity = async (prescriptionId, newQuantity) => {
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await privateAxios.put(
        `/api/patient-history/${bookNo}/prescription/${prescriptionId}`,
        { new_quantity: newQuantity }
      );

      if (response.status === 200) {
        setMessage('Prescribed quantity updated successfully!');
        setPrescribedMeds(prevMeds =>
          prevMeds.map(med =>
            med._id === prescriptionId ? { ...med, quantity: newQuantity } : med
          )
        );
        handleCancelEdit(); // Exit edit mode
      } else {
        setError(response.data.message || 'Failed to update prescribed quantity.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update prescribed quantity.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="medicine-pickup-container">
      <div className="medicine-pickup-card">
        <h1 className="medicine-pickup-title">Medicine Pickup</h1>

        <div className="medicine-pickup-form-group">
          <label>Book No</label>
          <input
            type="text"
            value={bookNo}
            onChange={(e) => setBookNo(e.target.value)}
            required
            placeholder="Enter Book No"
                            disabled={isLoading || editingMedIndex !== null} // Disable input while loading or when editing prescribed quantity
          />
        </div>

        <div className="medicine-pickup-btn-container">
          <button
            type="button"
            className="medicine-pickup-fetch-btn"
            onClick={handleFetchPrescription}
            disabled={isLoading} // Disable button while loading
          >
            {isLoading ? 'Fetching...' : 'Fetch Prescription'} {/* Show loading text */}
          </button>
        </div>

        {prescribedMeds.length > 0 && (
          <form onSubmit={handleSubmit} className="medicine-pickup-form">
            <h3 className="medicine-pickup-subheading">Prescribed Medicines</h3>

            {prescribedMeds.map((med, medIndex) => {
              const totalGiven = med.batches.reduce(
                (sum, batch) => sum + (parseInt(batch.quantity_taken) || 0), 
                0
              );
              
              return (
                <div key={medIndex} className="medicine-block">
                  <div className="medicine-header">
                    <div className="medicine-id">{med.medicine_id}</div>
                    <div className="medicine-details">
                      <p>
                        <strong>Prescribed Quantity:</strong>{' '}
                        {editingMedIndex === medIndex ? (
                          <input
                            type="number"
                            min="0"
                            value={editedQuantity}
                            onChange={(e) => {
                              const value = e.target.value;
                              setEditedQuantity(value === '' ? '' : parseInt(value));
                            }}
                            disabled={isLoading}
                          />
                        ) : (
                          med.quantity
                        )}
                        <span style={{ marginLeft: '10px', color: totalGiven === parseInt(med.quantity) ? 'green' : 'red' }}>
                          (Given: {totalGiven})
                        </span>
                        {editingMedIndex === medIndex ? (
                          <>
                            <button type="button" onClick={() => handleSavePrescribedQuantity(med._id, parseInt(editedQuantity) || 0)} disabled={isLoading}>Save</button>
                            <button type="button" onClick={handleCancelEdit} disabled={isLoading}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button type="button" onClick={() => handleEditPrescribedQuantity(medIndex, med.quantity)} disabled={isLoading}>Edit</button>
                            <button type="button" onClick={() => handleDeletePrescribedMedicine(med._id)} disabled={isLoading} className="delete-button">Delete</button>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="batches-row">
                    {med.batches.map((batch, batchIndex) => (
                      <div key={batchIndex} className="batch-card">
                        <p><strong>Formulation:</strong> {med.medicine_formulation}</p>
                        <p><strong>Expiry:</strong> {new Date(batch.expiry_date).toLocaleDateString()}</p>
                        <p><strong>Available:</strong> {batch.available_quantity}</p>
                        <label>
                          <strong>Quantity to Give:</strong>
                          <input
                            type="number"
                            min="0"
                            max={batch.available_quantity}
                            value={batch.quantity_taken} // Always show the value
                            onChange={(e) =>
                              handleQuantityChange(medIndex, batchIndex, e.target.value)
                            }
                            disabled={isLoading} // Disable input while loading
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="medicine-pickup-btn-container">
              <button 
                type="submit" 
                className="medicine-pickup-submit-btn"
                disabled={isLoading} // Disable button while loading
              >
                {isLoading ? 'Submitting...' : 'Confirm Pickup'} {/* Show loading text */}
              </button>
            </div>
          </form>
        )}
      </div>

      {message && (
        <div className="medicine-pickup-popup-overlay">
          <div className="medicine-pickup-popup">
            <p>{message}</p>
            <button className="medicine-pickup-close-popup" onClick={() => setMessage('')}>
              Close
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="medicine-pickup-popup-overlay">
          <div className="medicine-pickup-popup">
            <p>{error}</p>
            <button className="medicine-pickup-close-popup" onClick={() => setError('')}>
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default MedicinePickup;
