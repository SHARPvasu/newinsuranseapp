import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { Settings, Users, Plus, Trash2, Eye, EyeOff, Shield, Mail, Phone, ToggleLeft, ToggleRight, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import type { User } from '../../types';

export default function OwnerSettings() {
  const { users, addUser, updateUser, deleteUser, currentUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<'general' | 'employees' | 'notifications' | 'security'>('general');
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', phone: '', password: '' });
  const [settings, setSettings] = useState({
    companyName: 'UV Insurance Agency',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    requireApproval: true,
    birthdayWhatsapp: true,
    renewalWhatsapp: true,
    renewalDays: '30',
  });

  const employees = users.filter(u => u.role === 'employee');

  const handleAddEmployee = () => {
    if (!newEmployee.name || !newEmployee.email || !newEmployee.password) {
      toast.error('Name, email, and password are required');
      return;
    }
    if (users.find(u => u.email === newEmployee.email)) {
      toast.error('Email already exists');
      return;
    }
    const user: User = {
      id: `emp-${Date.now()}`,
      name: newEmployee.name,
      email: newEmployee.email,
      password: newEmployee.password,
      role: 'employee',
      phone: newEmployee.phone,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    addUser(user);
    toast.success(`Employee ${newEmployee.name} added!`);
    setShowAddEmployee(false);
    setNewEmployee({ name: '', email: '', phone: '', password: '' });
  };

  const handleToggleActive = (userId: string, isActive: boolean) => {
    updateUser(userId, { isActive: !isActive });
    toast.success(`Employee ${isActive ? 'deactivated' : 'activated'}`);
  };

  const handleDeleteEmployee = (userId: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      deleteUser(userId);
      toast.success(`${name} removed`);
    }
  };

  const handleSaveSettings = () => {
    toast.success('Settings saved successfully!');
  };

  const tabs = [
    { key: 'general', label: 'General', icon: Settings },
    { key: 'employees', label: 'Employees', icon: Users },
    { key: 'notifications', label: 'Notifications', icon: Shield },
    { key: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm">Manage your agency settings and employees.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-slate-900">General Settings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Name</label>
              <input value={settings.companyName} onChange={e => setSettings(s => ({ ...s, companyName: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Timezone</label>
              <select value={settings.timezone} onChange={e => setSettings(s => ({ ...s, timezone: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Currency</label>
              <select value={settings.currency} onChange={e => setSettings(s => ({ ...s, currency: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="font-semibold text-slate-900 mb-3">Approval Settings</h3>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-slate-900">Require Admin Approval</p>
                <p className="text-xs text-slate-500">New customers need your approval before activation</p>
              </div>
              <button onClick={() => setSettings(s => ({ ...s, requireApproval: !s.requireApproval }))} className={`${settings.requireApproval ? 'text-blue-600' : 'text-slate-400'}`}>
                {settings.requireApproval ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
              </button>
            </div>
          </div>

          <button onClick={handleSaveSettings} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
            <Save className="w-4 h-4" /> Save Settings
          </button>
        </div>
      )}

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Employees</h2>
              <p className="text-xs text-slate-500">{employees.length} employees</p>
            </div>
            <button onClick={() => setShowAddEmployee(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Employee
            </button>
          </div>

          <div className="space-y-3">
            {employees.map(emp => (
              <div key={emp.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {emp.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{emp.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${emp.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-0.5">
                      <span className="text-xs text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3" /> {emp.email}</span>
                      {emp.phone && <span className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {emp.phone}</span>}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-slate-400">Password: </span>
                      <span className="text-xs font-mono text-slate-600">
                        {showPasswords[emp.id] ? emp.password : '•'.repeat(Math.min(emp.password.length, 8))}
                      </span>
                      <button onClick={() => setShowPasswords(s => ({ ...s, [emp.id]: !s[emp.id] }))} className="text-slate-400 hover:text-slate-600 ml-1">
                        {showPasswords[emp.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleToggleActive(emp.id, emp.isActive)} className={`p-2 rounded-lg text-xs font-medium ${emp.isActive ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                      {emp.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    {emp.id !== currentUser?.id && (
                      <button onClick={() => handleDeleteEmployee(emp.id, emp.name)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {employees.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-100 p-10 text-center">
                <Users className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-slate-500">No employees yet. Add your first employee.</p>
              </div>
            )}
          </div>

          {/* Add Employee Modal */}
          {showAddEmployee && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slideUp">
                <h3 className="font-bold text-slate-900 text-lg mb-4">Add New Employee</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
                    <input value={newEmployee.name} onChange={e => setNewEmployee(n => ({ ...n, name: e.target.value }))} placeholder="Enter full name" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Email Address *</label>
                    <input type="email" value={newEmployee.email} onChange={e => setNewEmployee(n => ({ ...n, email: e.target.value }))} placeholder="employee@uvinsurance.com" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                    <input type="tel" value={newEmployee.phone} onChange={e => setNewEmployee(n => ({ ...n, phone: e.target.value }))} placeholder="+91 9876543210" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Password *</label>
                    <input type="password" value={newEmployee.password} onChange={e => setNewEmployee(n => ({ ...n, password: e.target.value }))} placeholder="Minimum 6 characters" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowAddEmployee(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
                  <button onClick={handleAddEmployee} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">Add Employee</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Notification Settings</h2>
          <div className="space-y-3">
            {[
              { key: 'birthdayWhatsapp', label: 'Birthday WhatsApp Wishes', desc: 'Automatically send birthday wishes to customers via WhatsApp' },
              { key: 'renewalWhatsapp', label: 'Renewal Reminders via WhatsApp', desc: 'Send renewal reminders through WhatsApp' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
                <button onClick={() => setSettings(s => ({ ...s, [item.key]: !s[item.key as keyof typeof s] }))} className={settings[item.key as keyof typeof settings] ? 'text-blue-600' : 'text-slate-400'}>
                  {settings[item.key as keyof typeof settings] ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>
            ))}
            <div className="p-4 bg-slate-50 rounded-xl">
              <label className="block text-sm font-medium text-slate-900 mb-1">Renewal Reminder Days</label>
              <p className="text-xs text-slate-500 mb-2">Send reminders this many days before renewal</p>
              <select value={settings.renewalDays} onChange={e => setSettings(s => ({ ...s, renewalDays: e.target.value }))} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="7">7 days</option>
                <option value="15">15 days</option>
                <option value="30">30 days</option>
                <option value="60">60 days</option>
              </select>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-sm font-semibold text-blue-700 mb-1">WhatsApp Integration</p>
            <p className="text-xs text-blue-600">Connect your WhatsApp Business API for automated messages. Currently using template notifications.</p>
            <button className="mt-2 text-xs text-blue-700 font-semibold underline">Configure WhatsApp API →</button>
          </div>
          <button onClick={handleSaveSettings} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
            <Save className="w-4 h-4" /> Save Settings
          </button>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Security Settings</h2>
          <div className="space-y-3">
            <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-green-600" />
                <p className="text-sm font-semibold text-green-700">Document Security</p>
              </div>
              <p className="text-xs text-green-600">Documents (Aadhaar, PAN, photos) can only be downloaded by the Owner. Employees can view but not download.</p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-blue-600" />
                <p className="text-sm font-semibold text-blue-700">Approval Workflow</p>
              </div>
              <p className="text-xs text-blue-600">All new customers submitted by employees require owner approval before they are activated in the system.</p>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-amber-600" />
                <p className="text-sm font-semibold text-amber-700">Audit Trail</p>
              </div>
              <p className="text-xs text-amber-600">All actions are logged for compliance. You can review the activity logs at any time.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
