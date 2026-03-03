import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { User, Mail, Phone, Key, Save, Shield, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { currentUser, updateUser, changePassword } = useAppStore();
  const [editing, setEditing] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [form, setForm] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
  });
  const [passForm, setPassForm] = useState({ old: '', new: '', confirm: '' });

  const handleSaveProfile = () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    updateUser(currentUser!.id, { name: form.name, phone: form.phone });
    toast.success('Profile updated!');
    setEditing(false);
  };

  const handleChangePassword = () => {
    if (!passForm.old || !passForm.new || !passForm.confirm) { toast.error('All fields required'); return; }
    if (passForm.new !== passForm.confirm) { toast.error('Passwords do not match'); return; }
    if (passForm.new.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    const success = changePassword(currentUser!.id, passForm.old, passForm.new);
    if (success) {
      toast.success('Password changed successfully!');
      setPassForm({ old: '', new: '', confirm: '' });
      setChangingPass(false);
    } else {
      toast.error('Current password is incorrect');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account information</p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
            {currentUser?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{currentUser?.name}</h2>
            <span className={`text-sm px-3 py-1 rounded-full font-medium ${currentUser?.role === 'owner' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
              {currentUser?.role === 'owner' ? '👑 Owner' : '👤 Employee'}
            </span>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} className="ml-auto flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors">
              <User className="w-4 h-4" /> Edit Profile
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email (read-only)</label>
              <input value={form.email} disabled className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-400 cursor-not-allowed" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditing(false)} className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">
                <X className="w-4 h-4" /> Cancel
              </button>
              <button onClick={handleSaveProfile} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                <User className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Full Name</p>
                <p className="text-sm font-medium text-slate-900">{currentUser?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                <Mail className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Email</p>
                <p className="text-sm font-medium text-slate-900">{currentUser?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                <Phone className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Phone</p>
                <p className="text-sm font-medium text-slate-900">{currentUser?.phone || 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                <Shield className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Role</p>
                <p className="text-sm font-medium text-slate-900 capitalize">{currentUser?.role}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900">Change Password</h3>
            <p className="text-xs text-slate-500 mt-0.5">Update your account password</p>
          </div>
          {!changingPass && (
            <button onClick={() => setChangingPass(true)} className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors">
              <Key className="w-4 h-4" /> Change Password
            </button>
          )}
        </div>

        {changingPass && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
              <input type="password" value={passForm.old} onChange={e => setPassForm(p => ({ ...p, old: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter current password" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
              <input type="password" value={passForm.new} onChange={e => setPassForm(p => ({ ...p, new: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="At least 6 characters" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
              <input type="password" value={passForm.confirm} onChange={e => setPassForm(p => ({ ...p, confirm: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Re-enter new password" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setChangingPass(false); setPassForm({ old: '', new: '', confirm: '' }); }} className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">
                <X className="w-4 h-4" /> Cancel
              </button>
              <button onClick={handleChangePassword} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                <Check className="w-4 h-4" /> Update Password
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Account info */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Account Information</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Account ID</span>
            <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{currentUser?.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Account Status</span>
            <span className="text-green-600 font-medium">Active ✓</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Member Since</span>
            <span className="text-slate-700">{currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Last Login</span>
            <span className="text-slate-700">{currentUser?.lastLogin ? new Date(currentUser.lastLogin).toLocaleString('en-IN') : 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
