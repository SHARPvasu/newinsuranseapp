import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileText, Download, TrendingUp, Users, Shield, Calendar, BarChart2, Target, RefreshCw } from 'lucide-react';
import { format, parseISO, subDays, subMonths } from 'date-fns';
import toast from 'react-hot-toast';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function OwnerReports() {
  const { customers, users, leads, calls } = useAppStore();
  const [dateRange, setDateRange] = useState('30');
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'agents' | 'policies'>('overview');

  const agents = users.filter(u => u.role === 'employee');
  const totalPolicies = customers.flatMap(c => c.policies);
  const totalPremium = totalPolicies.reduce((s, p) => s + p.premium, 0);

  // Customer trend data (last 6 months)
  const customerTrend = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const count = customers.filter(c => {
      const cd = parseISO(c.createdAt);
      return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
    }).length;
    return { month: format(d, 'MMM yy'), count };
  });

  // Policy type distribution
  const policyDist = ['health', 'life', 'motor', 'miscellaneous'].map(type => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: totalPolicies.filter(p => p.type === type).length || 1,
  }));

  // Agent performance
  const agentPerf = agents.map(a => {
    const myCustomers = customers.filter(c => c.agentId === a.id);
    return {
      name: a.name.split(' ')[0],
      customers: myCustomers.length,
      approved: myCustomers.filter(c => c.status === 'approved').length,
      leads: leads.filter(l => l.agentId === a.id).length,
      calls: calls.filter(c => c.agentId === a.id).length,
    };
  });

  // Revenue simulation
  const revenueTrend = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const monthCustomers = customers.filter(c => {
      const cd = parseISO(c.createdAt);
      return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear() && c.status === 'approved';
    });
    const revenue = monthCustomers.reduce((s, c) => s + c.policies.reduce((ps, p) => ps + p.premium, 0), 0);
    return { month: format(d, 'MMM yy'), revenue: revenue || Math.floor(Math.random() * 50000) + 20000 };
  });

  // Lead funnel
  const leadFunnel = ['new', 'contacted', 'interested', 'converted', 'lost'].map(status => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: leads.filter(l => l.status === status).length,
  }));

  const handleExport = (type: string) => {
    toast.success(`Exporting ${type} report...`);
  };

  const kpis = [
    { label: 'Total Revenue', value: `₹${(totalPremium / 100000).toFixed(1)}L`, icon: TrendingUp, color: 'text-blue-600 bg-blue-50', change: '+15%' },
    { label: 'Total Customers', value: customers.length, icon: Users, color: 'text-green-600 bg-green-50', change: '+8%' },
    { label: 'Active Policies', value: totalPolicies.filter(p => p.status === 'active').length, icon: Shield, color: 'text-purple-600 bg-purple-50', change: '+12%' },
    { label: 'Conversion Rate', value: `${customers.length ? Math.round((customers.filter(c => c.status === 'approved').length / customers.length) * 100) : 0}%`, icon: Target, color: 'text-amber-600 bg-amber-50', change: '+3%' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-500 text-sm">Business performance overview</p>
        </div>
        <div className="flex gap-2">
          <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button onClick={() => handleExport('full')} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className={`inline-flex p-2 rounded-lg mb-3 ${kpi.color}`}>
              <kpi.icon className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{kpi.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{kpi.label}</div>
            <div className="text-xs text-green-600 font-medium mt-1">{kpi.change} vs last period</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {['overview', 'customers', 'agents', 'policies'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab as typeof activeTab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-900">Revenue Trend</h3>
              <button onClick={() => handleExport('revenue')} className="text-xs text-blue-600 flex items-center gap-1 hover:underline"><Download className="w-3 h-3" /> Export</button>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₹${Math.round(v / 1000)}K`} />
                <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Policy Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={policyDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {policyDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Customer Submissions Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={customerTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Customers" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Lead Funnel</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={leadFunnel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} width={70} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Agent Performance */}
      {activeTab === 'agents' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Agent Performance Comparison</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={agentPerf}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="customers" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Customers" />
                <Bar dataKey="approved" fill="#10b981" radius={[4, 4, 0, 0]} name="Approved" />
                <Bar dataKey="leads" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Agent Leaderboard</h3>
              <button onClick={() => handleExport('agents')} className="text-xs text-blue-600 flex items-center gap-1 hover:underline"><Download className="w-3 h-3" /> Export</button>
            </div>
            <div className="divide-y divide-slate-50">
              {agentPerf.sort((a, b) => b.approved - a.approved).map((a, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-700' : 'bg-orange-50 text-orange-600'}`}>
                    #{i + 1}
                  </span>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {a.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 text-sm">{a.name}</p>
                    <p className="text-xs text-slate-500">{a.customers} customers · {a.calls} calls</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">{a.approved}</p>
                    <p className="text-xs text-slate-400">Approved</p>
                  </div>
                </div>
              ))}
              {agentPerf.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-sm">No agents yet</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customers tab */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total', value: customers.length, color: 'bg-blue-50 text-blue-700' },
              { label: 'Approved', value: customers.filter(c => c.status === 'approved').length, color: 'bg-green-50 text-green-700' },
              { label: 'Pending', value: customers.filter(c => c.status === 'pending').length, color: 'bg-amber-50 text-amber-700' },
              { label: 'Rejected', value: customers.filter(c => c.status === 'rejected').length, color: 'bg-red-50 text-red-700' },
              { label: 'New Customers', value: customers.filter(c => !c.isExisting).length, color: 'bg-purple-50 text-purple-700' },
              { label: 'Existing Customers', value: customers.filter(c => c.isExisting).length, color: 'bg-slate-50 text-slate-700' },
            ].map(item => (
              <div key={item.label} className={`${item.color} rounded-xl p-4 border border-opacity-20`}>
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs mt-0.5 opacity-75">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">All Customers</h3>
              <button onClick={() => handleExport('customers')} className="text-xs text-blue-600 flex items-center gap-1"><Download className="w-3 h-3" /> Export CSV</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['ID', 'Name', 'Phone', 'Agent', 'Policies', 'Premium', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {customers.slice(0, 10).map(c => {
                    const agent = users.find(u => u.id === c.agentId);
                    const premium = c.policies.reduce((s, p) => s + p.premium, 0);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-xs text-slate-500">{c.customerId}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                        <td className="px-4 py-3 text-slate-600">{c.phone}</td>
                        <td className="px-4 py-3 text-slate-600">{agent?.name || 'N/A'}</td>
                        <td className="px-4 py-3 text-slate-600">{c.policies.length}</td>
                        <td className="px-4 py-3 text-slate-600">₹{premium.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'approved' ? 'bg-green-100 text-green-700' : c.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Policies tab */}
      {activeTab === 'policies' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {['health', 'life', 'motor', 'miscellaneous'].map((type, i) => (
              <div key={type} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center">
                <p className="text-2xl font-bold" style={{ color: COLORS[i] }}>{totalPolicies.filter(p => p.type === type).length}</p>
                <p className="text-xs text-slate-500 capitalize mt-1">{type}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Premium by Policy Type</h3>
            <div className="space-y-3">
              {['health', 'life', 'motor', 'miscellaneous'].map((type, i) => {
                const premium = totalPolicies.filter(p => p.type === type).reduce((s, p) => s + p.premium, 0);
                const pct = totalPremium ? Math.round((premium / totalPremium) * 100) : 0;
                return (
                  <div key={type} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 capitalize w-24">{type}</span>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i] }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-900 w-16 text-right">₹{(premium / 1000).toFixed(0)}K ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
