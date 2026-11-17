import { type ReactNode, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import { MARKETPLACE_ENABLED } from './config/features';
import { hasPermission, isTenantUser } from './config/roles';

// Instantly load critical UI
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Paywall from './pages/Paywall';
import Layout from './components/Layout';

// LAZY LOAD PAGES (Code Splitting)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Properties = lazy(() => import('./pages/Properties'));
const Units = lazy(() => import('./pages/Units'));
const Tenants = lazy(() => import('./pages/Tenants'));
const Rent = lazy(() => import('./pages/Rent'));
const TenantDashboard = lazy(() => import('./pages/TenantDashboard'));
const TenantDocuments = lazy(() => import('./pages/TenantDocuments'));
const TenantPayments = lazy(() => import('./pages/TenantPayments'));
const TenantMaintenance = lazy(() => import('./pages/TenantMaintenance'));
const TenantProfile = lazy(() => import('./pages/TenantProfile'));
const LandlordMaintenance = lazy(() => import('./pages/LandlordMaintenance'));
const LandlordProfile = lazy(() => import('./pages/LandlordProfile'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const Messages = lazy(() => import('./pages/Messages'));
const Security = lazy(() => import('./pages/Security'));
const Staff = lazy(() => import('./pages/Staff'));
const Marketplace = lazy(() => import('./marketplace/Marketplace'));

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-black text-gold flex items-center justify-center font-bold">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
};

const OwnerRoute = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  if (isTenantUser(user)) return <Navigate to="/tenant-dashboard" />;
  return <>{children}</>;
};

const SuperAdminRoute = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  if (!hasPermission(user, 'settings.manage')) return <Navigate to="/manage" />;
  return <>{children}</>;
};

const StaffRoute = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  if (!hasPermission(user, 'staff.manage')) return <Navigate to="/manage" />;
  return <>{children}</>;
};

function AppRoutes() {
  const { user } = useAuth();
  const isTenant = isTenantUser(user);
  const signedInHome = isTenant ? '/tenant-dashboard' : '/manage';

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-gold animate-pulse"></div>
      </div>
    }>
      <Routes>
        <Route path="/" element={MARKETPLACE_ENABLED ? <Marketplace /> : <Navigate to={user ? signedInHome : '/login'} replace />} />
        <Route path="/explore" element={MARKETPLACE_ENABLED ? <Marketplace /> : <Navigate to={user ? signedInHome : '/login'} replace />} />
        <Route path="/login" element={user ? <Navigate to={signedInHome} replace /> : <Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/paywall" element={MARKETPLACE_ENABLED ? <Paywall /> : <Navigate to={user ? signedInHome : '/login'} replace />} />
        
        {/* THE FIX: Render Dashboard for Landlords, TenantDashboard for Tenants */}
        <Route path="/manage" element={<ProtectedRoute>{isTenant ? <TenantDashboard /> : <Dashboard />}</ProtectedRoute>} />
        <Route path="/tenant-dashboard" element={<ProtectedRoute><TenantDashboard /></ProtectedRoute>} />
        
        <Route path="/documents" element={<ProtectedRoute><TenantDocuments /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><TenantPayments /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><TenantProfile /></ProtectedRoute>} />

        <Route path="/maintenance" element={
          <ProtectedRoute>
            {isTenant ? <TenantMaintenance /> : <OwnerRoute><LandlordMaintenance /></OwnerRoute>}
          </ProtectedRoute>
        } />

        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/messages/:tenantId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />

        <Route path="/properties" element={<ProtectedRoute><OwnerRoute><Properties /></OwnerRoute></ProtectedRoute>} />
        <Route path="/units" element={<ProtectedRoute><OwnerRoute><Units /></OwnerRoute></ProtectedRoute>} />
        <Route path="/tenants" element={<ProtectedRoute><OwnerRoute><Tenants /></OwnerRoute></ProtectedRoute>} />
        <Route path="/rent" element={<ProtectedRoute><OwnerRoute><Rent /></OwnerRoute></ProtectedRoute>} />
        <Route path="/landlord-profile" element={<ProtectedRoute><OwnerRoute><LandlordProfile /></OwnerRoute></ProtectedRoute>} />
        <Route path="/security" element={<ProtectedRoute><Security /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute></ProtectedRoute>} />
        <Route path="/staff" element={<ProtectedRoute><StaffRoute><Staff /></StaffRoute></ProtectedRoute>} />

        <Route path="*" element={<Navigate to={user ? signedInHome : '/login'} replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}