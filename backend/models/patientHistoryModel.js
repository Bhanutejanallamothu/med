const mongoose = require('mongoose');

const PatientHistorySchema = new mongoose.Schema({
  book_no: { type: String, required: true, unique: true },
  visits: [{
    doctor_id: { type: Number },
    timestamp: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}$/ // Enforces YYYY-MM format
    },
    medicines_prescribed: [{
      medicine_id: String,
      quantity: Number,
      dosage_schedule: {
        days: Number,
        morning: Boolean,
        afternoon: Boolean,
        night: Boolean
      }
    }],
    medicines_given: [{ medicine_id: String, quantity: Number }],
    counselling: { type: Boolean, default: false }, // Counselling moved inside visits
  }],
});

const PatientHistory = mongoose.model('PatientHistory', PatientHistorySchema);

module.exports = PatientHistory;
