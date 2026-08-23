import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ROLES } from './config/roles';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Core Pages
import LandingPage from './pages/LandingPage';
import Predict from './pages/Predict';
import Emergency from './pages/Emergency';
import SupplyChain from './pages/SupplyChain';
import Chatbot from './pages/Chatbot';
import Hospitals from './pages/Hospitals';

// Auth Experience Pages
import AccessPortal from './pages/auth/AccessPortal';
import PatientLogin from './pages/auth/PatientLogin';
import PatientSignup from './pages/auth/PatientSignup';
import HospitalAdminLogin from './pages/auth/HospitalAdminLogin';
import SupplyAdminLogin from './pages/auth/SupplyAdminLogin';

// Protected Role Hubs
import PatientDashboard from './pages/patient/PatientDashboard';
import PredictionResult from './pages/patient/PredictionResult';
import MedicalInformation from './pages/patient/MedicalInformation';
import HospitalDashboard from './pages/hospital/HospitalDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Public Entry & Navigation */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/access" element={<AccessPortal />} />
            <Route path="/predict" element={<Predict />} />
            <Route path="/prediction/result/:id" element={<PredictionResult />} />
            <Route path="/hospitals" element={<Hospitals />} />
            <Route path="/emergency" element={<Emergency />} />
            <Route path="/chatbot" element={<Chatbot />} />

            {/* Authentication Entry Routes */}
            <Route path="/login/patient" element={<PatientLogin />} />
            <Route path="/signup/patient" element={<PatientSignup />} />
            <Route path="/login/hospital-admin" element={<HospitalAdminLogin />} />
            <Route path="/login/supply-admin" element={<SupplyAdminLogin />} />

            {/* Role 1: PATIENT Protected Routes */}
            <Route
              path="/patient/dashboard"
              element={
                <ProtectedRoute allowedRoles={[ROLES.PATIENT]} redirectTo="/access">
                  <PatientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient-dashboard"
              element={
                <ProtectedRoute allowedRoles={[ROLES.PATIENT]} redirectTo="/access">
                  <PatientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/medical-information"
              element={
                <ProtectedRoute allowedRoles={[ROLES.PATIENT]} redirectTo="/access">
                  <MedicalInformation />
                </ProtectedRoute>
              }
            />

            {/* Role 2: HOSPITAL_ADMIN Protected Routes */}
            <Route
              path="/hospital/dashboard"
              element={
                <ProtectedRoute allowedRoles={[ROLES.HOSPITAL_ADMIN]} redirectTo="/access">
                  <HospitalDashboard />
                </ProtectedRoute>
              }
            />

            {/* Role 3: SUPPLY_ADMIN Protected Routes */}
            <Route
              path="/supply-chain"
              element={
                <ProtectedRoute allowedRoles={[ROLES.SUPPLY_ADMIN, ROLES.HOSPITAL_ADMIN]} redirectTo="/access">
                  <SupplyChain />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;