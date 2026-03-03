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

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],
      customers: [],
      leads: [],
      calls: [],
      notifications: [],
      auditLogs: [],
      claims: [],
      commissions: [],
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

        fetch(`${API_BASE}/users/${userId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: newPass })
        });

        set(state => ({
          users: state.users.map(u => u.id === userId ? { ...u, password: newPass } : u),
          currentUser: state.currentUser?.id === userId ? { ...state.currentUser, password: newPass } : state.currentUser,
        }));
        return true;
      },

      addUser: async (user) => {
        try {
          const res = await fetch(`${API_BASE}/users`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
          });
          const data = await res.json();
          set(state => ({ users: [...state.users, data] }));
        } catch (e) { console.error(e); }
      },
      updateUser: async (userId, updates) => {
        try {
          const res = await fetch(`${API_BASE}/users/${userId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
          });
          const data = await res.json();
          set(state => ({ users: state.users.map(u => u.id === userId ? { ...u, ...data } : u) }));
        } catch (e) { console.error(e); }
      },
      deleteUser: async (userId) => {
        try {
          await fetch(`${API_BASE}/users/${userId}`, { method: 'DELETE' });
          set(state => ({ users: state.users.filter(u => u.id !== userId) }));
        } catch (e) { console.error(e); }
      },

      addCustomer: async (customer) => {
        try {
          const res = await fetch(`${API_BASE}/customers`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customer)
          });
          if (res.ok) {
            const data = await res.json();
            set(state => ({ customers: [...state.customers, data] }));
          }
        } catch (e) { console.error('Failed to create customer', e); }
      },

      updateCustomer: async (customerId, updates) => {
        try {
          const res = await fetch(`${API_BASE}/customers/${customerId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...updates, updatedAt: new Date().toISOString() })
          });
          const data = await res.json();
          set(state => ({
            customers: state.customers.map(c => c.id === customerId ? { ...c, ...data } : c),
          }));
        } catch (e) { console.error(e); }
      },

      deleteCustomer: async (customerId) => {
        try {
          await fetch(`${API_BASE}/customers/${customerId}`, { method: 'DELETE' });
          set(state => ({ customers: state.customers.filter(c => c.id !== customerId) }));
        } catch (e) { console.error(e); }
      },

      approveCustomer: async (customerId, adminId) => {
        try {
          const updates = { status: 'approved' as const, approvedBy: adminId, approvedAt: new Date().toISOString() };
          await fetch(`${API_BASE}/customers/${customerId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
          });
          set(state => ({
            customers: state.customers.map(c => c.id === customerId ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c)
          }));
          const customer = get().customers.find(c => c.id === customerId);
          if (customer) {
            const notif = { id: `notif-${Date.now()}`, userId: customer.agentId, title: 'Customer Approved! ✅', message: `${customer.name}'s registration has been approved.`, type: 'approved' as const, isRead: false, createdAt: new Date().toISOString() };
            await fetch(`${API_BASE}/notifications`, { method: 'POST', body: JSON.stringify(notif), headers: { 'Content-Type': 'application/json' } });
            set(state => ({ notifications: [...state.notifications, notif] }));
          }
        } catch (e) { console.error(e); }
      },

      rejectCustomer: async (customerId, reason, adminId) => {
        try {
          const updates = { status: 'rejected' as const, rejectionReason: reason, approvedBy: adminId };
          await fetch(`${API_BASE}/customers/${customerId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
          });
          set(state => ({
            customers: state.customers.map(c => c.id === customerId ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c)
          }));
          const customer = get().customers.find(c => c.id === customerId);
          if (customer) {
            const notif = { id: `notif-${Date.now()}`, userId: customer.agentId, title: 'Customer Rejected ❌', message: `${customer.name}'s registration was rejected. Reason: ${reason}`, type: 'rejected' as const, isRead: false, createdAt: new Date().toISOString() };
            await fetch(`${API_BASE}/notifications`, { method: 'POST', body: JSON.stringify(notif), headers: { 'Content-Type': 'application/json' } });
            set(state => ({ notifications: [...state.notifications, notif] }));
          }
        } catch (e) { console.error(e); }
      },

      bulkApprove: (customerIds, adminId) => {
        customerIds.forEach(id => get().approveCustomer(id, adminId));
      },

      bulkReject: (customerIds, reason, adminId) => {
        customerIds.forEach(id => get().rejectCustomer(id, reason, adminId));
      },

      importCustomers: async (newCustomers) => {
        // Normally you'd want a bulk insert endpoint. For now, firing off individual Posts.
        for (const cust of newCustomers) {
          await get().addCustomer(cust);
        }
      },

      addPolicyToCustomer: async (customerId, policy) => {
        try {
          const res = await fetch(`${API_BASE}/customers/${customerId}/policies`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(policy)
          });
          const data = await res.json();
          set(state => ({
            customers: state.customers.map(c => c.id === customerId ? { ...c, policies: [...c.policies, data], updatedAt: new Date().toISOString() } : c),
          }));
        } catch (e) { console.error(e); }
      },

      updatePolicy: async (customerId, policyId, updates) => {
        try {
          await fetch(`${API_BASE}/policies/${policyId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
          });
          set(state => ({
            customers: state.customers.map(c => c.id === customerId ? { ...c, policies: c.policies.map(p => p.id === policyId ? { ...p, ...updates } : p) } : c),
          }));
        } catch (e) { console.error(e); }
      },

      addLead: async (lead) => {
        try {
          const res = await fetch(`${API_BASE}/leads`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lead)
          });
          const data = await res.json();
          set(state => ({ leads: [...state.leads, data] }));
        } catch (e) { console.error('Failed to create lead', e); }
      },
      updateLead: async (leadId, updates) => {
        try {
          const res = await fetch(`${API_BASE}/leads/${leadId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...updates, updatedAt: new Date().toISOString() })
          });
          const data = await res.json();
          set(state => ({ leads: state.leads.map(l => l.id === leadId ? { ...l, ...data } : l) }));
        } catch (e) { console.error(e); }
      },
      deleteLead: async (leadId) => {
        try {
          await fetch(`${API_BASE}/leads/${leadId}`, { method: 'DELETE' });
          set(state => ({ leads: state.leads.filter(l => l.id !== leadId) }));
        } catch (e) { console.error(e); }
      },

      addCall: async (call) => {
        try {
          const res = await fetch(`${API_BASE}/calls`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(call)
          });
          const data = await res.json();
          set(state => ({ calls: [...state.calls, data] }));
        } catch (e) { console.error(e); }
      },
      updateCall: async (callId, updates) => {
        try {
          const res = await fetch(`${API_BASE}/calls/${callId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
          });
          const data = await res.json();
          set(state => ({ calls: state.calls.map(c => c.id === callId ? { ...c, ...data } : c) }));
        } catch (e) { console.error(e); }
      },

      addNotification: async (notif) => {
        try {
          const res = await fetch(`${API_BASE}/notifications`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(notif)
          });
          const data = await res.json();
          set(state => ({ notifications: [...state.notifications, data] }));
        } catch (e) { console.error(e); }
      },
      markNotificationRead: async (notifId) => {
        try {
          await fetch(`${API_BASE}/notifications/${notifId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isRead: true })
          });
          set(state => ({ notifications: state.notifications.map(n => n.id === notifId ? { ...n, isRead: true } : n) }));
        } catch (e) { console.error(e); }
      },
      markAllNotificationsRead: async (userId) => {
        try {
          const userNotifs = get().notifications.filter(n => n.userId === userId && !n.isRead);
          for (const n of userNotifs) {
            await fetch(`${API_BASE}/notifications/${n.id}`, {
              method: 'PUT', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isRead: true })
            });
          }
          set(state => ({ notifications: state.notifications.map(n => n.userId === userId ? { ...n, isRead: true } : n) }));
        } catch (e) { console.error(e); }
      },
      clearNotifications: async (userId) => {
        try {
          await fetch(`${API_BASE}/notifications/user/${userId}`, { method: 'DELETE' });
          set(state => ({ notifications: state.notifications.filter(n => n.userId !== userId) }));
        } catch (e) { console.error(e); }
      },

      addAuditLog: async (log) => {
        try {
          const res = await fetch(`${API_BASE}/auditLogs`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(log)
          });
          const data = await res.json();
          set(state => ({ auditLogs: [data, ...state.auditLogs] }));
        } catch (e) { console.error(e); }
      },

      addClaim: async (claim) => {
        try {
          const res = await fetch(`${API_BASE}/claims`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(claim)
          });
          const data = await res.json();
          set(state => ({ claims: [...state.claims, data] }));
        } catch (e) { console.error(e); }
      },
      updateClaim: async (claimId, updates) => {
        try {
          const res = await fetch(`${API_BASE}/claims/${claimId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
          });
          const data = await res.json();
          set(state => ({ claims: state.claims.map(c => c.id === claimId ? { ...c, ...data } : c) }));
        } catch (e) { console.error(e); }
      },

      addCommission: async (commission) => {
        try {
          const res = await fetch(`${API_BASE}/commissions`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(commission)
          });
          const data = await res.json();
          set(state => ({ commissions: [...state.commissions, data] }));
        } catch (e) { console.error(e); }
      },
      updateCommission: async (commId, updates) => {
        try {
          const res = await fetch(`${API_BASE}/commissions/${commId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
          });
          const data = await res.json();
          set(state => ({ commissions: state.commissions.map(c => c.id === commId ? { ...c, ...data } : c) }));
        } catch (e) { console.error(e); }
      }
    }),
    {
      name: 'uv-insurance-storage-v4',
      partialize: (state) => ({
        // Even though data is in DB, caching in localStorage speeds up initial paint 
        // before hydration from server succeeds
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
