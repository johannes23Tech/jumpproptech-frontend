import { type ReactNode, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import LogoReveal from './components/LogoReveal';
import { effectiveStaffRole, hasPermission, isAdministratorUser, isSuperAdminUser, isTenantUser } from './config/roles';

// Instantly load critical UI
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Layout from './components/Layout';

// LAZY LOAD PAGES (Code Splitting)
const PropertyManagerDashboard = lazy(() => import('./pages/PropertyManagerDashboard'));
const FinanceDashboard = lazy(() => import('./pages/FinanceDashboard'));
const MaintenanceManagerDashboard = lazy(() => import('./pages/MaintenanceManagerDashboard'));
const MaintenanceTechnicianDashboard = lazy(() => import('./pages/MaintenanceTechnicianDashboard'));
const ReceptionSupportDashboard = lazy(() => import('./pages/ReceptionSupportDashboard'));
const AuditorDashboard = lazy(() => import('./pages/AuditorDashboard'));
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
const AdministratorDashboard = lazy(() => import('./pages/AdministratorDashboard'));
const Messages = lazy(() => import('./pages/Messages'));
const Security = lazy(() => import('./pages/Security'));
const Staff = lazy(() => import('./pages/Staff'));
const StaffDetail = lazy(() => import('./pages/StaffDetail'));
const Applications = lazy(() => import('./pages/Applications'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Tenancy = lazy(() => import('./pages/Tenancy'));
const Budgets = lazy(() => import('./pages/Budgets'));
const Contracts = lazy(() => import('./pages/Contracts'));
const ContractWizard = lazy(() => import('./pages/ContractWizard'));
const ContractDetail = lazy(() => import('./pages/ContractDetail'));
const ContractTemplates = lazy(() => import('./pages/ContractTemplates'));
const DesignSystem = lazy(() => import('./pages/DesignSystem'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Governance = lazy(() => import('./pages/Governance'));

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-black text-gold flex items-center justify-center font-bold">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
};

const OwnerRoute = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  if (isTenantUser(user)) return <Navigate to="/tenant-dashboard" />;
  if (isSuperAdminUser(user)) return <Navigate to="/control-center" />;
  return <>{children}</>;
};

const SuperAdminRoute = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  if (!isSuperAdminUser(user)) return <Navigate to="/manage" />;
  return <>{children}</>;
};

const AdministratorRoute = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  if (isSuperAdminUser(user)) return <Navigate to="/control-center" />;
  if (!isAdministratorUser(user)) return <Navigate to="/manage" />;
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

const ContractsRoute = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  if (!hasPermission(user, 'contracts.view')) return <Navigate to="/manage" />;
  return <>{children}</>;
};

const ContractsManageRoute = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  if (!hasPermission(user, 'contracts.manage')) return <Navigate to="/contracts" />;
  return <>{children}</>;
};

const ContractTemplatesRoute = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  if (!hasPermission(user, 'templates.manage')) return <Navigate to="/contracts" />;
  return <>{children}</>;
};

const ReportsRoute = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  if (!hasPermission(user, 'reports.view')) return <Navigate to="/manage" />;
  return <>{children}</>;
};

const PropertiesRoute = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  if (!hasPermission(user, 'properties.view')) return <Navigate to="/manage" />;
  return <>{children}</>;
};

const UnitsRoute = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  if (!hasPermission(user, 'units.view')) return <Navigate to="/manage" />;
  return <>{children}</>;
};

const TenantsRoute = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  if (!hasPermission(user, 'tenants.view')) return <Navigate to="/manage" />;
  return <>{children}</>;
};

const RentRoute = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  if (!hasPermission(user, 'payments.view') && !hasPermission(user, 'arrears.view')) return <Navigate to="/manage" />;
  return <>{children}</>;
};

const StaffMaintenanceRoute = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  if (!hasPermission(user, 'maintenance.view')) return <Navigate to="/manage" />;
  return <>{children}</>;
};

const MessagesRoute = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  if (!hasPermission(user, 'messages.view') && !hasPermission(user, 'flux.use')) return <Navigate to="/manage" />;
  return <>{children}</>;
};

function StaffHomeDashboard() {
  const { user } = useAuth();
  const role = effectiveStaffRole(user);
  if (isSuperAdminUser(user)) return <Navigate to="/control-center" replace />;
  if (isAdministratorUser(user)) return <Navigate to="/administrator" replace />;
  switch (role) {
    case 'finance_accountant':
      return <FinanceDashboard />;
    case 'maintenance_manager':
      return <MaintenanceManagerDashboard />;
    case 'maintenance_technician':
      return <MaintenanceTechnicianDashboard />;
    case 'reception_support':
      return <ReceptionSupportDashboard />;
    case 'auditor':
      return <AuditorDashboard />;
    case 'property_manager':
      return <PropertyManagerDashboard />;
    default:
      // Dedicated dashboards for operational staff; safe fallback for unknown staff
      return <PropertyManagerDashboard />;
  }
}

