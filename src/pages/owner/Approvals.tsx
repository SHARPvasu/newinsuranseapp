import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { CheckCircle, XCircle, Clock, Eye, User, Calendar, Phone, Mail, MapPin, FileText, Download, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

export default function Approvals() {
  const { customers, users, approveCustomer, rejectCustomer, currentUser } = useAppStore();
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  const filtered = customers.filter(c => filter === 'all' ? true : c.status === filter);

  const handleApprove = (id: string, name: string) => {
    approveCustomer(id, currentUser!.id);
    toast.success(`${name} approved successfully!`);
  };

  const handleReject = () => {
    if (!rejectModal || !rejectReason.trim()) return;
    rejectCustomer(rejectModal.id, rejectReason, currentUser!.id);
    toast.success(`${rejectModal.name} rejected.`);
    setRejectModal(null);
    setRejectReason('');
  };

  const statusColor = (status: string) => {
    if (status === 'approved') return 'bg-green-100 text-green-700';
    if (status === 'rejected') return 'bg-red-100 text-red-700';
    return 'bg-amber-100 text-amber-700';
  };

  const counts = {
    pending: customers.filter(c => c.status === 'pending').length,
    approved: customers.filter(c => c.status === 'approved').length,
    rejected: customers.filter(c => c.status === 'rejected').length,
    all: customers.length,
  };

  const selected = selectedCustomer ? customers.find(c => c.id === selectedCustomer) : null;
  const selectedAgent = selected ? users.find(u => u.id === selected.agentId) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Customer Approvals</h1>
        <p className="text-slate-500 text-sm mt-1">Review and manage customer submissions from employees.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['pending', 'approved', 'rejected', 'all'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === tab
                ? tab === 'pending' ? 'bg-amber-600 text-white' : tab === 'approved' ? 'bg-green-600 text-white' : tab === 'rejected' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} ({counts[tab]})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* List */}
        <div className={`${selectedCustomer ? 'lg:col-span-2' : 'lg:col-span-5'} space-y-3`}>
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 p-8 text-center">
              <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
              <p className="text-slate-500">No {filter} customers found.</p>
            </div>
          ) : (
            filtered.map(customer => {
              const agent = users.find(u => u.id === customer.agentId);
              return (
                <div
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer.id === selectedCustomer ? null : customer.id)}
                  className={`bg-white rounded-xl border p-4 shadow-sm cursor-pointer transition-all ${
                    selectedCustomer === customer.id ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-100 hover:border-slate-200 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {customer.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900 text-sm">{customer.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(customer.status)}`}>
                          {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{customer.customerId} · Agent: {agent?.name}</p>
                      <p className="text-xs text-slate-400">{format(parseISO(customer.createdAt), 'dd MMM yyyy, HH:mm')}</p>
                      {customer.notes && <p className="text-xs text-slate-500 mt-1 truncate">{customer.notes}</p>}
                    </div>
                  </div>

                  {customer.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={e => { e.stopPropagation(); handleApprove(customer.id, customer.name); }}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setRejectModal({ id: customer.id, name: customer.name }); }}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="lg:col-span-3 bg-white rounded-xl border border-slate-100 shadow-sm h-fit sticky top-6">
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Customer Details</h3>
                <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                  {selected.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{selected.name}</h4>
                  <p className="text-sm text-slate-500">{selected.customerId}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(selected.status)}`}>
                    {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700">{selected.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700 truncate">{selected.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm col-span-2">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-700">{selected.address}</span>
                </div>
                {selected.dob && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700">DOB: {format(parseISO(selected.dob), 'dd MMM yyyy')}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700">Agent: {selectedAgent?.name}</span>
                </div>
              </div>

              {/* Policies */}
              {selected.policies.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Policies</h5>
                  {selected.policies.map(p => (
                    <div key={p.id} className="bg-slate-50 rounded-lg p-3 mb-2 text-xs">
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-700">{p.type.charAt(0).toUpperCase() + p.type.slice(1)} Insurance</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{p.status}</span>
                      </div>
                      <div className="text-slate-500 mt-1">{p.policyNumber} · ₹{p.premium.toLocaleString('en-IN')}/yr · Insurer: {p.insurer}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Documents */}
              {selected.documents.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Documents</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {selected.documents.map(doc => (
                      <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs hover:bg-blue-50 transition-colors">
                        <Download className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-slate-700 truncate">{doc.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selected.notes && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                  <p className="text-xs font-medium text-amber-700 mb-1">Notes</p>
                  <p className="text-xs text-amber-600">{selected.notes}</p>
                </div>
              )}

              {/* Rejection reason */}
              {selected.status === 'rejected' && selected.rejectionReason && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                  <p className="text-xs font-medium text-red-700 mb-1">Rejection Reason</p>
                  <p className="text-xs text-red-600">{selected.rejectionReason}</p>
                </div>
              )}

              {/* Actions */}
              {selected.status === 'pending' && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleApprove(selected.id, selected.name)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => setRejectModal({ id: selected.id, name: selected.name })}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Reject Customer</h3>
                <p className="text-sm text-slate-500">Rejecting: {rejectModal.name}</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason for Rejection *</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={handleReject} disabled={!rejectReason.trim()} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
