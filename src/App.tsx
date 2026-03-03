import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAppStore } from './store/appStore';
import Layout from './components/Layout';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import Login from './pages/Login';
import CustomerForm from './pages/CustomerForm';
import NewCustomerForm from './pages/shared/NewCustomerForm';
import ExistingCustomerPolicy from './pages/shared/ExistingCustomerPolicy';

// Owner pages
import OwnerDashboard from './pages/owner/Dashboard';
import Approvals from './pages/owner/Approvals';
import AgentManagement from './pages/owner/AgentManagement';
import OwnerSettings from './pages/owner/Settings';
import OwnerReports from './pages/owner/Reports';
import OwnerClaims from './pages/owner/Claims';
import OwnerCommissions from './pages/owner/Commissions';

// Employee pages
import EmployeeDashboard from './pages/employee/Dashboard';
import EmployeePolicies from './pages/employee/Policies';
import EmployeeRenewals from './pages/employee/Renewals';
import EmployeeClaims from './pages/employee/Claims';
import EmployeeCommissions from './pages/employee/Commissions';

// Shared pages
import CustomerList from './pages/shared/CustomerList';
import CustomerDetail from './pages/shared/CustomerDetail';
import LeadManagement from './pages/shared/LeadManagement';
import CallTracker from './pages/shared/CallTracker';
import PremiumCalculator from './pages/shared/PremiumCalculator';
import ProfilePage from './pages/shared/ProfilePage';
import NotificationsPage from './pages/shared/NotificationsPage';
import ChangePassword from './pages/shared/ChangePassword';
import BulkImport from './pages/shared/BulkImport';

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: 'owner' | 'employee' }) {
  const { currentUser } = useAppStore();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (role && currentUser.role !== role) {
    return <Navigate to={currentUser.role === 'owner' ? '/owner/dashboard' : '/employee/dashboard'} replace />;
  }
  return <Layout>{children}</Layout>;
}

import { useEffect } from 'react';

