import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from "./Components/Navbar";
import Dashboard from './Pages/Dashboard';
import PatientRegistration from './Pages/PatientRegistration';
import Vitals from './Pages/Vitals';
import DoctorPrescription from './Pages/DoctorPrescription';
import DoctorAssigning from './Pages/DoctorAssigning';
import DoctorAssigningAutomatic from './Pages/DoctorAssigningAutomatic';
import ViewQueue from './Pages/ViewQueue';
import MedicinePickup from './Pages/MedicinePickup';
import MedicineVerification from './Pages/MedicineVerification';
import AddDoctor from './Pages/AddDoctor';
import ViewDoctors from './Pages/ViewDoctors';
import DashboardAdmin from './Pages/DashBoardAdmin';
import DoctorAvailability from './Pages/DoctorAvailability';
import ViewPatients from './Pages/ViewPatients';
import ViewMedicines from './Pages/ViewMedicines';
import UpdateMedicineStock from './Pages/UpdateMedicineStock';
import AddMedicine from './Pages/AddMedicine';
// import ExpiredMedicines from './Pages/ExpiredMedicines';
import Login from './Pages/Login';
import AdminLogin from './Pages/AdminLogin';
import VolunteerLogin from './Pages/VolunteerLogin'; // Import the new component
import Footer from './Components/Footer';
import DoctorProfile from './Pages/DoctorProfile';
import ProtectedRoute from './Pages/ProtectedRoute';
import AdminAnalytics from './Pages/AdminAnalytics';
import './App.css';
import AddVolunteer from './Pages/AddVolunteer';
import ViewVolunteers from './Pages/ViewVolunteers';
import VolunteerProfile from './Pages/VolunteerProfile';
import PatientProfile from './Pages/PatientProfile';
import Log from './Pages/Log';
import VerifyMedicine from './Pages/VerifyMedicine';
import CounsellingPage from './Pages/CounsellingPage';
import TokenGeneration from './Pages/TokenGeneration';
import PatientStatusPage from './Pages/PatientStatusPage'; // Import new component

function App() {
  return (
    <div className="app-container">
      <Router>
        <Navbar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/volunteer-signup" element={<AddVolunteer fromLogin={true} />} />
            <Route path="/dashboard" element={<ProtectedRoute requiredType="volunteer"><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard-admin" element={<ProtectedRoute requiredType="admin"><DashboardAdmin /></ProtectedRoute>} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/volunteer-login" element={<VolunteerLogin />} /> {/* Add the new route */}
            <Route path="/patient-registration" element={<ProtectedRoute requiredType="volunteer"><PatientRegistration /></ProtectedRoute>} />
            <Route path="/vitals" element={<ProtectedRoute requiredType="volunteer"><Vitals /></ProtectedRoute>} />
            <Route path="/token" element={<ProtectedRoute requiredType="volunteer"><TokenGeneration /></ProtectedRoute>} />
            <Route path="/counselling" element={<ProtectedRoute requiredType="volunteer"><CounsellingPage /></ProtectedRoute>} /> {/* New Counselling Route */}
            <Route path="/doctor-assigning" element={<ProtectedRoute requiredType="volunteer"><DoctorAssigning /></ProtectedRoute>} />
            <Route path="/doctor-assigning-automatic" element={<ProtectedRoute requiredType="volunteer"><DoctorAssigningAutomatic /></ProtectedRoute>} />
            <Route path="/view-queue" element={<ProtectedRoute requiredType="volunteer"><ViewQueue /></ProtectedRoute>} />
            <Route path="/doctor-prescription" element={<ProtectedRoute requiredType="volunteer"><DoctorPrescription /></ProtectedRoute>} />
            <Route path="/medicine-pickup" element={<ProtectedRoute requiredType="volunteer"><MedicinePickup /></ProtectedRoute>} />
            <Route path="/medicine-verification" element={<ProtectedRoute requiredType="volunteer"><VerifyMedicine /></ProtectedRoute>} />
            <Route path="/log" element={
              <ProtectedRoute requiredType="admin">
                <Log />
              </ProtectedRoute>
            } />
            {/* <Route path="/medicine-verification" element={<MedicineVerification />} /> */}
            <Route path="/add-volunteer" element={<ProtectedRoute requiredType="admin"><AddVolunteer /></ProtectedRoute>} />
            <Route path="/add-doctor" element={<ProtectedRoute requiredType="admin"><AddDoctor /></ProtectedRoute>} />
            <Route path="/doctor-availability" element={<ProtectedRoute requiredType="admin"><DoctorAvailability /></ProtectedRoute>} />
            <Route path="/view-patients" element={<ProtectedRoute requiredType="admin"><ViewPatients /></ProtectedRoute>} />
            <Route path="/get-medicines" element={<ProtectedRoute requiredType="admin"><ViewMedicines /></ProtectedRoute>} />
            <Route path="/update-medicine-stock" element={<ProtectedRoute requiredType="admin"><UpdateMedicineStock /></ProtectedRoute>} />
            <Route path="/add-new-medicine" element={<ProtectedRoute requiredType="admin"><AddMedicine /></ProtectedRoute>} />
            <Route path='/get-doctors' element={<ProtectedRoute requiredType="admin"><ViewDoctors /></ProtectedRoute>} />
            {/* <Route path="/expired-medicines" element={<ProtectedRoute requiredType="admin"><ExpiredMedicines /></ProtectedRoute>} /> */}
            <Route path='/doctor/:id' element={<ProtectedRoute requiredType="admin"><DoctorProfile /></ProtectedRoute>} />
            <Route path="/get-volunteers" element={<ProtectedRoute requiredType="admin"><ViewVolunteers /></ProtectedRoute>} />
            <Route path="/volunteer/:id" element={<ProtectedRoute requiredType="admin"><VolunteerProfile /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute requiredType="admin"><AdminAnalytics /></ProtectedRoute>} />
            <Route path="/patient/:id" element={<ProtectedRoute requiredType="admin"><PatientProfile /></ProtectedRoute>} />
            <Route path="/patient-status" element={<ProtectedRoute requiredType="volunteer"><PatientStatusPage /></ProtectedRoute>} /> {/* New Patient Status Route */}
          </Routes>
        </div>
        <Footer />
      </Router>
    </div>
  );
}

export default App;
