import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ROLES } from './config/roles';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Predict from './pages/Predict';
import Emergency from './pages/Emergency';
import SupplyChain from './pages/SupplyChain';
import Chatbot from './pages/Chatbot';
import PatientDashboard from './pages/patient/PatientDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/predict" element={<Predict />} />
            <Route path="/emergency" element={<Emergency />} />
            <Route path="/supply-chain" element={<SupplyChain />} />
            <Route path="/chatbot" element={<Chatbot />} />
            
            {/* Authenticated Patient Routes */}
            <Route
              path="/patient/dashboard"
              element={
                <ProtectedRoute allowedRoles={[ROLES.PATIENT]}>
                  <PatientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient-dashboard"
              element={
                <ProtectedRoute allowedRoles={[ROLES.PATIENT]}>
                  <PatientDashboard />
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