function AppRoutes() {
  const { user } = useAuth();
  const isTenant = isTenantUser(user);
  const signedInHome = isTenant
    ? '/tenant-dashboard'
    : isSuperAdminUser(user)
      ? '/control-center'
      : isAdministratorUser(user)
        ? '/administrator'
        : '/manage';

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
        
        {/* Role-based home dashboards */}
        <Route path="/manage" element={<ProtectedRoute>{isTenant ? <TenantDashboard /> : <StaffHomeDashboard />}</ProtectedRoute>} />
        <Route path="/tenant-dashboard" element={<ProtectedRoute><TenantDashboard /></ProtectedRoute>} />
        
        <Route path="/documents" element={<ProtectedRoute><TenantDocuments /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><TenantPayments /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><TenantProfile /></ProtectedRoute>} />

        <Route path="/maintenance" element={
          <ProtectedRoute>
            {isTenant ? <TenantMaintenance /> : <OwnerRoute><StaffMaintenanceRoute><LandlordMaintenance /></StaffMaintenanceRoute></OwnerRoute>}
          </ProtectedRoute>
        } />

        <Route path="/messages" element={<ProtectedRoute>{isTenant ? <Messages /> : <MessagesRoute><Messages /></MessagesRoute>}</ProtectedRoute>} />
        <Route path="/messages/:tenantId" element={<ProtectedRoute>{isTenant ? <Messages /> : <MessagesRoute><Messages /></MessagesRoute>}</ProtectedRoute>} />

        <Route path="/properties" element={<ProtectedRoute><OwnerRoute><PropertiesRoute><Properties /></PropertiesRoute></OwnerRoute></ProtectedRoute>} />
        <Route path="/units" element={<ProtectedRoute><OwnerRoute><UnitsRoute><Units /></UnitsRoute></OwnerRoute></ProtectedRoute>} />
        <Route path="/tenants" element={<ProtectedRoute><OwnerRoute><TenantsRoute><Tenants /></TenantsRoute></OwnerRoute></ProtectedRoute>} />
        <Route path="/applications" element={<ProtectedRoute><OwnerRoute><ApplicationsRoute><Applications /></ApplicationsRoute></OwnerRoute></ProtectedRoute>} />
        <Route path="/tenancy" element={<ProtectedRoute><OwnerRoute><TenancyRoute><Tenancy /></TenancyRoute></OwnerRoute></ProtectedRoute>} />
        <Route path="/rent" element={<ProtectedRoute><OwnerRoute><RentRoute><Rent /></RentRoute></OwnerRoute></ProtectedRoute>} />
        <Route path="/budgets" element={<ProtectedRoute><OwnerRoute><BudgetsRoute><Budgets /></BudgetsRoute></OwnerRoute></ProtectedRoute>} />
        <Route path="/contracts" element={<ProtectedRoute><OwnerRoute><ContractsRoute><Contracts /></ContractsRoute></OwnerRoute></ProtectedRoute>} />
        <Route path="/contracts/templates" element={<ProtectedRoute><OwnerRoute><ContractTemplatesRoute><ContractTemplates /></ContractTemplatesRoute></OwnerRoute></ProtectedRoute>} />
        <Route path="/contracts/new" element={<ProtectedRoute><OwnerRoute><ContractsManageRoute><ContractWizard /></ContractsManageRoute></OwnerRoute></ProtectedRoute>} />
        <Route path="/contracts/:id/edit" element={<ProtectedRoute><OwnerRoute><ContractsManageRoute><ContractWizard /></ContractsManageRoute></OwnerRoute></ProtectedRoute>} />
        <Route path="/contracts/:id" element={<ProtectedRoute><OwnerRoute><ContractsRoute><ContractDetail /></ContractsRoute></OwnerRoute></ProtectedRoute>} />
        <Route path="/landlord-profile" element={<ProtectedRoute><OwnerRoute><LandlordProfile /></OwnerRoute></ProtectedRoute>} />
        <Route path="/security" element={<ProtectedRoute><Security /></ProtectedRoute>} />
        <Route path="/control-center" element={<ProtectedRoute><SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><SuperAdminRoute><Navigate to="/control-center" replace /></SuperAdminRoute></ProtectedRoute>} />
        <Route path="/administrator" element={<ProtectedRoute><AdministratorRoute><AdministratorDashboard /></AdministratorRoute></ProtectedRoute>} />
        <Route path="/design-system" element={<ProtectedRoute><AdministratorRoute><DesignSystem /></AdministratorRoute></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><OwnerRoute><ReportsRoute><Analytics /></ReportsRoute></OwnerRoute></ProtectedRoute>} />
        <Route path="/governance" element={<ProtectedRoute><AdministratorRoute><Governance /></AdministratorRoute></ProtectedRoute>} />
        <Route path="/staff" element={<ProtectedRoute><StaffRoute><Staff /></StaffRoute></ProtectedRoute>} />
        <Route path="/staff/:id" element={<ProtectedRoute><StaffRoute><StaffDetail /></StaffRoute></ProtectedRoute>} />

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