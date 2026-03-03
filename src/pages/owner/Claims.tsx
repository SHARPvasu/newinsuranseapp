import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { AlertCircle, CheckCircle, XCircle, Clock, Eye, X, DollarSign, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

export default function OwnerClaims() {
  const { claims, updateClaim, currentUser, users } = useAppStore();
  const [filter, setFilter] = useState<string>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [reviewModal, setReviewModal] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const filtered = filter === 'all' ? claims : claims.filter(c => c.status === filter);
  const detail = selected ? claims.find(c => c.id === selected) : null;

  const statusColors: Record<string, string> = {
    submitted: 'bg-amber-100 text-amber-700',
    under_review: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    paid: 'bg-purple-100 text-purple-700',
  };

  const handleAction = () => {
    if (!reviewModal) return;
    if (reviewModal.action === 'approve') {
      updateClaim(reviewModal.id, { status: 'approved', approvedAmount: parseFloat(amount) || 0, approvedBy: currentUser!.id, approvedAt: new Date().toISOString() });
      toast.success('Claim approved!');
    } else {
      updateClaim(reviewModal.id, { status: 'rejected', rejectionReason: reason, approvedBy: currentUser!.id, approvedAt: new Date().toISOString() });
      toast.success('Claim rejected');
    }
    setReviewModal(null); setAmount(''); setReason('');
  };

  const markPaid = (id: string) => {
    updateClaim(id, { status: 'paid', paidAt: new Date().toISOString() });
    toast.success('Claim marked as paid');
  };

  const counts = { all: claims.length, submitted: claims.filter(c => c.status === 'submitted').length, approved: claims.filter(c => c.status === 'approved').length, rejected: claims.filter(c => c.status === 'rejected').length, paid: claims.filter(c => c.status === 'paid').length };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Claim Management</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Review and manage insurance claims</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(counts).map(([key, val]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`rounded-xl p-3 text-center border transition-all ${filter === key ? 'border-blue-400 ring-2 ring-blue-100 dark:ring-blue-900' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-800`}>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{val}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">{key === 'all' ? 'Total' : key.replace('_', ' ')}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className={`${selected ? 'lg:col-span-2' : 'lg:col-span-5'} space-y-3`}>
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No claims found</p>
            </div>
          ) : filtered.map(claim => {
            const agent = users.find(u => u.id === claim.agentId);
            return (
              <div key={claim.id} onClick={() => setSelected(claim.id === selected ? null : claim.id)}
                className={`bg-white dark:bg-slate-800 rounded-xl border p-4 shadow-sm cursor-pointer transition-all ${selected === claim.id ? 'border-blue-400 ring-2 ring-blue-100 dark:ring-blue-900' : 'border-slate-100 dark:border-slate-700 hover:shadow-md'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">{claim.claimNumber}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[claim.status]}`}>{claim.status.replace('_', ' ')}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{claim.customerName} · {claim.policyNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">₹{claim.claimAmount.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-slate-400">{claim.claimDate}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{claim.description}</p>
                <p className="text-xs text-slate-400 mt-1">Agent: {agent?.name}</p>
                {claim.status === 'submitted' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={e => { e.stopPropagation(); setReviewModal({ id: claim.id, action: 'approve' }); setAmount(String(claim.claimAmount)); }} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg font-medium"><CheckCircle className="w-3.5 h-3.5" /> Approve</button>
                    <button onClick={e => { e.stopPropagation(); setReviewModal({ id: claim.id, action: 'reject' }); }} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg font-medium"><XCircle className="w-3.5 h-3.5" /> Reject</button>
                  </div>
                )}
                {claim.status === 'approved' && (
                  <button onClick={e => { e.stopPropagation(); markPaid(claim.id); }} className="mt-3 w-full flex items-center justify-center gap-1 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg font-medium"><DollarSign className="w-3.5 h-3.5" /> Mark as Paid</button>
                )}
              </div>
            );
          })}
        </div>

        {detail && (
          <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm h-fit sticky top-6">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white">Claim Details</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500 dark:text-slate-400">Claim #:</span> <span className="font-medium text-slate-900 dark:text-white">{detail.claimNumber}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">Status:</span> <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[detail.status]}`}>{detail.status}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">Customer:</span> <span className="font-medium text-slate-900 dark:text-white">{detail.customerName}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">Policy:</span> <span className="font-medium text-slate-900 dark:text-white">{detail.policyNumber}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">Claim Amount:</span> <span className="font-bold text-slate-900 dark:text-white">₹{detail.claimAmount.toLocaleString('en-IN')}</span></div>
                {detail.approvedAmount > 0 && <div><span className="text-slate-500 dark:text-slate-400">Approved:</span> <span className="font-bold text-green-600">₹{detail.approvedAmount.toLocaleString('en-IN')}</span></div>}
                <div><span className="text-slate-500 dark:text-slate-400">Claim Date:</span> <span className="font-medium text-slate-900 dark:text-white">{detail.claimDate}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">Type:</span> <span className="font-medium text-slate-900 dark:text-white">{detail.claimType}</span></div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Description</p>
                <p className="text-sm text-slate-800 dark:text-slate-200">{detail.description}</p>
              </div>
              {detail.rejectionReason && (
                <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-3">
                  <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-600 dark:text-red-300">{detail.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">{reviewModal.action === 'approve' ? 'Approve Claim' : 'Reject Claim'}</h3>
            {reviewModal.action === 'approve' ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Approved Amount (₹)</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rejection Reason</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none" />
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setReviewModal(null)} className="flex-1 py-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg text-sm">Cancel</button>
              <button onClick={handleAction} className={`flex-1 py-2 text-white rounded-lg text-sm font-medium ${reviewModal.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>{reviewModal.action === 'approve' ? 'Approve' : 'Reject'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
