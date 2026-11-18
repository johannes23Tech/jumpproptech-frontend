import { type ReactNode, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import LogoReveal from './components/LogoReveal';
import { hasPermission, isTenantUser } from './config/roles';

// Instantly load critical UI
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
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
const Applications = lazy(() => import('./pages/Applications'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Tenancy = lazy(() => import('./pages/Tenancy'));
const Budgets = lazy(() => import('./pages/Budgets'));

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

const ApplicationsRoute = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  if (!hasPermission(user, 'applications.view')) return <Navigate to="/manage" />;
  return <>{children}</>;
};

const TenancyRoute = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  if (!hasPermission(user, 'leases.view') && !hasPermission(user, 'deposits.view')) {
    return <Navigate to="/manage" />;
  }
  return <>{children}</>;
};

const BudgetsRoute = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  if (!hasPermission(user, 'budgets.view')) return <Navigate to="/manage" />;
  return <>{children}</>;
};

function AppRoutes() {
  const { user } = useAuth();
  const isTenant = isTenantUser(user);
  const signedInHome = isTenant ? '/tenant-dashboard' : '/manage';

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <img src="/icons/icon-512.png" alt="Jump PropTech" className="w-16 h-16 rounded-2xl object-contain animate-pulse" />
      </div>
    }>
      <Routes>
        {/* Entry: a single animated logo reveal, then straight into the app. */}
        <Route path="/" element={<LogoReveal />} />
        {/* Retired public/marketplace screens. Any old link falls back to the reveal. */}
        <Route path="/explore" element={<Navigate to="/" replace />} />
        <Route path="/paywall" element={<Navigate to="/" replace />} />
        <Route path="/login" element={user ? <Navigate to={signedInHome} replace /> : <Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* Public, unit-scoped QR onboarding. Never requires a session. */}
        <Route path="/apply/:token" element={<Onboarding />} />
        
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
        <Route path="/applications" element={<ProtectedRoute><OwnerRoute><ApplicationsRoute><Applications /></ApplicationsRoute></OwnerRoute></ProtectedRoute>} />
        <Route path="/tenancy" element={<ProtectedRoute><OwnerRoute><TenancyRoute><Tenancy /></TenancyRoute></OwnerRoute></ProtectedRoute>} />
        <Route path="/rent" element={<ProtectedRoute><OwnerRoute><Rent /></OwnerRoute></ProtectedRoute>} />
        <Route path="/budgets" element={<ProtectedRoute><OwnerRoute><BudgetsRoute><Budgets /></BudgetsRoute></OwnerRoute></ProtectedRoute>} />
        <Route path="/landlord-profile" element={<ProtectedRoute><OwnerRoute><LandlordProfile /></OwnerRoute></ProtectedRoute>} />
        <Route path="/security" element={<ProtectedRoute><Security /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute></ProtectedRoute>} />
        <Route path="/staff" element={<ProtectedRoute><StaffRoute><Staff /></StaffRoute></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
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