import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Customer, Lead, CallRecord, Notification, AuditLog, Policy, Claim, Commission } from '../types';

interface AppStore {
  currentUser: User | null;
  users: User[];
  customers: Customer[];
  leads: Lead[];
  calls: CallRecord[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  claims: Claim[];
  commissions: Commission[];
  darkMode: boolean;

  toggleDarkMode: () => void;
  login: (email: string, password: string) => User | null;
  logout: () => void;
  changePassword: (userId: string, oldPass: string, newPass: string) => boolean;

  addUser: (user: User) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;

  addCustomer: (customer: Customer) => void;
  updateCustomer: (customerId: string, updates: Partial<Customer>) => void;
  approveCustomer: (customerId: string, adminId: string) => void;
  rejectCustomer: (customerId: string, reason: string, adminId: string) => void;
  addPolicyToCustomer: (customerId: string, policy: Policy) => void;
  updatePolicy: (customerId: string, policyId: string, updates: Partial<Policy>) => void;
  deleteCustomer: (customerId: string) => void;
  bulkApprove: (customerIds: string[], adminId: string) => void;
  bulkReject: (customerIds: string[], reason: string, adminId: string) => void;
  importCustomers: (customers: Customer[]) => void;

  addLead: (lead: Lead) => void;
  updateLead: (leadId: string, updates: Partial<Lead>) => void;
  deleteLead: (leadId: string) => void;

  addCall: (call: CallRecord) => void;
  updateCall: (callId: string, updates: Partial<CallRecord>) => void;

  addNotification: (notification: Notification) => void;
  markNotificationRead: (notifId: string) => void;
  markAllNotificationsRead: (userId: string) => void;
  clearNotifications: (userId: string) => void;

  addAuditLog: (log: AuditLog) => void;

  addClaim: (claim: Claim) => void;
  updateClaim: (claimId: string, updates: Partial<Claim>) => void;

  addCommission: (commission: Commission) => void;
  updateCommission: (commId: string, updates: Partial<Commission>) => void;
}

const defaultOwner: User = {
  id: 'owner-1',
  name: 'UV Insurance Admin',
  email: 'admin@uvinsurance.com',
  password: 'Admin@123',
  role: 'owner',
  phone: '+91 9876543210',
  isActive: true,
  createdAt: new Date().toISOString(),
};

const defaultEmployee: User = {
  id: 'emp-1',
  name: 'Priya Singh',
  email: 'priya@uvinsurance.com',
  password: 'Employee@123',
  role: 'employee',
  phone: '+91 9876543211',
  isActive: true,
  createdAt: new Date().toISOString(),
};

const defaultEmployee2: User = {
  id: 'emp-2',
  name: 'Rahul Mehta',
  email: 'rahul@uvinsurance.com',
  password: 'Employee@123',
  role: 'employee',
  phone: '+91 9876543212',
  isActive: true,
  createdAt: new Date().toISOString(),
};

const defaultEmployee3: User = {
  id: 'emp-3',
  name: 'Sneha Reddy',
  email: 'sneha@uvinsurance.com',
  password: 'Employee@123',
  role: 'employee',
  phone: '+91 9876543213',
  isActive: true,
  createdAt: new Date().toISOString(),
};

const sampleCustomers: Customer[] = [
  {
    id: 'cust-1', customerId: 'CUS-100001', isExisting: false,
    name: 'Rajesh Kumar', phone: '+91 9876543220', email: 'rajesh@example.com',
    address: '123 MG Road, Mumbai, Maharashtra 400001', dob: '1985-03-15',
    status: 'pending', agentId: 'emp-1', documents: [], policies: [],
    notes: 'Interested in health insurance',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(), notificationSent: true,
  },
  {
    id: 'cust-2', customerId: 'CUS-100002', isExisting: true,
    name: 'Anita Sharma', phone: '+91 9876543221', email: 'anita@example.com',
    address: '456 Brigade Road, Bangalore, Karnataka 560001', dob: '1990-07-22',
    status: 'approved', agentId: 'emp-1', documents: [],
    policies: [{
      id: 'pol-1', customerId: 'cust-2', type: 'health', policyNumber: 'POL-100234',
      insurer: 'Star Health', premium: 15000, sumAssured: 500000,
      startDate: '2024-01-01', endDate: '2025-01-01', status: 'active',
      renewalDate: '2025-01-01', documents: [],
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      createdBy: 'emp-1', agentId: 'emp-1',
    }],
    notes: '', createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(), approvedBy: 'owner-1',
    approvedAt: new Date(Date.now() - 29 * 86400000).toISOString(), notificationSent: true,
  },
  {
    id: 'cust-3', customerId: 'CUS-100003', isExisting: false,
    name: 'Mohan Verma', phone: '+91 9876543222', email: 'mohan@example.com',
    address: '789 Anna Salai, Chennai, Tamil Nadu 600002', dob: '1978-11-30',
    status: 'pending', agentId: 'emp-1', documents: [], policies: [],
    notes: 'Looking for motor insurance for car',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(), notificationSent: true,
  },
  {
    id: 'cust-4', customerId: 'CUS-100004', isExisting: false,
    name: 'Sunita Patel', phone: '+91 9876543223', email: 'sunita@example.com',
    address: '12 Park Street, Kolkata, West Bengal 700016', dob: '1992-05-18',
    status: 'approved', agentId: 'emp-2', documents: [],
    policies: [{
      id: 'pol-2', customerId: 'cust-4', type: 'life', policyNumber: 'POL-100456',
      insurer: 'LIC of India', premium: 25000, sumAssured: 1000000,
      startDate: '2024-03-01', endDate: '2044-03-01', status: 'active',
      renewalDate: '2025-03-01', documents: [],
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      createdBy: 'emp-2', agentId: 'emp-2',
    }],
    notes: 'Wants life policy for 20 years',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(), approvedBy: 'owner-1',
    approvedAt: new Date(Date.now() - 19 * 86400000).toISOString(), notificationSent: true,
  },
  {
    id: 'cust-5', customerId: 'CUS-100005', isExisting: true,
    name: 'Vikram Reddy', phone: '+91 9876543224', email: 'vikram@example.com',
    address: '55 Banjara Hills, Hyderabad, Telangana 500034', dob: '1980-09-10',
    status: 'approved', agentId: 'emp-2', documents: [],
    policies: [{
      id: 'pol-3', customerId: 'cust-5', type: 'motor', policyNumber: 'POL-100789',
      insurer: 'HDFC ERGO', premium: 8500, sumAssured: 550000,
      startDate: '2024-06-01', endDate: '2025-06-01', status: 'active',
      renewalDate: '2025-06-01', documents: [],
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      createdBy: 'emp-2', agentId: 'emp-2',
    }],
    notes: 'Motor insurance for Hyundai i20',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(), approvedBy: 'owner-1',
    approvedAt: new Date(Date.now() - 9 * 86400000).toISOString(), notificationSent: true,
  },
  {
    id: 'cust-6', customerId: 'CUS-100006', isExisting: false,
    name: 'Deepak Joshi', phone: '+91 9876543225', email: 'deepak@example.com',
    address: '88 Connaught Place, New Delhi 110001', dob: '1988-12-05',
    status: 'approved', agentId: 'emp-3', documents: [],
    policies: [{
      id: 'pol-4', customerId: 'cust-6', type: 'health', policyNumber: 'POL-100901',
      insurer: 'ICICI Lombard', premium: 12000, sumAssured: 300000,
      startDate: '2024-08-01', endDate: '2025-08-01', status: 'active',
      renewalDate: '2025-08-01', documents: [],
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      createdBy: 'emp-3', agentId: 'emp-3',
    }],
    notes: 'Health policy with family floater',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(), approvedBy: 'owner-1',
    approvedAt: new Date(Date.now() - 4 * 86400000).toISOString(), notificationSent: true,
  },
];

const sampleLeads: Lead[] = [
  { id: 'lead-1', name: 'Suresh Patel', phone: '+91 9123456789', email: 'suresh@example.com', source: 'Referral', status: 'new', policyInterest: ['life'], notes: 'Referred by Rajesh Kumar', agentId: 'emp-1', createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'lead-2', name: 'Kavitha Nair', phone: '+91 9234567890', email: 'kavitha@example.com', source: 'Online', status: 'interested', policyInterest: ['health', 'life'], notes: 'Very interested, follow up next week', agentId: 'emp-1', followUpDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'lead-3', name: 'Arun Kumar', phone: '+91 9345678901', email: 'arun@example.com', source: 'Walk-in', status: 'contacted', policyInterest: ['motor'], notes: 'Interested in car insurance', agentId: 'emp-2', createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'lead-4', name: 'Meera Iyer', phone: '+91 9456789012', email: 'meera@example.com', source: 'Social Media', status: 'new', policyInterest: ['health'], notes: 'Found us on Instagram, wants family health plan', agentId: 'emp-3', createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString() },
];

const sampleCalls: CallRecord[] = [
  { id: 'call-1', leadId: 'lead-1', agentId: 'emp-1', contactName: 'Suresh Patel', phone: '+91 9123456789', duration: 8, status: 'completed', notes: 'Discussed life insurance options. Very interested.', completedAt: new Date(Date.now() - 2 * 86400000).toISOString(), createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'call-2', leadId: 'lead-3', agentId: 'emp-2', contactName: 'Arun Kumar', phone: '+91 9345678901', duration: 5, status: 'completed', notes: 'Discussed motor insurance. Will visit office.', completedAt: new Date(Date.now() - 86400000).toISOString(), createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'call-3', leadId: 'lead-4', agentId: 'emp-3', contactName: 'Meera Iyer', phone: '+91 9456789012', duration: 12, status: 'completed', notes: 'Explained family floater plan. Wants to meet in person.', completedAt: new Date(Date.now() - 86400000).toISOString(), createdAt: new Date(Date.now() - 86400000).toISOString() },
];

const sampleCommissions: Commission[] = [
  { id: 'comm-1', agentId: 'emp-1', customerId: 'cust-2', customerName: 'Anita Sharma', policyId: 'pol-1', policyNumber: 'POL-100234', policyType: 'health', commissionType: 'first_year', amount: 3000, status: 'paid', paidAt: new Date(Date.now() - 25 * 86400000).toISOString(), createdAt: new Date(Date.now() - 28 * 86400000).toISOString() },
  { id: 'comm-2', agentId: 'emp-2', customerId: 'cust-4', customerName: 'Sunita Patel', policyId: 'pol-2', policyNumber: 'POL-100456', policyType: 'life', commissionType: 'first_year', amount: 7500, status: 'approved', createdAt: new Date(Date.now() - 18 * 86400000).toISOString() },
  { id: 'comm-3', agentId: 'emp-2', customerId: 'cust-5', customerName: 'Vikram Reddy', policyId: 'pol-3', policyNumber: 'POL-100789', policyType: 'motor', commissionType: 'first_year', amount: 1700, status: 'pending', createdAt: new Date(Date.now() - 8 * 86400000).toISOString() },
  { id: 'comm-4', agentId: 'emp-3', customerId: 'cust-6', customerName: 'Deepak Joshi', policyId: 'pol-4', policyNumber: 'POL-100901', policyType: 'health', commissionType: 'first_year', amount: 2400, status: 'pending', createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
];

const sampleClaims: Claim[] = [
  { id: 'claim-1', claimNumber: 'CLM-1001', policyId: 'pol-1', customerId: 'cust-2', customerName: 'Anita Sharma', policyNumber: 'POL-100234', policyType: 'health', claimDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0], claimAmount: 25000, approvedAmount: 0, status: 'submitted', claimType: 'Hospitalization', description: 'Admitted for dengue treatment', documents: [], notes: 'Awaiting hospital bills', agentId: 'emp-1', createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
];

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [defaultOwner, defaultEmployee, defaultEmployee2, defaultEmployee3],
      customers: sampleCustomers,
      leads: sampleLeads,
      calls: sampleCalls,
      notifications: [
        { id: 'notif-1', userId: 'owner-1', title: 'New Customer Pending Approval', message: 'Rajesh Kumar has been submitted for approval by Priya Singh.', type: 'approval_request', isRead: false, link: '/owner/approvals', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
        { id: 'notif-2', userId: 'owner-1', title: 'New Customer Pending Approval', message: 'Mohan Verma has been submitted for approval by Priya Singh.', type: 'approval_request', isRead: false, link: '/owner/approvals', createdAt: new Date(Date.now() - 86400000).toISOString() },
      ],
      auditLogs: [],
      claims: sampleClaims,
      commissions: sampleCommissions,
      darkMode: false,

      toggleDarkMode: () => set(state => {
        const newMode = !state.darkMode;
        if (newMode) { document.documentElement.classList.add('dark'); }
        else { document.documentElement.classList.remove('dark'); }
        return { darkMode: newMode };
      }),

      login: (email, password) => {
        const user = get().users.find(u => u.email === email && u.password === password && u.isActive);
        if (user) {
          const updatedUser = { ...user, lastLogin: new Date().toISOString() };
          set(state => ({
            currentUser: updatedUser,
            users: state.users.map(u => u.id === user.id ? updatedUser : u),
          }));
          return updatedUser;
        }
        return null;
      },

      logout: () => set({ currentUser: null }),

      changePassword: (userId, oldPass, newPass) => {
        const user = get().users.find(u => u.id === userId);
        if (!user || user.password !== oldPass) return false;
        set(state => ({
          users: state.users.map(u => u.id === userId ? { ...u, password: newPass } : u),
          currentUser: state.currentUser?.id === userId ? { ...state.currentUser, password: newPass } : state.currentUser,
        }));
        return true;
      },

      addUser: (user) => set(state => ({ users: [...state.users, user] })),
      updateUser: (userId, updates) => set(state => ({
        users: state.users.map(u => u.id === userId ? { ...u, ...updates } : u),
      })),
      deleteUser: (userId) => set(state => ({
        users: state.users.filter(u => u.id !== userId),
      })),

      addCustomer: async (customer) => {
        try {
          const res = await fetch('http://localhost:3001/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customer)
          });
          const data = await res.json();
          set(state => ({ customers: [...state.customers, data] }));
        } catch (e) { console.error('Failed to create customer', e); }
      },

      updateCustomer: (customerId, updates) => set(state => ({
        customers: state.customers.map(c => c.id === customerId ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c),
      })),

      deleteCustomer: (customerId) => set(state => ({
        customers: state.customers.filter(c => c.id !== customerId),
      })),

      approveCustomer: (customerId, adminId) => {
        set(state => ({
          customers: state.customers.map(c =>
            c.id === customerId
              ? { ...c, status: 'approved' as const, approvedBy: adminId, approvedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : c
          ),
        }));
        const customer = get().customers.find(c => c.id === customerId);
        if (customer) {
          set(state => ({ notifications: [...state.notifications, { id: `notif-${Date.now()}`, userId: customer.agentId, title: 'Customer Approved! ✅', message: `${customer.name}'s registration has been approved.`, type: 'approved' as const, isRead: false, createdAt: new Date().toISOString() }] }));
        }
      },

      rejectCustomer: (customerId, reason, adminId) => {
        set(state => ({
          customers: state.customers.map(c =>
            c.id === customerId
              ? { ...c, status: 'rejected' as const, rejectionReason: reason, approvedBy: adminId, updatedAt: new Date().toISOString() }
              : c
          ),
        }));
        const customer = get().customers.find(c => c.id === customerId);
        if (customer) {
          set(state => ({ notifications: [...state.notifications, { id: `notif-${Date.now()}`, userId: customer.agentId, title: 'Customer Rejected ❌', message: `${customer.name}'s registration was rejected. Reason: ${reason}`, type: 'rejected' as const, isRead: false, createdAt: new Date().toISOString() }] }));
        }
      },

      bulkApprove: (customerIds, adminId) => {
        customerIds.forEach(id => get().approveCustomer(id, adminId));
      },

      bulkReject: (customerIds, reason, adminId) => {
        customerIds.forEach(id => get().rejectCustomer(id, reason, adminId));
      },

      importCustomers: (newCustomers) => {
        set(state => ({ customers: [...state.customers, ...newCustomers] }));
        const owners = get().users.filter(u => u.role === 'owner');
        // Let's assume hitting the HTTP route instead of local updates
      },

      addPolicyToCustomer: (customerId, policy) => {
        set(state => ({
          customers: state.customers.map(c =>
            c.id === customerId
              ? { ...c, policies: [...c.policies, policy], updatedAt: new Date().toISOString() }
              : c
          ),
        }));
      },

      updatePolicy: (customerId, policyId, updates) => set(state => ({
        customers: state.customers.map(c =>
          c.id === customerId
            ? { ...c, policies: c.policies.map(p => p.id === policyId ? { ...p, ...updates } : p) }
            : c
        ),
      })),

      addLead: async (lead) => {
        try {
          const res = await fetch('http://localhost:3001/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lead)
          });
          const data = await res.json();
          set(state => ({ leads: [...state.leads, data] }));
        } catch (e) { console.error('Failed to create lead', e); }
      },
      updateLead: (leadId, updates) => set(state => ({
        leads: state.leads.map(l => l.id === leadId ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l),
      })),
      deleteLead: (leadId) => set(state => ({ leads: state.leads.filter(l => l.id !== leadId) })),

      addCall: async (call) => {
        try {
          const res = await fetch('http://localhost:3001/api/calls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(call)
          });
          const data = await res.json();
          set(state => ({ calls: [...state.calls, data] }));
        } catch (e) { }
      },
      updateCall: (callId, updates) => set(state => ({
        calls: state.calls.map(c => c.id === callId ? { ...c, ...updates } : c),
      })),

