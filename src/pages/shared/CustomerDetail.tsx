import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { ArrowLeft, Phone, Mail, MapPin, Calendar, FileText, Download, Shield, Heart, Car, Briefcase, Plus, Edit3, CheckCircle, XCircle, Clock, Camera } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import type { Policy } from '../../types';

interface Props { isEmployee?: boolean; }

export default function CustomerDetail({ isEmployee }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customers, users, currentUser, addPolicyToCustomer, approveCustomer, rejectCustomer } = useAppStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'policies' | 'documents' | 'timeline'>('overview');
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [newPolicy, setNewPolicy] = useState({
    type: 'health' as Policy['type'],
    policyNumber: '',
    insurer: '',
    premium: '',
    sumAssured: '',
    startDate: '',
    endDate: '',
  });

  const customer = customers.find(c => c.id === id);
  const agent = customer ? users.find(u => u.id === customer.agentId) : null;
  const prefix = isEmployee ? '/employee' : '/owner';

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Shield className="w-16 h-16 text-slate-200" />
        <h2 className="text-xl font-semibold text-slate-600">Customer not found</h2>
        <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline text-sm">Go back</button>
      </div>
    );
  }

  const statusConfig = {
    pending: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, label: 'Pending Approval' },
    approved: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: 'Approved' },
    rejected: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Rejected' },
  };

  const cfg = statusConfig[customer.status];

  const policyIcons: Record<string, React.ElementType> = {
    health: Heart,
    life: Shield,
    motor: Car,
    miscellaneous: Briefcase,
  };

  const handleAddPolicy = () => {
    if (!newPolicy.policyNumber || !newPolicy.insurer) {
      toast.error('Policy number and insurer are required');
      return;
    }
    const policy: Policy = {
      id: `pol-${Date.now()}`,
      customerId: customer.id,
      type: newPolicy.type,
      policyNumber: newPolicy.policyNumber || `POL-${Date.now()}`,
      insurer: newPolicy.insurer,
      premium: parseFloat(newPolicy.premium) || 0,
      sumAssured: parseFloat(newPolicy.sumAssured) || 0,
      startDate: newPolicy.startDate,
      endDate: newPolicy.endDate,
      status: 'active',
      renewalDate: newPolicy.endDate,
      documents: [],
      createdAt: new Date().toISOString(),
      createdBy: currentUser!.id,
      agentId: currentUser!.id,
    };
    addPolicyToCustomer(customer.id, policy);
    toast.success('Policy added successfully!');
    setShowAddPolicy(false);
    setNewPolicy({ type: 'health', policyNumber: '', insurer: '', premium: '', sumAssured: '', startDate: '', endDate: '' });
  };

  const handleApprove = () => {
    approveCustomer(customer.id, currentUser!.id);
    toast.success(`${customer.name} approved!`);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    rejectCustomer(customer.id, rejectReason, currentUser!.id);
    toast.success('Customer rejected');
    setShowRejectModal(false);
    setRejectReason('');
  };

  const downloadDoc = (doc: { name: string; url: string }) => {
    if (isEmployee) {
      toast.error('Only owners can download documents');
      return;
    }
    const a = document.createElement('a');
    a.href = doc.url;
    a.download = doc.name;
    a.click();
    toast.success(`Downloading ${doc.name}`);
  };

  const timeline = [
    { date: customer.createdAt, event: 'Customer Created', by: agent?.name || 'Unknown', color: 'bg-blue-500' },
    ...(customer.approvedAt ? [{ date: customer.approvedAt, event: customer.status === 'approved' ? 'Customer Approved ✅' : 'Customer Rejected ❌', by: users.find(u => u.id === customer.approvedBy)?.name || 'Admin', color: customer.status === 'approved' ? 'bg-green-500' : 'bg-red-500' }] : []),
    ...customer.policies.map(p => ({ date: p.createdAt, event: `Policy Added: ${p.type} (${p.policyNumber})`, by: agent?.name || 'Unknown', color: 'bg-purple-500' })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{customer.name}</h1>
          <p className="text-slate-500 text-sm">{customer.customerId} · Added by {agent?.name}</p>
        </div>
        <span className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-medium border ${cfg.color}`}>
          <cfg.icon className="w-4 h-4" />
          {cfg.label}
        </span>
      </div>

      {/* Action bar for owner on pending */}
      {!isEmployee && customer.status === 'pending' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold text-amber-800">Awaiting your approval</p>
            <p className="text-sm text-amber-600">Review the customer details and take action.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleApprove} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">
              <CheckCircle className="w-4 h-4" /> Approve
            </button>
            <button onClick={() => setShowRejectModal(true)} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">
              <XCircle className="w-4 h-4" /> Reject
            </button>
          </div>
        </div>
      )}

      {/* Rejection reason */}
      {customer.status === 'rejected' && customer.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="font-semibold text-red-700 text-sm">Rejection Reason</p>
          <p className="text-red-600 text-sm mt-1">{customer.rejectionReason}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          {(['overview', 'policies', 'documents', 'timeline'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
              {tab} {tab === 'policies' ? `(${customer.policies.length})` : tab === 'documents' ? `(${customer.documents.length + (customer.livePhoto ? 1 : 0)})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-semibold text-slate-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg"><Phone className="w-4 h-4 text-blue-600" /></div>
                  <div><p className="text-xs text-slate-500">Phone</p><p className="text-sm font-medium text-slate-900">{customer.phone}</p></div>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg"><Mail className="w-4 h-4 text-purple-600" /></div>
                    <div><p className="text-xs text-slate-500">Email</p><p className="text-sm font-medium text-slate-900">{customer.email}</p></div>
                  </div>
                )}
                {customer.dob && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-lg"><Calendar className="w-4 h-4 text-green-600" /></div>
                    <div><p className="text-xs text-slate-500">Date of Birth</p><p className="text-sm font-medium text-slate-900">{format(parseISO(customer.dob), 'dd MMMM yyyy')}</p></div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 rounded-lg"><FileText className="w-4 h-4 text-amber-600" /></div>
                  <div><p className="text-xs text-slate-500">Customer Type</p><p className="text-sm font-medium text-slate-900">{customer.isExisting ? 'Existing' : 'New'}</p></div>
                </div>
                {customer.address && (
                  <div className="flex items-start gap-3 sm:col-span-2">
                    <div className="p-2 bg-red-50 rounded-lg mt-0.5"><MapPin className="w-4 h-4 text-red-500" /></div>
                    <div><p className="text-xs text-slate-500">Address</p><p className="text-sm font-medium text-slate-900">{customer.address}</p></div>
                  </div>
                )}
              </div>
            </div>

            {customer.notes && (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <h3 className="font-semibold text-slate-900 mb-2">Notes</h3>
                <p className="text-sm text-slate-600">{customer.notes}</p>
              </div>
            )}

            {/* Policy summary */}
            {customer.policies.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <h3 className="font-semibold text-slate-900 mb-3">Active Policies</h3>
                <div className="space-y-2">
                  {customer.policies.map(p => {
                    const Icon = policyIcons[p.type] || Shield;
                    return (
                      <div key={p.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className="p-2 bg-blue-100 rounded-lg"><Icon className="w-4 h-4 text-blue-600" /></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{p.type.charAt(0).toUpperCase() + p.type.slice(1)} — {p.insurer}</p>
                          <p className="text-xs text-slate-500">{p.policyNumber} · ₹{p.premium.toLocaleString('en-IN')}/yr</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-green-100 text-green-700' : p.status === 'expired' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {p.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {customer.livePhoto && (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Camera className="w-4 h-4" /> Live Photo</h3>
                <img src={customer.livePhoto} alt="Customer" className="w-full rounded-lg object-cover border border-slate-100" style={{ maxHeight: 200 }} />
              </div>
            )}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-semibold text-slate-900 mb-3">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Policies</span>
                  <span className="font-semibold text-slate-900">{customer.policies.length}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Documents</span>
                  <span className="font-semibold text-slate-900">{customer.documents.length}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Total Premium</span>
                  <span className="font-semibold text-slate-900">₹{customer.policies.reduce((s, p) => s + p.premium, 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Agent</span>
                  <span className="font-semibold text-slate-900">{agent?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Created</span>
                  <span className="font-semibold text-slate-900">{format(parseISO(customer.createdAt), 'dd MMM yyyy')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Policies tab */}
      {activeTab === 'policies' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-900">Policies ({customer.policies.length})</h3>
            <button onClick={() => setShowAddPolicy(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Policy
            </button>
          </div>

          {customer.policies.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
              <Shield className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500">No policies yet. Add the first policy.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {customer.policies.map(p => {
                const Icon = policyIcons[p.type] || Shield;
                return (
                  <div key={p.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-50 rounded-xl"><Icon className="w-5 h-5 text-blue-600" /></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h4 className="font-semibold text-slate-900">{p.type.charAt(0).toUpperCase() + p.type.slice(1)} Insurance</h4>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${p.status === 'active' ? 'bg-green-100 text-green-700' : p.status === 'expired' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">{p.insurer} · {p.policyNumber}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                          <div><p className="text-xs text-slate-500">Premium</p><p className="text-sm font-semibold text-slate-900">₹{p.premium.toLocaleString('en-IN')}/yr</p></div>
                          <div><p className="text-xs text-slate-500">Sum Assured</p><p className="text-sm font-semibold text-slate-900">₹{p.sumAssured.toLocaleString('en-IN')}</p></div>
                          {p.startDate && <div><p className="text-xs text-slate-500">Start Date</p><p className="text-sm font-semibold text-slate-900">{p.startDate}</p></div>}
                          {p.endDate && <div><p className="text-xs text-slate-500">End Date</p><p className="text-sm font-semibold text-slate-900">{p.endDate}</p></div>}
                        </div>
                        {/* Health details */}
                        {p.healthDetails && (
                          <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 space-y-1">
                            <p><strong>Height:</strong> {p.healthDetails.height}cm | <strong>Weight:</strong> {p.healthDetails.weight}kg</p>
                            {p.healthDetails.medicalConditions && <p><strong>Medical:</strong> {p.healthDetails.medicalConditions}</p>}
                            {p.healthDetails.rareConditions && <p><strong>Rare Conditions:</strong> {p.healthDetails.rareConditions}</p>}
                            {p.healthDetails.familyMembers?.length > 0 && <p><strong>Family Members:</strong> {p.healthDetails.familyMembers.length}</p>}
                          </div>
                        )}
                        {/* Motor details */}
                        {p.motorDetails && (
                          <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 space-y-1">
                            <p><strong>Insurance Type:</strong> {p.motorDetails.motorPolicyType === 'third_party' ? 'Third Party Only' : 'Comprehensive'}</p>
                            <p><strong>Vehicle:</strong> {p.motorDetails.vehicleType} | <strong>Number:</strong> {p.motorDetails.vehicleNumber}</p>
                            <p><strong>Make/Model:</strong> {p.motorDetails.make} {p.motorDetails.model} ({p.motorDetails.year})</p>
                            {p.motorDetails.idv && <p><strong>IDV:</strong> ₹{parseInt(p.motorDetails.idv).toLocaleString('en-IN')}</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Policy Modal */}
          {showAddPolicy && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-slideUp">
                <h3 className="font-bold text-slate-900 text-lg mb-4">Add New Policy</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Policy Type</label>
                    <select value={newPolicy.type} onChange={e => setNewPolicy(p => ({ ...p, type: e.target.value as Policy['type'] }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="health">Health Insurance</option>
                      <option value="life">Life Insurance</option>
                      <option value="motor">Motor Insurance</option>
                      <option value="miscellaneous">Miscellaneous</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Policy Number *</label>
                      <input value={newPolicy.policyNumber} onChange={e => setNewPolicy(p => ({ ...p, policyNumber: e.target.value }))} placeholder="POL-XXXXXX" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Insurer *</label>
                      <input value={newPolicy.insurer} onChange={e => setNewPolicy(p => ({ ...p, insurer: e.target.value }))} placeholder="LIC, Star Health..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Annual Premium (₹)</label>
                      <input type="number" value={newPolicy.premium} onChange={e => setNewPolicy(p => ({ ...p, premium: e.target.value }))} placeholder="15000" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Sum Assured (₹)</label>
                      <input type="number" value={newPolicy.sumAssured} onChange={e => setNewPolicy(p => ({ ...p, sumAssured: e.target.value }))} placeholder="500000" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
                      <input type="date" value={newPolicy.startDate} onChange={e => setNewPolicy(p => ({ ...p, startDate: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">End Date</label>
                      <input type="date" value={newPolicy.endDate} onChange={e => setNewPolicy(p => ({ ...p, endDate: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowAddPolicy(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
                  <button onClick={handleAddPolicy} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">Add Policy</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Documents tab */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-900">Documents</h3>
            {!isEmployee && <p className="text-xs text-slate-500">Click to download (Owner only)</p>}
          </div>

          {customer.livePhoto && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Live Photo</h4>
              <img src={customer.livePhoto} alt="Live photo" className="w-32 h-32 object-cover rounded-xl border border-slate-200" />
            </div>
          )}

          {customer.documents.length === 0 && !customer.livePhoto ? (
            <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
              <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500">No documents uploaded.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {customer.documents.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => downloadDoc(doc)}
                  className={`bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-left transition-all ${!isEmployee ? 'hover:border-blue-300 hover:shadow-md cursor-pointer' : 'cursor-not-allowed opacity-75'}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-50 rounded-lg"><FileText className="w-5 h-5 text-blue-600" /></div>
                    {!isEmployee && <Download className="w-4 h-4 text-slate-400 ml-auto" />}
                  </div>
                  <p className="text-sm font-medium text-slate-900 truncate">{doc.name}</p>
                  <p className="text-xs text-slate-500 mt-1 capitalize">{doc.type.replace('_', ' ')}</p>
                  <p className="text-xs text-slate-400">{format(parseISO(doc.uploadedAt), 'dd MMM yyyy')}</p>
                  {isEmployee && <p className="text-xs text-red-400 mt-1">🔒 Owner access only</p>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timeline tab */}
      {activeTab === 'timeline' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Activity Timeline</h3>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100" />
            <div className="space-y-4">
              {timeline.map((item, i) => (
                <div key={i} className="flex items-start gap-4 pl-10 relative">
                  <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 border-white shadow ${item.color}`} />
                  <div className="flex-1 bg-slate-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-slate-900">{item.event}</p>
                    <p className="text-xs text-slate-500 mt-0.5">By {item.by} · {format(parseISO(item.date), 'dd MMM yyyy, HH:mm')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-slate-900 mb-4">Reject Customer</h3>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowRejectModal(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={handleReject} disabled={!rejectReason.trim()} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
