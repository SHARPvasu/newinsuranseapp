import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { Phone, Plus, Clock, Check, X, Calendar, Edit2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import type { CallRecord, CallStatus } from '../../types';

interface Props { isEmployee?: boolean; }

const statusColors: Record<CallStatus, string> = {
  completed: 'bg-green-100 text-green-700',
  missed: 'bg-red-100 text-red-700',
  scheduled: 'bg-blue-100 text-blue-700',
  no_answer: 'bg-amber-100 text-amber-700',
};

export default function CallTracker({ isEmployee }: Props) {
  const { calls, currentUser, addCall, updateCall } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    contactName: '', phone: '', status: 'completed' as CallStatus,
    duration: '', notes: '', scheduledAt: '',
  });

  const myCalls = isEmployee ? calls.filter(c => c.agentId === currentUser?.id) : calls;

  const handleSubmit = () => {
    if (!form.contactName || !form.phone) { toast.error('Name and phone required'); return; }
    const call: CallRecord = {
      id: `call-${Date.now()}`,
      agentId: currentUser!.id,
      contactName: form.contactName,
      phone: form.phone,
      duration: parseInt(form.duration) || 0,
      status: form.status,
      notes: form.notes,
      scheduledAt: form.scheduledAt || undefined,
      completedAt: form.status === 'completed' ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
    };
    addCall(call);
    toast.success('Call logged!');
    setForm({ contactName: '', phone: '', status: 'completed', duration: '', notes: '', scheduledAt: '' });
    setShowForm(false);
  };

  const stats = {
    total: myCalls.length,
    completed: myCalls.filter(c => c.status === 'completed').length,
    scheduled: myCalls.filter(c => c.status === 'scheduled').length,
    missed: myCalls.filter(c => c.status === 'missed').length,
  };

  const totalDuration = myCalls.reduce((acc, c) => acc + c.duration, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Call Tracker</h1>
          <p className="text-slate-500 text-sm">Track all customer calls</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Log Call
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          <div className="text-xs text-slate-500 mt-1">Total Calls</div>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-100 p-4">
          <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
          <div className="text-xs text-green-600 mt-1">Completed</div>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
          <div className="text-2xl font-bold text-blue-700">{stats.scheduled}</div>
          <div className="text-xs text-blue-600 mt-1">Scheduled</div>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
          <div className="text-2xl font-bold text-amber-700">{totalDuration}m</div>
          <div className="text-xs text-amber-600 mt-1">Total Duration</div>
        </div>
      </div>

      {/* Calls list */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Call History</h3>
          <span className="text-sm text-slate-500">{myCalls.length} calls</span>
        </div>
        {myCalls.length === 0 ? (
          <div className="p-8 text-center">
            <Phone className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">No calls logged yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {[...myCalls].reverse().map(call => (
              <div key={call.id} className="flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors">
                <div className={`p-2 rounded-lg flex-shrink-0 ${statusColors[call.status]}`}>
                  <Phone className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-slate-900">{call.contactName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[call.status]}`}>
                      {call.status.replace('_', ' ').charAt(0).toUpperCase() + call.status.replace('_', ' ').slice(1)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{call.phone}</p>
                  {call.notes && <p className="text-xs text-slate-400 mt-1 italic">{call.notes}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-500 flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />{call.duration}m
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{format(parseISO(call.createdAt), 'dd MMM, HH:mm')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-semibold text-slate-900">Log Call</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Contact Name *</label>
                  <input value={form.contactName} onChange={e => setForm(p => ({ ...p, contactName: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Name" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Phone *</label>
                  <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="+91 9876543210" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as CallStatus }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="completed">Completed</option>
                    <option value="missed">Missed</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="no_answer">No Answer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Duration (minutes)</label>
                  <input type="number" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="5" />
                </div>
                {form.status === 'scheduled' && (
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Scheduled Time</label>
                    <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Call notes..." />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm">Cancel</button>
              <button onClick={handleSubmit} className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                <Check className="w-4 h-4" /> Log Call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
