import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { DollarSign, CheckCircle, Clock, CreditCard, TrendingUp, Download, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

export default function OwnerCommissions() {
  const { commissions, updateCommission, users } = useAppStore();
  const [filter, setFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState('all');

  const agents = users.filter(u => u.role === 'employee');

  const filtered = commissions.filter(c => {
    const matchStatus = filter === 'all' || c.status === filter;
    const matchAgent = agentFilter === 'all' || c.agentId === agentFilter;
    return matchStatus && matchAgent;
  });

  const totalEarned = commissions.reduce((s, c) => s + c.amount, 0);
  const totalPaid = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0);
  const totalPending = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + c.amount, 0);
  const totalApproved = commissions.filter(c => c.status === 'approved').reduce((s, c) => s + c.amount, 0);

  const approveComm = (id: string) => {
    updateCommission(id, { status: 'approved' });
    toast.success('Commission approved');
  };

  const payComm = (id: string) => {
    updateCommission(id, { status: 'paid', paidAt: new Date().toISOString() });
    toast.success('Commission marked as paid');
  };

  const handleExport = () => {
    const csvData = [
      ['Agent', 'Customer', 'Policy', 'Type', 'Amount', 'Status', 'Date'].join(','),
      ...filtered.map(c => {
        const agent = users.find(u => u.id === c.agentId);
        return [agent?.name, c.customerName, c.policyNumber, c.commissionType, c.amount, c.status, c.createdAt.split('T')[0]].join(',');
      })
    ].join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'commissions.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Commission report exported!');
  };

  const statusColors: Record<string, string> = { pending: 'bg-amber-100 text-amber-700', approved: 'bg-blue-100 text-blue-700', paid: 'bg-green-100 text-green-700' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Commission Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Track and manage agent commissions</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"><Download className="w-4 h-4" /> Export CSV</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Earned', value: `₹${(totalEarned / 1000).toFixed(1)}K`, icon: TrendingUp, color: 'blue' },
          { label: 'Pending', value: `₹${(totalPending / 1000).toFixed(1)}K`, icon: Clock, color: 'amber' },
          { label: 'Approved', value: `₹${(totalApproved / 1000).toFixed(1)}K`, icon: CheckCircle, color: 'green' },
          { label: 'Paid Out', value: `₹${(totalPaid / 1000).toFixed(1)}K`, icon: CreditCard, color: 'purple' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-4">
            <div className={`inline-flex p-2 rounded-lg mb-3 bg-${kpi.color}-50 dark:bg-${kpi.color}-900/30 text-${kpi.color}-600`}>
              <kpi.icon className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{kpi.value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'approved', 'paid'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${filter === s ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)} ({commissions.filter(c => s === 'all' ? true : c.status === s).length})
            </button>
          ))}
        </div>
        <select value={agentFilter} onChange={e => setAgentFilter(e.target.value)} className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
          <option value="all">All Agents</option>
          {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                {['Agent', 'Customer', 'Policy', 'Type', 'Amount', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">No commissions found</td></tr>
              ) : filtered.map(c => {
                const agent = users.find(u => u.id === c.agentId);
                return (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{agent?.name || 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{c.customerName}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">{c.policyNumber}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 capitalize text-xs">{c.commissionType.replace('_', ' ')}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">₹{c.amount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[c.status]}`}>{c.status}</span></td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{c.createdAt.split('T')[0]}</td>
                    <td className="px-4 py-3">
                      {c.status === 'pending' && <button onClick={() => approveComm(c.id)} className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 font-medium">Approve</button>}
                      {c.status === 'approved' && <button onClick={() => payComm(c.id)} className="text-xs bg-green-50 dark:bg-green-900/30 text-green-600 px-2 py-1 rounded hover:bg-green-100 dark:hover:bg-green-900/50 font-medium">Pay</button>}
                      {c.status === 'paid' && <span className="text-xs text-green-600">✓ Paid</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agent-wise Summary */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Users className="w-4 h-4" /> Agent-wise Commission Summary</h3>
        <div className="space-y-3">
          {agents.map(agent => {
            const agentComms = commissions.filter(c => c.agentId === agent.id);
            const total = agentComms.reduce((s, c) => s + c.amount, 0);
            const paid = agentComms.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0);
            return (
              <div key={agent.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{agent.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">{agent.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{agentComms.length} commissions</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">₹{total.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-green-600">₹{paid.toLocaleString('en-IN')} paid</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
