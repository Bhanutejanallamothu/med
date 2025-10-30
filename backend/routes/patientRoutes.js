const express = require('express');
const router = express.Router();
const Patient = require('../models/patientModel');
const PatientHistory = require('../models/patientHistoryModel');
const { logUserAction } = require('../utils/logger');

// ✅ AREA AUTOCOMPLETE ROUTE
router.get('/patient-areas', async (req, res) => {
  try {
    const search = req.query.q?.trim() || '';

    // If query too short, return empty
    if (search.length < 3) {
      return res.json([]);
    }

    // 🔹 Find distinct areas using case-insensitive regex
    const areas = await Patient.distinct('patient_area', {
      patient_area: { $regex: new RegExp(search, 'i') },
    });

    // 🔹 Sort alphabetically and limit to 10
    const limited = areas
      .filter(a => a && a.trim() !== '')
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 10);

    return res.json(limited);
  } catch (err) {
    console.error('❌ Error fetching patient areas:', err);
    return res.status(500).json({ error: 'Server error fetching areas' });
  }
});

// ✅ GET route to fetch patient data by book number
router.get('/:book_no', async (req, res) => {
  const { book_no } = req.params;

  if (isNaN(book_no) || book_no <= 0) {
    return res.status(400).send({ message: 'Invalid book number' });
  }

  try {
    const patient = await Patient.findOne({ book_no });
    if (patient) {
      if (req._user && req._user.id) {
        await logUserAction(
          req._user.id,
          `Retrieved patient details for Book #${book_no} (${patient.patient_name})`
        );
      }
      return res.status(200).send(patient);
    } else {
      return res.status(404).send({ message: 'Patient not found' });
    }
  } catch (error) {
    console.error('Error fetching patient data:', error);
    return res.status(500).send({ message: 'Server error' });
  }
});

// ✅ POST route for patient registration / update
router.post('/', async (req, res) => {
  const {
    book_no,
    patient_name,
    patient_age,
    patient_sex,
    patient_phone_no,
    patient_area,
    eid,
  } = req.body;

  console.log('📥 Received data:', req.body);
  try {
    const existingPatient = await Patient.findOne({ book_no });

    if (existingPatient) {
      const originalValues = {
        patient_name: existingPatient.patient_name,
        patient_age: existingPatient.patient_age,
        patient_sex: existingPatient.patient_sex,
        patient_phone_no: existingPatient.patient_phone_no,
        patient_area: existingPatient.patient_area,
      };

      // Update fields
      existingPatient.patient_name = patient_name || existingPatient.patient_name;
      existingPatient.patient_age = patient_age || existingPatient.patient_age;
      existingPatient.patient_sex = patient_sex || existingPatient.patient_sex;
      existingPatient.patient_phone_no = patient_phone_no || existingPatient.patient_phone_no;
      existingPatient.patient_area = patient_area || existingPatient.patient_area;

      await existingPatient.save();

      // Track changes
      const changesDescription = [];
      if (originalValues.patient_name !== existingPatient.patient_name)
        changesDescription.push(`name from "${originalValues.patient_name}" to "${existingPatient.patient_name}"`);
      if (originalValues.patient_age !== existingPatient.patient_age)
        changesDescription.push(`age from "${originalValues.patient_age}" to "${existingPatient.patient_age}"`);
      if (originalValues.patient_sex !== existingPatient.patient_sex)
        changesDescription.push(`sex from "${originalValues.patient_sex}" to "${existingPatient.patient_sex}"`);
      if (originalValues.patient_phone_no !== existingPatient.patient_phone_no)
        changesDescription.push(`phone from "${originalValues.patient_phone_no}" to "${existingPatient.patient_phone_no}"`);
      if (originalValues.patient_area !== existingPatient.patient_area)
        changesDescription.push(`area from "${originalValues.patient_area}" to "${existingPatient.patient_area}"`);

      // Add visit
      const patientHistory = await PatientHistory.findOne({ book_no });
      const currentMonthYear = new Date().toISOString().slice(0, 7);
      let isNewVisit = false;

      if (patientHistory) {
        const existingVisit = patientHistory.visits.some(
          visit => visit.timestamp === currentMonthYear
        );

        if (!existingVisit) {
          isNewVisit = true;
          patientHistory.visits.push({ timestamp: currentMonthYear });
          await patientHistory.save();
        }
      } else {
        isNewVisit = true;
        const newPatientHistory = new PatientHistory({
          patientId: existingPatient._id,
          book_no,
          visits: [{ timestamp: currentMonthYear }],
        });
        await newPatientHistory.save();
      }

      if (req._user && req._user.id) {
        let logMessage = `Updated existing patient: Book #${book_no} (${existingPatient.patient_name})`;
        if (changesDescription.length > 0) {
          logMessage += ` - Changed: ${changesDescription.join(', ')}`;
        } else {
          logMessage += ' - No fields changed';
        }
        if (isNewVisit) {
          logMessage += ` - Recorded new visit for ${currentMonthYear}`;
        }
        await logUserAction(req._user.id, logMessage);
      }

      return res.status(200).json({
        message: 'Patient data updated successfully and visit recorded',
        redirect: true,
      });
    } else {
      const newPatient = new Patient({
        book_no,
        patient_name,
        patient_age,
        patient_sex,
        patient_phone_no,
        patient_area,
      });
      await newPatient.save();

      const currentMonthYear = new Date().toISOString().slice(0, 7);
      const newPatientHistory = new PatientHistory({
        patientId: newPatient._id,
        book_no,
        visits: [{ timestamp: currentMonthYear }],
      });
      await newPatientHistory.save();

      if (req._user && req._user.id) {
        await logUserAction(
          req._user.id,
          `Registered new patient: Book #${book_no}, Name: ${patient_name}, Age: ${patient_age}, Sex: ${patient_sex}, Area: ${patient_area} - First visit recorded for ${currentMonthYear}`
        );
      }

      return res.status(201).json({
        message: 'New patient registered successfully and visit recorded',
        redirect: true,
      });
    }
  } catch (error) {
    console.error('Error saving patient data:', error);
    return res.status(500).send({ message: 'Server error' });
  }
});

module.exports = router;
