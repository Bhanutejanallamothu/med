const express = require('express');
const router = express.Router();
const Vitals = require('../models/vitalsModel');
const Patient = require('../models/patientModel');
const PatientHistory = require('../models/patientHistoryModel');
const { logUserAction } = require('../utils/logger');

router.post('/', async (req, res) => {
  const { book_no, rbs, bp, height, weight, pulse, extra_note } = req.body;
  console.log('Received data:', req.body);

  const currentMonthYear = new Date().toISOString().slice(0, 7);

  try {
    // Check if the patient exists in the Patient database
    const patient = await Patient.findOne({ book_no });
    if (!patient) {
      return res.status(404).send({ message: 'Patient not found in the database' });
    }

    // Check if the patient history exists for the same book_no and timestamp
    const patientHistory = await PatientHistory.findOne({
      book_no,
      visits: { $elemMatch: { timestamp: currentMonthYear } },
    });
    if (!patientHistory) {
      return res.status(404).send({ message: 'Patient history not found for the current month and year' });
    }

    // Check if all fields are empty
    if (!rbs && !bp && !height && !weight && !pulse && !extra_note) {
      return res.status(400).send({ message: 'At least one field must be provided' });
    }

    // Check if BP is in the correct format (integer/integer)
    if (bp && !/^\d+\/\d+$/.test(bp)) {
      return res.status(400).send({ message: 'BP must be in the format systolic/diastolic (e.g., 120/80)' });
    }

    // Check if vitals already exist for the current month and year
    let existingVitals = await Vitals.findOne({ book_no, timestamp: currentMonthYear });

    if (existingVitals) {
      // Track the original values for logging changes
      const originalValues = {
        rbs: existingVitals.rbs,
        bp: existingVitals.bp,
        height: existingVitals.height,
        weight: existingVitals.weight,
        pulse: existingVitals.pulse,
        extra_note: existingVitals.extra_note,
      };

      // Update existing vitals
      existingVitals.rbs = rbs || existingVitals.rbs;
      existingVitals.bp = bp || existingVitals.bp;
      existingVitals.height = height || existingVitals.height;
      existingVitals.weight = weight || existingVitals.weight;
      existingVitals.pulse = pulse || existingVitals.pulse;
      existingVitals.extra_note = extra_note || existingVitals.extra_note;

      await existingVitals.save();

      // Determine what fields were changed for logging
      let changesDescription = [];
      if (rbs && originalValues.rbs !== existingVitals.rbs)
        changesDescription.push(`RBS from "${originalValues.rbs || 'none'}" to "${existingVitals.rbs}"`);

      if (bp && originalValues.bp !== existingVitals.bp)
        changesDescription.push(`BP from "${originalValues.bp || 'none'}" to "${existingVitals.bp}"`);

      if (height && originalValues.height !== existingVitals.height)
        changesDescription.push(`Height from "${originalValues.height || 'none'}" to "${existingVitals.height}"`);

      if (weight && originalValues.weight !== existingVitals.weight)
        changesDescription.push(`Weight from "${originalValues.weight || 'none'}" to "${existingVitals.weight}"`);

      if (pulse && originalValues.pulse !== existingVitals.pulse)
        changesDescription.push(`Pulse from "${originalValues.pulse || 'none'}" to "${existingVitals.pulse}"`);

      if (extra_note && originalValues.extra_note !== existingVitals.extra_note)
        changesDescription.push(`Notes updated`);

      // Log the vitals update
      if (req._user && req._user.id) {
        let logMessage = `Updated vitals for patient (Book #${book_no}) for ${currentMonthYear}`;

        // Add details about what changed
        if (changesDescription.length > 0) {
          logMessage += ` - Changed: ${changesDescription.join(', ')}`;
        } else {
          logMessage += ` - No values changed`;
        }

        await logUserAction(req._user.id, logMessage);
      }

      return res.status(200).send({ message: 'Vitals data updated successfully' });
    } else {
      // Create new vitals record
      const newVitals = new Vitals({
        book_no,
        rbs: rbs || null,
        bp: bp || null,
        height: height || null,
        weight: weight || null,
        pulse: pulse || null,
        extra_note: extra_note || null,
        timestamp: currentMonthYear,
      });

      await newVitals.save();

      // Build a list of recorded vitals for logging
      let recordedVitals = [];
      if (rbs) recordedVitals.push(`RBS: ${rbs}`);
      if (bp) recordedVitals.push(`BP: ${bp}`);
      if (height) recordedVitals.push(`Height: ${height}`);
      if (weight) recordedVitals.push(`Weight: ${weight}`);
      if (pulse) recordedVitals.push(`Pulse: ${pulse}`);

      // Log the new vitals record
      if (req._user && req._user.id) {
        let logMessage = `Recorded new vitals for patient (Book #${book_no}) for ${currentMonthYear}`;

        // Add details about what was recorded
        if (recordedVitals.length > 0) {
          logMessage += ` - Recorded: ${recordedVitals.join(', ')}`;
        }

        if (extra_note) {
          logMessage += ` - Added clinical notes`;
        }

        await logUserAction(req._user.id, logMessage);
      }

      return res.status(201).send({ message: 'Vitals data saved successfully' });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(400).send({ message: error.message });
  }
});
router.get('/:book_no', async (req, res) => {
  const { book_no } = req.params;
  const currentMonthYear = new Date().toISOString().slice(0, 7);

  try {
    const vitals = await Vitals.findOne({ book_no, timestamp: currentMonthYear });
    if (!vitals) {
      return res.status(404).send({ message: 'No data found for this patient for the current month and year' });
    }
    return res.status(200).send(vitals);
  } catch (error) {
    console.error('Error:', error);
    return res.status(400).send({ message: error.message });
  }
});

module.exports = router;