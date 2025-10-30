const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const PatientHistory = require('../models/patientHistoryModel');
const Patient = require('../models/patientModel');
const Inventory = require('../models/inventoryModel');
const { logUserAction } = require('../utils/logger');

router.post('/doctor-prescription', async (req, res) => {
  try {
    const { book_no, prescriptions } = req.body;

        if (!book_no || !prescriptions || !Array.isArray(prescriptions)) {
      return res.status(400).json({ message: 'Invalid data provided' });
    }

    // Check if the patient exists
    const patient = await Patient.findOne({ book_no });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    const currentMonthYear = new Date().toISOString().slice(0, 7);

    // Check if patient history exists for the current timestamp
    const patientHistory = await PatientHistory.findOne({ book_no });
    if (!patientHistory) {
      return res.status(404).json({ message: 'Patient not registered.' });
    }

    // Check if a visit exists for the current timestamp
    const visit = patientHistory.visits.find(v => v.timestamp === currentMonthYear);
    if (!visit) {
      return res.status(404).json({ message: 'Patient not registered for the current month.' });
    }

    // Check if doctor_id is assigned for the current timestamp
    if (!visit.doctor_id) {
      return res.status(400).json({ message: 'Doctor not assigned.' });
    }

    // Add prescriptions to the visit
    visit.medicines_prescribed.push(...prescriptions);

    await patientHistory.save();

    // Log the prescription action
    if (req._user && req._user.id) {
      const medicinesSummary = prescriptions.map(med =>
        `${med.medicine_id} (Qty: ${med.quantity})`
      ).join(', ');

      await logUserAction(
        req._user.id,
        `Added prescription for patient (Book #${book_no}) - Medicines: ${medicinesSummary}`
      );
    }

    return res.status(200).json({ message: 'Prescription added successfully!' });
  } catch (error) {
    console.error('Error in doctor prescription route:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    });
  }
});

router.get('/medicine-pickup/:book_no', async (req, res) => {
  try {
    const { book_no } = req.params;
    const currentMonthYear = new Date().toISOString().slice(0, 7);

    const patientHistory = await PatientHistory.findOne({ book_no });

    if (!patientHistory) {
      return res.status(404).json({ message: 'No prescription found for this book number.' });
    }

    const visit = patientHistory.visits.find(visit => visit.timestamp === currentMonthYear);

    if (!visit || !Array.isArray(visit.medicines_prescribed) || visit.medicines_prescribed.length === 0) {
      return res.status(404).json({ message: 'No valid prescription data for this month.' });
    }

    const prescribedMedicineIds = visit.medicines_prescribed.map(med => med.medicine_id);

    const inventoryItems = await Inventory.find({
      medicine_id: { $in: prescribedMedicineIds }
    });

    const unpickedMedicines = visit.medicines_prescribed
      .filter(med => {
        return !visit.medicines_given.some(given => given.medicine_id === med.medicine_id);
      })
      .map(med => {
        const inventoryItem = inventoryItems.find(item => item.medicine_id === med.medicine_id);

        const batches = (inventoryItem?.medicine_details || []).map(batch => ({
          medicine_name: batch.medicine_name,
          expiry_date: batch.expiry_date,
          available_quantity: batch.quantity,
          quantity_taken: 0 // Placeholder for frontend input
        }));

        return {
          _id: med._id, // Include the MongoDB ObjectId for the prescription entry
          medicine_id: med.medicine_id,
          quantity: med.quantity,
          medicine_formulation: inventoryItem?.medicine_formulation || 'N/A',
          batches
        };
      });
      
    // Log the medicine pickup info retrieval
    if (req._user && req._user.id) {
      await logUserAction(
        req._user.id,
        `Retrieved medicine pickup information for patient (Book #${book_no}) - ${unpickedMedicines.length} unpicked medicine(s)`
      );
    }

    return res.status(200).json({ medicines_prescribed: unpickedMedicines });
  } catch (error) {
    console.error('Error fetching medicine pickup info:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.post('/medicine-pickup', async (req, res) => {
  try {
    const { book_no, medicinesGiven } = req.body;

    if (!book_no || !medicinesGiven || !Array.isArray(medicinesGiven)) {
      return res.status(400).json({ message: 'Invalid data provided' });
    }

    let patientHistory = await PatientHistory.findOne({ book_no });

    if (!patientHistory) {
      return res.status(404).json({ message: 'Patient history not found.' });
    }

    const currentMonthYear = new Date().toISOString().slice(0, 7);
    let visit = patientHistory.visits.find(visit => visit.timestamp === currentMonthYear);

    if (!visit) {
      return res.status(404).json({ message: 'No prescription found for this month.' });
    }

    // Create a list of medicine IDs to fetch from inventory
    const medicineIds = [...new Set(medicinesGiven.map(med => med.medicine_id))];
    
    // Fetch all inventory items for these medicines
    const inventoryItems = await Inventory.find({
      medicine_id: { $in: medicineIds }
    });

    let insufficientStock = [];

    // Check stock availability for each medicine
    for (let med of medicinesGiven) {
      const inventoryItem = inventoryItems.find(item => item.medicine_id === med.medicine_id);
      
      if (!inventoryItem) {
        insufficientStock.push(`Medicine ID: ${med.medicine_id}`);
        continue;
      }

      // Find the specific batch by comparing expiry date and name
      const batchDetail = inventoryItem.medicine_details.find(
        detail => 
          new Date(detail.expiry_date).toDateString() === new Date(med.expiry_date).toDateString()
      );

      if (!batchDetail) {
        insufficientStock.push(`Medicine ID: ${med.medicine_id} (Batch not found)`);
        continue;
      }

      if (batchDetail.quantity < med.quantity) {
        insufficientStock.push(`${med.medicine_name} (Available: ${batchDetail.quantity}, Requested: ${med.quantity})`);
      }
    }

    if (insufficientStock.length > 0) {
      return res.status(400).json({
        message: 'Not enough stock for the following medicines',
        insufficientStock
      });
    }

    // Create a list of medicine details for logging
    const medicineDetails = medicinesGiven.map(med => {
      const inventoryItem = inventoryItems.find(item => item.medicine_id === med.medicine_id);
      return {
        name: inventoryItem?.medicine_formulation || med.medicine_id,
        id: med.medicine_id,
        quantity: med.quantity,
        expiry: new Date(med.expiry_date).toISOString().split('T')[0]
      };
    });

    const updatedMedicineQuantities = [];

    // Update inventory
    for (let med of medicinesGiven) {
      const inventoryItem = inventoryItems.find(item => item.medicine_id === med.medicine_id);
      
      if (!inventoryItem) {
        // This case should ideally be caught by insufficientStock check, but for safety
        continue;
      }

      const beforeQuantity = inventoryItem.total_quantity;

      // Find the specific batch
      const batchDetail = inventoryItem.medicine_details.find(
        detail => 
          new Date(detail.expiry_date).toDateString() === new Date(med.expiry_date).toDateString()
      );

      if (!batchDetail) {
        // This case should ideally be caught by insufficientStock check, but for safety
        continue;
      }

      // Update batch quantity
      batchDetail.quantity -= med.quantity;
      
      // Update total quantity for the medicine
      inventoryItem.total_quantity -= med.quantity;
      
      await inventoryItem.save();

      const afterQuantity = inventoryItem.total_quantity;

      updatedMedicineQuantities.push({
        medicine_id: med.medicine_id,
        before_quantity: beforeQuantity,
        after_quantity: afterQuantity,
        picked_up_quantity: med.quantity
      });
    }

    // Update patient history with given medicines
    const formattedMedicinesGiven = medicinesGiven.map(med => ({
      medicine_id: String(med.medicine_id),
      quantity: Number(med.quantity)
    }));

    visit.medicines_given.push(...formattedMedicinesGiven);
    await patientHistory.save();
    
    // Log the medicine dispensing action
    if (req._user && req._user.id) {
      const medicinesSummary = medicineDetails.map(med => 
        `(ID: ${med.id}, Qty: ${med.quantity}, Exp: ${med.expiry})`
      ).join(', ');
      
      await logUserAction(
        req._user.id,
        `Dispensed medicines to patient (Book #${book_no}) - ${medicinesGiven.length} medicine(s): ${medicinesSummary}`
      );
    }

    return res.status(200).json({ 
      message: 'Medicine pickup confirmed, inventory updated, and patient history preserved!',
      updated_quantities: updatedMedicineQuantities
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Internal Server error', error: error.message });
  }
});

router.get('/medicine-verification/:book_no', async (req, res) => {
  try {
    const { book_no } = req.params;
    const currentMonthYear = new Date().toISOString().slice(0, 7);

    const patientHistory = await PatientHistory.findOne({ book_no });

    if (!patientHistory) {
      return res.status(404).json({ message: 'No patient history found.' });
    }

    let visit = patientHistory.visits.find(visit => visit.timestamp === currentMonthYear);
    if (!visit) {
      return res.status(404).json({ message: 'No records found for this month.' });
    }
    
    // Log the verification check
    if (req._user && req._user.id) {
      await logUserAction(
        req._user.id,
        `Verified medicine dispensing for patient (Book #${book_no}) - ${prescribedCount} prescribed, ${dispensedCount} dispensed`
      );
    }

    return res.status(200).json({
      medicines_prescribed: visit.medicines_prescribed,
      medicines_given: visit.medicines_given
    });
  } catch (error) {
    console.error('Error fetching verification data:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:book_no/prescription/:medicine_id', async (req, res) => {
  try {
    const { book_no, medicine_id } = req.params;
    const { new_quantity } = req.body;
    const currentMonthYear = new Date().toISOString().slice(0, 7);

    if (!mongoose.Types.ObjectId.isValid(medicine_id)) {
      return res.status(400).json({ message: 'Invalid medicine ID format.' });
    }
    if (typeof new_quantity !== 'number' || new_quantity < 0) {
      return res.status(400).json({ message: 'Invalid quantity provided.' });
    }

    const updatedPatientHistory = await PatientHistory.findOneAndUpdate(
      {
        book_no: book_no,
        'visits.timestamp': currentMonthYear,
        'visits.medicines_prescribed._id': new mongoose.Types.ObjectId(medicine_id),
      },
      {
        $set: {
          'visits.$.medicines_prescribed.$[elem].quantity': new_quantity,
        },
      },
      {
        new: true,
        arrayFilters: [{ 'elem._id': new mongoose.Types.ObjectId(medicine_id) }],
      }
    );

    if (!updatedPatientHistory) {
      return res.status(404).json({ message: 'Patient history, visit, or medicine not found.' });
    }

    // Log the prescription update action
    if (req._user && req._user.id) {
      await logUserAction(
        req._user.id,
        `Updated prescribed quantity for medicine (ID: ${medicine_id}) to ${new_quantity} for patient (Book #${book_no})`
      );
    }

    return res.status(200).json({ message: 'Prescribed quantity updated successfully!' });
  } catch (error) {
    console.error('Error updating prescribed quantity:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        fullError: String(error) // Add full string representation of error
      }
    });
  }
});
// Add a new visit with status ("new" or "old")
router.post('/:book_no/add-visit', async (req, res) => {
  try {
    const { book_no } = req.params;
    const { doctor_id } = req.body;

    if (!doctor_id) {
      return res.status(400).json({ message: 'Doctor ID is required' });
    }

    const patientHistory = await PatientHistory.findOne({ book_no });
    if (!patientHistory) {
      return res.status(404).json({ message: 'Patient history not found' });
    }

    const newVisit = {
      doctor_id,
      timestamp: new Date().toISOString().slice(0, 7), // YYYY-MM
      medicines_prescribed: [],
      medicines_given: [],
      status: patientHistory.visits.length === 0 ? "new" : "old"
    };

    patientHistory.visits.push(newVisit);
    await patientHistory.save();

    if (req._user && req._user.id) {
      await logUserAction(
        req._user.id,
        `Created a new visit for patient (Book #${book_no}) - Status: ${newVisit.status}`
      );
    }

    return res.status(201).json({ message: 'Visit added successfully', visit: newVisit });
  } catch (error) {
    console.error('Error adding new visit:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:book_no/prescription/:medicine_id', async (req, res) => {
  try {
    const { book_no, medicine_id } = req.params;
    const currentMonthYear = new Date().toISOString().slice(0, 7);

    if (!mongoose.Types.ObjectId.isValid(medicine_id)) {
      return res.status(400).json({ message: 'Invalid medicine ID format.' });
    }

    const updatedPatientHistory = await PatientHistory.findOneAndUpdate(
      {
        book_no: book_no,
        'visits.timestamp': currentMonthYear,
      },
      {
        $pull: {
          'visits.$.medicines_prescribed': { _id: new mongoose.Types.ObjectId(medicine_id) },
        },
      },
      {
        new: true,
      }
    );

    if (!updatedPatientHistory) {
      return res.status(404).json({ message: 'Patient history, visit, or medicine not found.' });
    }

    // Log the prescription deletion action
    if (req._user && req._user.id) {
      await logUserAction(
        req._user.id,
        `Deleted prescribed medicine (ID: ${medicine_id}) for patient (Book #${book_no})`
      );
    }

    return res.status(200).json({ message: 'Prescribed medicine deleted successfully!' });
  } catch (error) {
    console.error('Error deleting prescribed medicine:', error);
    return res.status(500).json({
      message: 'Server error',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        fullError: String(error)
      }
    });
  }
});

router.post('/counselling', async (req, res) => {
  try {
    const { book_no } = req.body;

    if (!book_no) {
      return res.status(400).json({ message: 'Book number is required.' });
    }

    const currentMonthYear = new Date().toISOString().slice(0, 7);

    const patientHistory = await PatientHistory.findOneAndUpdate(
      {
        book_no: book_no,
        'visits.timestamp': currentMonthYear,
      },
      {
        $set: { 'visits.$.counselling': true },
      },
      { new: true }
    );

    if (!patientHistory) {
      return res.status(404).json({ message: 'Patient history or current month visit not found for this book number.' });
    }

    // Log the counselling update action
    if (req._user && req._user.id) {
      await logUserAction(
        req._user.id,
        `Counselling status updated to true for patient (Book #${book_no}) for current month visit`
      );
    }

    return res.status(200).json({ message: 'Counselling status updated successfully!', patientHistory });
  } catch (error) {
    console.error('Error updating counselling status:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
