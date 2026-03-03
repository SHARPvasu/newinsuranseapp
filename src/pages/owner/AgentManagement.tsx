import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { Plus, User, Mail, Phone, Shield, Trash2, Edit2, Check, X, Eye, EyeOff } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import type { User as UserType } from '../../types';

export default function AgentManagement() {
  const { users, addUser, updateUser, deleteUser, customers } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', isActive: true });

  const agents = users.filter(u => u.role === 'employee');

  const handleSubmit = () => {
    if (!form.name || !form.email || (!editId && !form.password)) {
      toast.error('Name, email, and password are required');
      return;
    }
    if (editId) {
      updateUser(editId, { name: form.name, phone: form.phone, isActive: form.isActive, ...(form.password ? { password: form.password } : {}) });
      toast.success('Employee updated!');
    } else {
      if (users.find(u => u.email === form.email)) { toast.error('Email already exists'); return; }
      const newAgent: UserType = {
        id: `emp-${Date.now()}`,
        name: form.name, email: form.email, password: form.password,
        phone: form.phone, role: 'employee', isActive: form.isActive,
        createdAt: new Date().toISOString(),
      };
      addUser(newAgent);
      toast.success('Employee added!');
    }
    resetForm();
  };

  const resetForm = () => {
    setForm({ name: '', email: '', password: '', phone: '', isActive: true });
    setEditId(null);
    setShowForm(false);
    setShowPass(false);
  };

  const handleEdit = (agent: UserType) => {
    setForm({ name: agent.name, email: agent.email, password: '', phone: agent.phone || '', isActive: agent.isActive });
    setEditId(agent.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Remove this employee?')) {
      deleteUser(id);
      toast.success('Employee removed');
    }
  };

  const getAgentStats = (agentId: string) => {
    const agentCustomers = customers.filter(c => c.agentId === agentId);
    return {
      total: agentCustomers.length,
      approved: agentCustomers.filter(c => c.status === 'approved').length,
      pending: agentCustomers.filter(c => c.status === 'pending').length,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employee Management</h1>
          <p className="text-slate-500 text-sm">{agents.length} employees registered</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-slate-900">{agents.length}</div>
          <div className="text-sm text-slate-500">Total Employees</div>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-100 p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{agents.filter(a => a.isActive).length}</div>
          <div className="text-sm text-green-600">Active</div>
        </div>
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-slate-700">{agents.filter(a => !a.isActive).length}</div>
          <div className="text-sm text-slate-500">Inactive</div>
        </div>
      </div>

      {/* Agent cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {agents.map(agent => {
          const stats = getAgentStats(agent.id);
          return (
            <div key={agent.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold">
                    {agent.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{agent.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${agent.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {agent.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(agent)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(agent.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-slate-600"><Mail className="w-3.5 h-3.5 text-slate-400" /><span className="text-xs truncate">{agent.email}</span></div>
                {agent.phone && <div className="flex items-center gap-2 text-slate-600"><Phone className="w-3.5 h-3.5 text-slate-400" /><span className="text-xs">{agent.phone}</span></div>}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-50">
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-900">{stats.total}</div>
                  <div className="text-xs text-slate-400">Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{stats.approved}</div>
                  <div className="text-xs text-slate-400">Approved</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-600">{stats.pending}</div>
                  <div className="text-xs text-slate-400">Pending</div>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-400">
                Joined: {format(parseISO(agent.createdAt), 'dd MMM yyyy')}
              </div>
            </div>
          );
        })}

        {agents.length === 0 && (
          <div className="col-span-3 bg-white rounded-xl border border-slate-100 p-12 text-center">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No employees yet. Add your first employee!</p>
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-semibold text-slate-900">{editId ? 'Edit Employee' : 'Add New Employee'}</h3>
              <button onClick={resetForm}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Full Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Employee name" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email Address *</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} disabled={!!editId} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400" placeholder="email@uvinsurance.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{editId ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="w-full px-3 py-2 pr-9 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder={editId ? 'Leave blank to keep' : 'Set password'} />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Phone Number</label>
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="+91 9876543210" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 text-blue-600" />
                <label htmlFor="active" className="text-sm text-slate-700">Active Account</label>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t">
              <button onClick={resetForm} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm">Cancel</button>
              <button onClick={handleSubmit} className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                <Check className="w-4 h-4" /> {editId ? 'Update' : 'Add Employee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
