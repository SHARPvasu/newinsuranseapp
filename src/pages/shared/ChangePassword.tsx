import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { Key, Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChangePassword() {
  const { currentUser, changePassword } = useAppStore();
  const [form, setForm] = useState({ oldPass: '', newPass: '', confirmPass: '' });
  const [show, setShow] = useState({ old: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const requirements = [
    { label: 'At least 8 characters', met: form.newPass.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(form.newPass) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(form.newPass) },
    { label: 'Contains number', met: /\d/.test(form.newPass) },
    { label: 'Passwords match', met: form.newPass === form.confirmPass && form.confirmPass.length > 0 },
  ];

  const isValid = requirements.every(r => r.met) && form.oldPass.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const ok = changePassword(currentUser!.id, form.oldPass, form.newPass);
    setLoading(false);
    if (ok) {
      setSuccess(true);
      toast.success('Password changed successfully!');
      setForm({ oldPass: '', newPass: '', confirmPass: '' });
    } else {
      toast.error('Current password is incorrect');
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Password Changed!</h2>
          <p className="text-slate-500 text-sm mb-6">Your password has been updated successfully.</p>
          <button onClick={() => setSuccess(false)} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
            Change Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Change Password</h1>
        <p className="text-slate-500 text-sm mt-1">Update your account password securely.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={show.old ? 'text' : 'password'}
                value={form.oldPass}
                onChange={e => setForm(f => ({ ...f, oldPass: e.target.value }))}
                placeholder="Enter current password"
                className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button type="button" onClick={() => setShow(s => ({ ...s, old: !s.old }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {show.old ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={show.new ? 'text' : 'password'}
                value={form.newPass}
                onChange={e => setForm(f => ({ ...f, newPass: e.target.value }))}
                placeholder="Enter new password"
                className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button type="button" onClick={() => setShow(s => ({ ...s, new: !s.new }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {show.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={show.confirm ? 'text' : 'password'}
                value={form.confirmPass}
                onChange={e => setForm(f => ({ ...f, confirmPass: e.target.value }))}
                placeholder="Confirm new password"
                className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button type="button" onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {show.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Requirements */}
          {form.newPass.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-600 mb-2">Password Requirements</p>
              {requirements.map(r => (
                <div key={r.label} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${r.met ? 'bg-green-100' : 'bg-slate-100'}`}>
                    {r.met ? <CheckCircle className="w-3 h-3 text-green-600" /> : <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />}
                  </div>
                  <span className={`text-xs ${r.met ? 'text-green-600' : 'text-slate-500'}`}>{r.label}</span>
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={!isValid || loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating...</>
            ) : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