      addNotification: (notif) => set(state => ({ notifications: [...state.notifications, notif] })),
      markNotificationRead: (notifId) => set(state => ({
        notifications: state.notifications.map(n => n.id === notifId ? { ...n, isRead: true } : n),
      })),
      markAllNotificationsRead: (userId) => set(state => ({
        notifications: state.notifications.map(n => n.userId === userId ? { ...n, isRead: true } : n),
      })),
      clearNotifications: (userId) => set(state => ({
        notifications: state.notifications.filter(n => n.userId !== userId),
      })),

      addAuditLog: (log) => set(state => ({ auditLogs: [log, ...state.auditLogs] })),

      addClaim: async (claim) => {
        try {
          const res = await fetch('http://localhost:3001/api/claims', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(claim)
          });
          const data = await res.json();
          set(state => ({ claims: [...state.claims, data] }));
        } catch (e) { }
      },
      updateClaim: (claimId, updates) => set(state => ({
        claims: state.claims.map(c => c.id === claimId ? { ...c, ...updates } : c),
      })),

      addCommission: (commission) => set(state => ({ commissions: [...state.commissions, commission] })),
      updateCommission: (commId, updates) => set(state => ({
        commissions: state.commissions.map(c => c.id === commId ? { ...c, ...updates } : c),
      })),
    }),
    {
      name: 'uv-insurance-storage-v4',
      partialize: (state) => ({
        users: state.users,
        customers: state.customers,
        leads: state.leads,
        calls: state.calls,
        notifications: state.notifications,
        auditLogs: state.auditLogs,
        claims: state.claims,
        commissions: state.commissions,
        darkMode: state.darkMode,
      }),
    }
  )
);
