import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { Plus, Search, Phone, Mail, Target, Edit2, Trash2, Check, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import type { Lead, PolicyType } from '../../types';

interface Props { isEmployee?: boolean; }

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-purple-100 text-purple-700',
  interested: 'bg-amber-100 text-amber-700',
  converted: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
};

export default function LeadManagement({ isEmployee }: Props) {
  const { leads, currentUser, addLead, updateLead, deleteLead } = useAppStore();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', phone: '', email: '', source: 'Referral', status: 'new' as Lead['status'],
    policyInterest: [] as PolicyType[], notes: '', followUpDate: '',
  });

  const myLeads = isEmployee ? leads.filter(l => l.agentId === currentUser?.id) : leads;
  const filtered = myLeads.filter(l =>
    !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search)
  );

  const resetForm = () => {
    setForm({ name: '', phone: '', email: '', source: 'Referral', status: 'new', policyInterest: [], notes: '', followUpDate: '' });
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = () => {
    if (!form.name || !form.phone) { toast.error('Name and phone are required'); return; }
    if (editId) {
      updateLead(editId, { ...form, updatedAt: new Date().toISOString() });
      toast.success('Lead updated!');
    } else {
      const lead: Lead = {
        id: `lead-${Date.now()}`,
        ...form,
        agentId: currentUser!.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addLead(lead);
      toast.success('Lead added!');
    }
    resetForm();
  };

  const handleEdit = (lead: Lead) => {
    setForm({
      name: lead.name, phone: lead.phone, email: lead.email || '',
      source: lead.source, status: lead.status,
      policyInterest: lead.policyInterest, notes: lead.notes || '',
      followUpDate: lead.followUpDate || '',
    });
    setEditId(lead.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    deleteLead(id);
    toast.success('Lead deleted');
  };

  const toggleInterest = (type: PolicyType) => {
    setForm(prev => ({
      ...prev,
      policyInterest: prev.policyInterest.includes(type)
        ? prev.policyInterest.filter(t => t !== type)
        : [...prev.policyInterest, type]
    }));
  };

  const policyTypes: PolicyType[] = ['health', 'life', 'motor', 'miscellaneous'];
  const sources = ['Referral', 'Online', 'Social Media', 'Cold Call', 'Walk-in', 'Advertisement', 'Other'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lead Management</h1>
          <p className="text-slate-500 text-sm">{myLeads.length} total leads</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Lead
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {['new', 'contacted', 'interested', 'converted', 'lost'].map(s => (
          <div key={s} className={`rounded-xl border p-3 ${statusColors[s].replace('text-', 'border-').replace('bg-', 'bg-').split(' ')[0]} bg-opacity-30`}>
            <div className="text-xl font-bold text-slate-800">{myLeads.filter(l => l.status === s).length}</div>
            <div className="text-xs text-slate-600 capitalize">{s}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..." className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* Lead cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(lead => (
          <div key={lead.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                  {lead.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">{lead.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[lead.status]}`}>
                    {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(lead)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(lead.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-1 text-xs text-slate-600 mb-3">
              <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400" />{lead.phone}</div>
              {lead.email && <div className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-400" />{lead.email}</div>}
              <div className="flex items-center gap-1.5"><Target className="w-3 h-3 text-slate-400" />Source: {lead.source}</div>
            </div>

            {lead.policyInterest.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {lead.policyInterest.map(p => (
                  <span key={p} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 capitalize">{p}</span>
                ))}
              </div>
            )}

            {lead.notes && <p className="text-xs text-slate-500 italic mb-2 truncate">{lead.notes}</p>}

            <div className="flex items-center justify-between pt-2 border-t border-slate-50">
              <span className="text-xs text-slate-400">{format(parseISO(lead.createdAt), 'dd MMM yyyy')}</span>
              {lead.followUpDate && (
                <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded">
                  Follow-up: {format(parseISO(lead.followUpDate), 'dd MMM')}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-semibold text-slate-900">{editId ? 'Edit Lead' : 'Add New Lead'}</h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Full name" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Phone *</label>
                  <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="+91 9876543210" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Source</label>
                  <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {sources.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Lead['status'] }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['new', 'contacted', 'interested', 'converted', 'lost'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Follow-up Date</label>
                  <input type="date" value={form.followUpDate} onChange={e => setForm(p => ({ ...p, followUpDate: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Policy Interest</label>
                <div className="flex flex-wrap gap-2">
                  {policyTypes.map(p => (
                    <button key={p} type="button" onClick={() => toggleInterest(p)}
                      className={`px-3 py-1 rounded-full text-xs border font-medium transition-all ${form.policyInterest.includes(p) ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600 hover:border-blue-300'}`}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Notes about this lead..." />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t">
              <button onClick={resetForm} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={handleSubmit} className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                <Check className="w-4 h-4" /> {editId ? 'Update' : 'Add Lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
