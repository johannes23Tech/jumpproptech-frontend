import { type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Paywall from './pages/Paywall';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import Units from './pages/Units';
import Tenants from './pages/Tenants';
import Rent from './pages/Rent';
import Layout from './components/Layout';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

// Tenant Imports
import TenantDashboard from './pages/TenantDashboard';
import TenantDocuments from './pages/TenantDocuments';
import TenantPayments from './pages/TenantPayments';
import TenantMaintenance from './pages/TenantMaintenance';
import TenantProfile from './pages/TenantProfile';

// Landlord/Shared Imports
import LandlordMaintenance from './pages/LandlordMaintenance';
import LandlordProfile from './pages/LandlordProfile';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import Messages from './pages/Messages';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-black text-gold flex items-center justify-center font-bold">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
};

const OwnerRoute = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  if (user?.role === 'tenant') return <Navigate to="/" />;
  return <>{children}</>;
};

function AppRoutes() {
  const { user } = useAuth();
  const isTenant = user?.role === 'tenant';

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/paywall" element={<Paywall />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      
      <Route path="/" element={<ProtectedRoute>{isTenant ? <TenantDashboard /> : <Dashboard />}</ProtectedRoute>} />
      
      {/* Tenant Only Routes */}
      <Route path="/documents" element={<ProtectedRoute><TenantDocuments /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute><TenantPayments /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><TenantProfile /></ProtectedRoute>} />

      {/* Shared Routes */}
      <Route path="/maintenance" element={
        <ProtectedRoute>
          {isTenant ? <TenantMaintenance /> : <OwnerRoute><LandlordMaintenance /></OwnerRoute>}
        </ProtectedRoute>
      } />

      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/messages/:tenantId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />

      {/* Landlord/Admin Only Routes */}
      <Route path="/properties" element={<ProtectedRoute><OwnerRoute><Properties /></OwnerRoute></ProtectedRoute>} />
      <Route path="/units" element={<ProtectedRoute><OwnerRoute><Units /></OwnerRoute></ProtectedRoute>} />
      <Route path="/tenants" element={<ProtectedRoute><OwnerRoute><Tenants /></OwnerRoute></ProtectedRoute>} />
      <Route path="/rent" element={<ProtectedRoute><OwnerRoute><Rent /></OwnerRoute></ProtectedRoute>} />
      <Route path="/landlord-profile" element={<ProtectedRoute><OwnerRoute><LandlordProfile /></OwnerRoute></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><OwnerRoute><SuperAdminDashboard /></OwnerRoute></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}