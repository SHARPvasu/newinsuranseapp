import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, CheckSquare, TrendingUp, UserPlus, Target, Calendar, CheckCircle } from 'lucide-react';
import { format, subDays, isSameDay, parseISO } from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function OwnerDashboard() {
  const { customers, users, leads, calls, notifications } = useAppStore();

  const agents = users.filter(u => u.role === 'employee');
  const pending = customers.filter(c => c.status === 'pending');
  const approved = customers.filter(c => c.status === 'approved');
  const rejected = customers.filter(c => c.status === 'rejected');

  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const day = subDays(new Date(), 6 - i);
    const count = customers.filter(c => {
      try { return isSameDay(parseISO(c.createdAt), day); } catch { return false; }
    }).length;
    return { date: format(day, 'dd MMM'), count };
  });

  const policyDist = ['health', 'life', 'motor', 'miscellaneous'].map(type => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: customers.filter(c => c.policies.some(p => p.type === type)).length || Math.floor(Math.random() * 8) + 2,
  }));

  const revData = Array.from({ length: 6 }).map((_, i) => ({
    month: format(subDays(new Date(), (5 - i) * 30), 'MMM'),
    revenue: 50000 + i * 15000 + Math.floor(Math.random() * 20000),
  }));

  const today = new Date();
  const birthdays = customers.filter(c => {
    if (!c.dob) return false;
    try {
      const dob = new Date(c.dob);
      return dob.getDate() === today.getDate() && dob.getMonth() === today.getMonth();
    } catch { return false; }
  });

  const kpis = [
    { label: 'Pending Approvals', value: pending.length, icon: CheckSquare, bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600', sub: '+2 today', link: '/owner/approvals' },
    { label: 'Total Customers', value: customers.length, icon: Users, bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600', sub: `${approved.length} approved`, link: '/owner/customers' },
    { label: 'Active Agents', value: agents.length, icon: UserPlus, bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-600', sub: `${agents.filter(a => a.isActive).length} active`, link: '/owner/agents' },
    { label: 'Active Leads', value: leads.filter(l => l.status !== 'converted' && l.status !== 'lost').length, icon: Target, bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-600', sub: `${leads.filter(l => l.status === 'interested').length} interested`, link: '/owner/leads' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
        </div>
        <Link to="/owner/approvals" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <CheckSquare className="w-4 h-4" /> Review Approvals
          {pending.length > 0 && <span className="bg-white text-blue-600 rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">{pending.length}</span>}
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Link key={kpi.label} to={kpi.link} className={`bg-white rounded-xl border ${kpi.border} p-5 shadow-sm hover:shadow-md transition-all card-hover`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg border ${kpi.bg} ${kpi.border}`}>
                <kpi.icon className={`w-5 h-5 ${kpi.text}`} />
              </div>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{kpi.value}</div>
            <div className="text-sm font-medium text-slate-600 mt-0.5">{kpi.label}</div>
            <div className="text-xs text-slate-400 mt-1">{kpi.sub}</div>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">Customer Submissions (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={last7}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Submissions" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">Policy Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={policyDist} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                {policyDist.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={revData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₹${Math.round(v / 1000)}K`} />
              <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {customers.slice(-4).reverse().map(c => (
              <div key={c.id} className="flex items-start gap-2">
                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${c.status === 'approved' ? 'bg-green-500' : c.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'}`} />
                <div>
                  <p className="text-xs font-medium text-slate-700">{c.name}</p>
                  <p className="text-xs text-slate-400">{c.status} · {format(parseISO(c.createdAt), 'dd MMM')}</p>
                </div>
              </div>
            ))}
            {customers.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No activity yet</p>}
          </div>
          {birthdays.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-pink-600 mb-2">
                <Calendar className="w-3 h-3" /> Today's Birthdays 🎂
              </div>
              {birthdays.map(b => (
                <div key={b.id} className="text-xs text-slate-600 py-0.5">🎉 {b.name}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending approvals quick list */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Pending Approvals</h3>
          <Link to="/owner/approvals" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All →</Link>
        </div>
        {pending.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">All caught up! No pending approvals.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {pending.slice(0, 5).map(c => {
              const agent = users.find(u => u.id === c.agentId);
              return (
                <div key={c.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.customerId} · Agent: {agent?.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">Pending</span>
                    <Link to="/owner/approvals" className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 font-medium">Review</Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-700">{approved.length}</div>
          <div className="text-sm text-green-600">Approved</div>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <div className="text-2xl font-bold text-amber-700">{pending.length}</div>
          <div className="text-sm text-amber-600">Pending</div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <div className="text-2xl font-bold text-red-700">{rejected.length}</div>
          <div className="text-sm text-red-600">Rejected</div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="text-2xl font-bold text-blue-700">{calls.length}</div>
          <div className="text-sm text-blue-600">Total Calls</div>
        </div>
      </div>
    </div>
  );
}
