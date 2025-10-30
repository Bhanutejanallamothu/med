const express = require('express');
const router = express.Router();
const Doctor = require('../models/doctorModel');
const PatientHistory = require('../models/patientHistoryModel');
const Patient = require('../models/patientModel');
const { logUserAction } = require('../utils/logger');
const Vitals = require('../models/vitalsModel');

// Fetch all doctors
router.get('/get_doctors', async (req, res) => {
  try {
    const doctors = await Doctor.find({doctor_availability: true}); // Fetch all doctors from the database
    
    // Log successful retrieval of available doctors
    if (req._user && req._user.id) {
      await logUserAction(
        req._user.id,
        `Retrieved list of available doctors (${doctors.length} doctors)`
      );
    }
    
    return res.status(200).json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return res.status(500).json({ message: 'Error fetching doctors' });
  }
});

// Assign a doctor to a patient
router.post('/', async (req, res) => {
  const { book_no, doc_name } = req.body;

  try {
    const doctor = await Doctor.findOne({ doctor_name: doc_name, doctor_availability: true });
    if (!doctor) {
      return res.status(404).send({ message: 'Doctor not found' });
    }

    const doc_id = doctor.doctor_id;
    const currentMonthYear = new Date().toISOString().slice(0, 7);

    let patientHistory = await PatientHistory.findOne({ book_no });

    // If patient history does not exist, show error.
    if (!patientHistory) {
      // const patient = await Patient.findOne({ book_no });
      // if (!patient) {
        return res.status(404).send({ message: 'Patient not found' });
      // }

      // patientHistory = new PatientHistory({
      //   book_no,
      //   visits: [
      //     {
      //       doctor_id: doc_id,
      //       timestamp: currentMonthYear,
      //       medicines_prescribed: [],
      //       medicines_given: [],
      //     },
      //   ],
      // });

      // await patientHistory.save();

      // if (req._user && req._user.id) {
      //   const logMessage = `Created new history and assigned doctor ${doc_name} (ID: ${doc_id}) to patient with book number ${book_no} for ${currentMonthYear}`;
      //   await logUserAction(req._user.id, logMessage);
      // }

      // return res.status(200).send({ message: 'Patient history created and doctor assigned successfully' });
    }

    const patient = await Patient.findOne({ book_no });
    if (!patient) {
      return res.status(404).send({ message: 'Patient not found' });  
    }

    const visitIndex = patientHistory.visits.findIndex(
      (visit) => visit.timestamp === currentMonthYear
    );

    if (visitIndex === -1) {
      return res.status(404).send({ message: 'Visit not found for the current month and year' });
    }


    const previousDoctorId = patientHistory.visits[visitIndex].doctor_id;

    patientHistory.visits[visitIndex].doctor_id = doc_id;
    await patientHistory.save();

    if (req._user && req._user.id) {
      let logMessage = `Assigned doctor ${doc_name} (ID: ${doc_id}) to patient with book number ${book_no} for ${currentMonthYear}`;
      if (previousDoctorId) {
        logMessage += ` (replacing doctor ID: ${previousDoctorId})`;
      }
      await logUserAction(req._user.id, logMessage);
    }

    return res.status(200).send({ message: 'Doctor assigned successfully' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(400).send({ message: error.message });
  }
});

module.exports = router;