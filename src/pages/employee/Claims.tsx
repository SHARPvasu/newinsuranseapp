import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { AlertCircle, Plus, X, Check, FileText, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Claim, PolicyType } from '../../types';

export default function EmployeeClaims() {
  const { currentUser, customers, claims, addClaim } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customerId: '', policyId: '', claimAmount: '', claimType: '', description: '', notes: '' });

  const myClaims = claims.filter(c => c.agentId === currentUser?.id);
  const myCustomers = customers.filter(c => c.agentId === currentUser?.id && c.status === 'approved' && c.policies.length > 0);
  const selectedCustomer = myCustomers.find(c => c.id === form.customerId);
  const selectedPolicy = selectedCustomer?.policies.find(p => p.id === form.policyId);

  const statusColors: Record<string, string> = { submitted: 'bg-amber-100 text-amber-700', under_review: 'bg-blue-100 text-blue-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700', paid: 'bg-purple-100 text-purple-700' };

  const handleSubmit = () => {
    if (!form.customerId || !form.policyId || !form.claimAmount) { toast.error('Please fill all required fields'); return; }
    const claim: Claim = {
      id: `claim-${Date.now()}`, claimNumber: `CLM-${1000 + claims.length + 1}`,
      policyId: form.policyId, customerId: form.customerId,
      customerName: selectedCustomer?.name || '', policyNumber: selectedPolicy?.policyNumber || '',
      policyType: (selectedPolicy?.type || 'health') as PolicyType,
      claimDate: new Date().toISOString().split('T')[0],
      claimAmount: parseFloat(form.claimAmount), approvedAmount: 0,
      status: 'submitted', claimType: form.claimType, description: form.description,
      documents: [], notes: form.notes, agentId: currentUser!.id,
      createdAt: new Date().toISOString(),
    };
    addClaim(claim);
    toast.success('Claim filed successfully!');
    setShowForm(false);
    setForm({ customerId: '', policyId: '', claimAmount: '', claimType: '', description: '', notes: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Claims</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{myClaims.length} claims filed</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"><Plus className="w-4 h-4" /> File Claim</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {['submitted', 'under_review', 'approved', 'paid'].map(s => (
          <div key={s} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-3 text-center">
            <div className="text-xl font-bold text-slate-900 dark:text-white">{myClaims.filter(c => c.status === s).length}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">{s.replace('_', ' ')}</div>
          </div>
        ))}
      </div>

      {myClaims.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">No claims filed yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {myClaims.map(claim => (
            <div key={claim.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white">{claim.claimNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[claim.status]}`}>{claim.status.replace('_', ' ')}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{claim.customerName} · {claim.policyNumber} · {claim.policyType}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 dark:text-white">₹{claim.claimAmount.toLocaleString('en-IN')}</p>
                  {claim.approvedAmount > 0 && <p className="text-xs text-green-600">Approved: ₹{claim.approvedAmount.toLocaleString('en-IN')}</p>}
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">{claim.description}</p>
              <p className="text-xs text-slate-400 mt-1">Filed: {claim.claimDate}</p>
              {claim.rejectionReason && <div className="mt-2 bg-red-50 dark:bg-red-900/30 rounded-lg p-2 text-xs text-red-600 dark:text-red-400">❌ {claim.rejectionReason}</div>}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white">File New Claim</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Customer *</label>
                <select value={form.customerId} onChange={e => setForm(p => ({ ...p, customerId: e.target.value, policyId: '' }))} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                  <option value="">Select customer</option>
                  {myCustomers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.customerId})</option>)}
                </select>
              </div>
              {selectedCustomer && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Policy *</label>
                  <select value={form.policyId} onChange={e => setForm(p => ({ ...p, policyId: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                    <option value="">Select policy</option>
                    {selectedCustomer.policies.map(p => <option key={p.id} value={p.id}>{p.type} - {p.policyNumber} ({p.insurer})</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Claim Amount (₹) *</label>
                  <input type="number" value={form.claimAmount} onChange={e => setForm(p => ({ ...p, claimAmount: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Claim Type</label>
                  <select value={form.claimType} onChange={e => setForm(p => ({ ...p, claimType: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                    <option value="">Select</option>
                    <option>Hospitalization</option><option>Accident</option><option>Death</option><option>Maturity</option><option>Theft</option><option>Damage</option><option>Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Description *</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg text-sm">Cancel</button>
              <button onClick={handleSubmit} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">Submit Claim</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