export function App() {
  const { currentUser } = useAppStore();

  // Initial Database Load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, leadsRes, claimsRes, commRes, callsRes, usersRes] = await Promise.all([
          fetch('http://localhost:3001/api/customers'),
          fetch('http://localhost:3001/api/leads'),
          fetch('http://localhost:3001/api/claims'),
          fetch('http://localhost:3001/api/commissions'),
          fetch('http://localhost:3001/api/calls'),
          fetch('http://localhost:3001/api/users')
        ]);

        const [customers, leads, claims, commissions, calls, users] = await Promise.all([
          custRes.json(), leadsRes.json(), claimsRes.json(), commRes.json(), callsRes.json(), usersRes.json()
        ]);

        useAppStore.setState({ customers, leads, claims, commissions, calls, users });
      } catch (e) {
        console.error('Failed to load initial DB state', e);
      }
    };
    fetchData();
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#1e293b', color: '#f8fafc', fontSize: '13px', borderRadius: '10px', padding: '12px 16px' },
          success: { iconTheme: { primary: '#10b981', secondary: '#f8fafc' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#f8fafc' } },
        }}
      />
      <PWAInstallPrompt />

      <Routes>
        <Route path="/login" element={currentUser ? <Navigate to={currentUser.role === 'owner' ? '/owner/dashboard' : '/employee/dashboard'} /> : <Login />} />
        <Route path="/" element={<Navigate to={currentUser ? (currentUser.role === 'owner' ? '/owner/dashboard' : '/employee/dashboard') : '/login'} />} />

        {/* OWNER ROUTES */}
        <Route path="/owner/dashboard" element={<ProtectedRoute role="owner"><OwnerDashboard /></ProtectedRoute>} />
        <Route path="/owner/approvals" element={<ProtectedRoute role="owner"><Approvals /></ProtectedRoute>} />
        <Route path="/owner/customers" element={<ProtectedRoute role="owner"><CustomerList /></ProtectedRoute>} />
        <Route path="/owner/customers/new" element={<ProtectedRoute role="owner"><CustomerForm /></ProtectedRoute>} />
        <Route path="/owner/customers/new-form" element={<ProtectedRoute role="owner"><NewCustomerForm /></ProtectedRoute>} />
        <Route path="/owner/customers/existing" element={<ProtectedRoute role="owner"><ExistingCustomerPolicy /></ProtectedRoute>} />
        <Route path="/owner/customers/import" element={<ProtectedRoute role="owner"><BulkImport /></ProtectedRoute>} />
        <Route path="/owner/customers/:id" element={<ProtectedRoute role="owner"><CustomerDetail /></ProtectedRoute>} />
        <Route path="/owner/agents" element={<ProtectedRoute role="owner"><AgentManagement /></ProtectedRoute>} />
        <Route path="/owner/leads" element={<ProtectedRoute role="owner"><LeadManagement /></ProtectedRoute>} />
        <Route path="/owner/calls" element={<ProtectedRoute role="owner"><CallTracker /></ProtectedRoute>} />
        <Route path="/owner/claims" element={<ProtectedRoute role="owner"><OwnerClaims /></ProtectedRoute>} />
        <Route path="/owner/commissions" element={<ProtectedRoute role="owner"><OwnerCommissions /></ProtectedRoute>} />
        <Route path="/owner/reports" element={<ProtectedRoute role="owner"><OwnerReports /></ProtectedRoute>} />
        <Route path="/owner/settings" element={<ProtectedRoute role="owner"><OwnerSettings /></ProtectedRoute>} />
        <Route path="/owner/notifications" element={<ProtectedRoute role="owner"><NotificationsPage /></ProtectedRoute>} />
        <Route path="/owner/profile" element={<ProtectedRoute role="owner"><ProfilePage /></ProtectedRoute>} />
        <Route path="/owner/change-password" element={<ProtectedRoute role="owner"><ChangePassword /></ProtectedRoute>} />

        {/* EMPLOYEE ROUTES */}
        <Route path="/employee/dashboard" element={<ProtectedRoute role="employee"><EmployeeDashboard /></ProtectedRoute>} />
        <Route path="/employee/customers" element={<ProtectedRoute role="employee"><CustomerList isEmployee /></ProtectedRoute>} />
        <Route path="/employee/customers/new" element={<ProtectedRoute role="employee"><CustomerForm isEmployee /></ProtectedRoute>} />
        <Route path="/employee/customers/new-form" element={<ProtectedRoute role="employee"><NewCustomerForm isEmployee /></ProtectedRoute>} />
        <Route path="/employee/customers/existing" element={<ProtectedRoute role="employee"><ExistingCustomerPolicy isEmployee /></ProtectedRoute>} />
        <Route path="/employee/customers/import" element={<ProtectedRoute role="employee"><BulkImport isEmployee /></ProtectedRoute>} />
        <Route path="/employee/customers/:id" element={<ProtectedRoute role="employee"><CustomerDetail isEmployee /></ProtectedRoute>} />
        <Route path="/employee/policies" element={<ProtectedRoute role="employee"><EmployeePolicies /></ProtectedRoute>} />
        <Route path="/employee/renewals" element={<ProtectedRoute role="employee"><EmployeeRenewals /></ProtectedRoute>} />
        <Route path="/employee/leads" element={<ProtectedRoute role="employee"><LeadManagement isEmployee /></ProtectedRoute>} />
        <Route path="/employee/calls" element={<ProtectedRoute role="employee"><CallTracker isEmployee /></ProtectedRoute>} />
        <Route path="/employee/claims" element={<ProtectedRoute role="employee"><EmployeeClaims /></ProtectedRoute>} />
        <Route path="/employee/commissions" element={<ProtectedRoute role="employee"><EmployeeCommissions /></ProtectedRoute>} />
        <Route path="/employee/calculator" element={<ProtectedRoute role="employee"><PremiumCalculator /></ProtectedRoute>} />
        <Route path="/employee/notifications" element={<ProtectedRoute role="employee"><NotificationsPage /></ProtectedRoute>} />
        <Route path="/employee/profile" element={<ProtectedRoute role="employee"><ProfilePage /></ProtectedRoute>} />
        <Route path="/employee/change-password" element={<ProtectedRoute role="employee"><ChangePassword /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
