import { useAppStore } from '../../store/appStore';
import { DollarSign, CheckCircle, Clock, CreditCard, TrendingUp, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export default function EmployeeCommissions() {
  const { currentUser, commissions } = useAppStore();
  const myComms = commissions.filter(c => c.agentId === currentUser?.id);

  const totalEarned = myComms.reduce((s, c) => s + c.amount, 0);
  const totalPaid = myComms.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0);
  const totalPending = myComms.filter(c => c.status === 'pending').reduce((s, c) => s + c.amount, 0);
  const totalApproved = myComms.filter(c => c.status === 'approved').reduce((s, c) => s + c.amount, 0);

  const byType = ['health', 'life', 'motor', 'miscellaneous'].map(t => ({
    name: t.charAt(0).toUpperCase() + t.slice(1),
    value: myComms.filter(c => c.policyType === t).reduce((s, c) => s + c.amount, 0),
  })).filter(d => d.value > 0);

  const handleExport = () => {
    const csv = ['Policy,Customer,Type,Amount,Status,Date', ...myComms.map(c => `${c.policyNumber},${c.customerName},${c.commissionType},${c.amount},${c.status},${c.createdAt.split('T')[0]}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'my-commissions.csv'; a.click();
    toast.success('Statement downloaded!');
  };

  const statusColors: Record<string, string> = { pending: 'bg-amber-100 text-amber-700', approved: 'bg-blue-100 text-blue-700', paid: 'bg-green-100 text-green-700' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Commissions</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{myComms.length} total commissions</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"><Download className="w-4 h-4" /> Download Statement</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Earned', value: `₹${totalEarned.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
          { label: 'Pending', value: `₹${totalPending.toLocaleString('en-IN')}`, icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' },
          { label: 'Approved', value: `₹${totalApproved.toLocaleString('en-IN')}`, icon: CheckCircle, color: 'text-green-600 bg-green-50 dark:bg-green-900/30' },
          { label: 'Paid', value: `₹${totalPaid.toLocaleString('en-IN')}`, icon: CreditCard, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-4">
            <div className={`inline-flex p-2 rounded-lg mb-3 ${kpi.color}`}><kpi.icon className="w-4 h-4" /></div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{kpi.value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700"><h3 className="font-semibold text-slate-900 dark:text-white">Commission History</h3></div>
          <div className="divide-y divide-slate-50 dark:divide-slate-700">
            {myComms.length === 0 ? (
              <div className="p-12 text-center text-slate-400">No commissions yet</div>
            ) : myComms.map(c => (
              <div key={c.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0"><DollarSign className="w-4 h-4 text-blue-600" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{c.customerName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{c.policyNumber} · {c.policyType} · {c.commissionType.replace('_', ' ')}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">₹{c.amount.toLocaleString('en-IN')}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[c.status]}`}>{c.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {byType.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">By Policy Type</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byType} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                  {byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
