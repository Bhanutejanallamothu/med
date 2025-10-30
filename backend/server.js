require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

require('./models/userModel');
require('./models/patientModel');
require('./models/medicineCategoryModel');
require('./models/inventoryModel');
require('./models/patientHistoryModel');
require('./models/vitalsModel');
require('./models/doctorModel');


// Middleware
const authMiddleware = require('./middleware/authMiddleware');

const patientRoutes = require('./routes/patientRoutes');
const vitalRoutes = require('./routes/vitalRoutes');
const patientHistoryRoutes = require('./routes/patientHistoryRoutes');
const doctorAssignRoutes = require('./routes/doctorAssignRoutes');
const adminSideGeneralRoutes = require('./routes/adminSideGeneralRoutes');
const adminSideMedicineRoutes = require('./routes/adminSideMedicineRoutes');
const adminSideDoctorRoutes = require('./routes/adminSideDoctorRoutes');
const adminSideVolunteerRoutes = require('./routes/adminSideVolunteerRoutes');
const authRoutes = require('./routes/authRoutes');
const logRoutes = require('./routes/logRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const queueRoutes = require('./routes/queueRoutes');
const tokenRoutes = require('./routes/token');
const patientStatusRoutes = require('./routes/patientStatusRoutes'); // New route

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'https://medical-camp.apps.swecha.org', // or your frontend domain
  // origin: 'http://localhost:3000',// or your frontend domain
  credentials: true
}));

app.use(authMiddleware); // Apply logging middleware to all routes, to log all actions

connectDB();

app.use('/api/patients', patientRoutes);
app.use('/api/vitals', vitalRoutes);
app.use('/api/patient-history', patientHistoryRoutes);
app.use('/api/doctor-assign', doctorAssignRoutes);
app.use('/api/admin', adminSideGeneralRoutes);
app.use('/api/admin', adminSideMedicineRoutes);
app.use('/api/admin', adminSideDoctorRoutes);
app.use('/api/admin', adminSideVolunteerRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api', tokenRoutes);
app.use('/api/patient-status', patientStatusRoutes); // Register new route

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
