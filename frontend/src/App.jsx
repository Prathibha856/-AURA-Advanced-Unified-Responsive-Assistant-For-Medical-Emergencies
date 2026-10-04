import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ROLES } from './config/roles';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuraChatWidget from './components/AuraChatWidget';

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
import HospitalAdminSignup from './pages/auth/HospitalAdminSignup';
import SupplyAdminLogin from './pages/auth/SupplyAdminLogin';
import SupplyAdminSignup from './pages/auth/SupplyAdminSignup';

// Protected Role Hubs
import PatientDashboard from './pages/patient/PatientDashboard';
import PredictionResult from './pages/patient/PredictionResult';
import MedicalInformation from './pages/patient/MedicalInformation';
import HospitalDashboard from './pages/hospital/HospitalDashboard';
import HospitalSOSAlerts from './pages/hospital/HospitalSOSAlerts';

/**
 * PublicLayout: Clean layout without Navbar or persistent widgets for entry & auth flows
 */
function PublicLayout({ children }) {
  return <>{children}</>;
}

/**
 * AppLayout: Full application frame with role-based Navbar, Footer, and AuraChatWidget
 */
function AppLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800 relative">
      <Navbar />
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Footer />
      <AuraChatWidget />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ── Public Entry Routes (PublicLayout) ─────────────────────────── */}
          <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
          <Route path="/login" element={<Navigate to="/access" replace />} />
          <Route path="/register" element={<Navigate to="/access" replace />} />
          <Route path="/auth" element={<PublicLayout><AccessPortal /></PublicLayout>} />
          <Route path="/access" element={<PublicLayout><AccessPortal /></PublicLayout>} />

          <Route path="/login/patient" element={<PublicLayout><PatientLogin /></PublicLayout>} />
          <Route path="/signup/patient" element={<PublicLayout><PatientSignup /></PublicLayout>} />

          <Route path="/login/hospital-admin" element={<PublicLayout><HospitalAdminLogin /></PublicLayout>} />
          <Route path="/signup/hospital-admin" element={<PublicLayout><HospitalAdminSignup /></PublicLayout>} />

          <Route path="/login/supply-admin" element={<PublicLayout><SupplyAdminLogin /></PublicLayout>} />
          <Route path="/signup/supply-admin" element={<PublicLayout><SupplyAdminSignup /></PublicLayout>} />

          {/* ── Authenticated Routes (AppLayout + ProtectedRoute) ─────────── */}
          {/* Patient Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={[ROLES.PATIENT]}>
                <AppLayout><PatientDashboard /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute allowedRoles={[ROLES.PATIENT]}>
                <AppLayout><PatientDashboard /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/medical-info"
            element={
              <ProtectedRoute allowedRoles={[ROLES.PATIENT]}>
                <AppLayout><MedicalInformation /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/medical-information"
            element={
              <ProtectedRoute allowedRoles={[ROLES.PATIENT]}>
                <AppLayout><MedicalInformation /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/prediction-result"
            element={
              <ProtectedRoute allowedRoles={[ROLES.PATIENT]}>
                <AppLayout><PredictionResult /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/prediction/result/:id"
            element={
              <ProtectedRoute allowedRoles={[ROLES.PATIENT]}>
                <AppLayout><PredictionResult /></AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Shared Clinical Services */}
          <Route
            path="/predict"
            element={
              <ProtectedRoute allowedRoles={[ROLES.PATIENT, ROLES.HOSPITAL_ADMIN]}>
                <AppLayout><Predict /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/emergency"
            element={
              <ProtectedRoute allowedRoles={[ROLES.PATIENT]}>
                <AppLayout><Emergency /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hospital/sos-alerts"
            element={
              <ProtectedRoute allowedRoles={[ROLES.HOSPITAL_ADMIN]}>
                <AppLayout><HospitalSOSAlerts /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hospitals"
            element={
              <ProtectedRoute allowedRoles={[ROLES.PATIENT, ROLES.HOSPITAL_ADMIN, ROLES.SUPPLY_ADMIN]}>
                <AppLayout><Hospitals /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/chatbot"
            element={
              <ProtectedRoute allowedRoles={[ROLES.PATIENT, ROLES.HOSPITAL_ADMIN]}>
                <AppLayout><Chatbot /></AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Hospital Administrator Routes */}
          <Route
            path="/hospital/dashboard"
            element={
              <ProtectedRoute allowedRoles={[ROLES.HOSPITAL_ADMIN]}>
                <AppLayout><HospitalDashboard /></AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Supply Chain Admin Routes */}
          <Route
            path="/supply-chain"
            element={
              <ProtectedRoute allowedRoles={[ROLES.SUPPLY_ADMIN, ROLES.HOSPITAL_ADMIN]}>
                <AppLayout><SupplyChain /></AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;