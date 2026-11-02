import { type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import Units from './pages/Units';
import Tenants from './pages/Tenants';
import Rent from './pages/Rent';
import Layout from './components/Layout';

// Tenant Imports
import TenantDashboard from './pages/TenantDashboard';
import TenantDocuments from './pages/TenantDocuments';
import TenantPayments from './pages/TenantPayments';
import TenantMaintenance from './pages/TenantMaintenance';
import TenantProfile from './pages/TenantProfile';

// Shared Maintenance & Messaging
import LandlordMaintenance from './pages/LandlordMaintenance';
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
      {/* Public Routes */}
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Shared Root Route */}
      <Route path="/" element={<ProtectedRoute>{isTenant ? <TenantDashboard /> : <Dashboard />}</ProtectedRoute>} />
      
      {/* Tenant Only Routes */}
      <Route path="/documents" element={<ProtectedRoute><TenantDocuments /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute><TenantPayments /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><TenantProfile /></ProtectedRoute>} />

      {/* Shared Routes (Split views based on role) */}
      <Route path="/maintenance" element={
        <ProtectedRoute>
          {isTenant ? <TenantMaintenance /> : <OwnerRoute><LandlordMaintenance /></OwnerRoute>}
        </ProtectedRoute>
      } />

      {/* Messaging Routes */}
      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/messages/:tenantId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />

      {/* Landlord/Agent Only Routes */}
      <Route path="/properties" element={<ProtectedRoute><OwnerRoute><Properties /></OwnerRoute></ProtectedRoute>} />
      <Route path="/units" element={<ProtectedRoute><OwnerRoute><Units /></OwnerRoute></ProtectedRoute>} />
      <Route path="/tenants" element={<ProtectedRoute><OwnerRoute><Tenants /></OwnerRoute></ProtectedRoute>} />
      <Route path="/rent" element={<ProtectedRoute><OwnerRoute><Rent /></OwnerRoute></ProtectedRoute>} />

      {/* Fallback for any unknown URL */}
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