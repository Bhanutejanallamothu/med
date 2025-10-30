const express = require('express');
const router = express.Router();
const Doctor = require('../models/doctorModel');
const Patient = require('../models/patientModel');
const PatientHistory = require('../models/patientHistoryModel');
const Queue = require('../models/queueModel');

// POST /api/queue/add
router.post('/add', async (req, res) => {
  const { book_no, doctor_names } = req.body;

  if (!book_no || !Array.isArray(doctor_names) || doctor_names.length === 0) {
    return res.status(400).json({ message: 'book_no and doctor_names are required' });
  }

  try {
    let patientHistory = await PatientHistory.findOne({ book_no });

    // If patient history does not exist, show error.
    if (!patientHistory) {
        return res.status(404).send({ message: 'Patient not found' });
    }
    // Only allow queue entry if patient exists
    // const patient = await Patient.findOne({ book_no });
    // if (!patient) {
    //   return res.status(404).json({ message: 'Patient not found' });
    // }
    const currentMonthYear = new Date().toISOString().slice(0, 7);
    const visitIndex = patientHistory.visits.findIndex(
      (visit) => visit.timestamp === currentMonthYear
    );

    if (visitIndex === -1) {
      return res.status(404).send({ message: 'Visit not found for the current month and year' });
    }

    // Find all doctors matching the given names
    const doctors = await Doctor.find({ doctor_name: { $in: doctor_names } });

    if (doctors.length !== doctor_names.length) {
      const foundNames = doctors.map(d => d.doctor_name);
      const missingNames = doctor_names.filter(name => !foundNames.includes(name));
      return res.status(404).json({ message: `Doctor(s) not found: ${missingNames.join(', ')}` });
    }

    // Build doctor_list with IDs and names
    const doctor_list = doctors.map(doc => ({
      doctor_id: doc.doctor_id,
      doctor_name: doc.doctor_name
    }));

    // Get the current highest queue number
    const lastQueue = await Queue.findOne().sort({ queue_no: -1 });
    const nextQueueNo = lastQueue ? lastQueue.queue_no + 1 : 1;

    // Create and save new queue entry
    const newQueueEntry = new Queue({
      queue_no: nextQueueNo,
      book_no,
      doctor_list
    });

    await newQueueEntry.save();

    res.status(201).json({
      message: 'Queue entry created successfully',
      queue_no: nextQueueNo,
      book_no,
      doctor_list
    });

  } catch (error) {
    console.error('Error creating queue entry:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

/**
 * GET /api/queue/next/:doctor_id
 * Finds the first (lowest queue_no) entry where the given doctor_id
 * appears in doctor_list, and returns its book_no.
 */
router.get('/next/:doctor_id', async (req, res) => {
  const docId = parseInt(req.params.doctor_id, 10);
  if (isNaN(docId)) {
    return res.status(400).json({ message: 'Invalid doctor_id' });
  }

  try {
    // Query all queue entries containing this doctor, sorted by queue_no ascending
    const entries = await Queue.find(
      { 'doctor_list.doctor_id': docId },
      { book_no: 1, queue_no: 1 }
    )
    .sort({ queue_no: 1 })
    .limit(1)
    .lean();

    if (!entries || entries.length === 0) {
      return res.status(404).json({ message: 'No queue entry found for this doctor' });
    }

    // Return the earliest book_no
    return res.json({ book_no: entries[0].book_no });
  } catch (err) {
    console.error('Error fetching next queue entry:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * DELETE /api/queue/remove
 * Removes a queue entry by book_no
 * Expects: { book_no: Number }
 */
router.delete('/remove', async (req, res) => {
  const { book_no } = req.body;
  if (typeof book_no !== 'number') {
    return res.status(400).json({ message: 'Invalid book_no' });
  }

  try {
    const result = await Queue.deleteOne({ book_no });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Queue entry not found' });
    }
    return res.json({ message: 'Queue entry removed' });
  } catch (err) {
    console.error('Error removing queue entry:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/queue/count/:doctorId
// Returns the number of Queue documents where the given doctorId appears in doctor_list
router.get('/count/:doctorId', async (req, res) => {
  const doctorId = parseInt(req.params.doctorId, 10);
  if (isNaN(doctorId)) {
    return res.status(400).json({ message: 'Invalid doctor ID' });
  }

  try {
    // Find all queues where doctor_list contains this doctorId, then count them
    const matchingQueues = await Queue.find(
      { 'doctor_list.doctor_id': doctorId },
      '_id'
    );
    const count = matchingQueues.length;

    return res.status(200).json({ doctor_id: doctorId, queueCount: count });
  } catch (error) {
    console.error('Error counting queues for doctor', doctorId, error);
    return res.status(500).json({ message: 'Error counting queues' });
  }
});


module.exports = router;
