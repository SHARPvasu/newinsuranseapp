import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { Users, FileText, Target, Phone, TrendingUp, Clock, CheckCircle, XCircle, Plus, RefreshCw, Calculator, Eye, Shield } from 'lucide-react';
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function EmployeeDashboard() {
  const { currentUser, customers, leads, calls, notifications, users } = useAppStore();

  // ALL customers visible to ALL employees
  const allCustomers = customers;
  const myCustomers = customers.filter(c => c.agentId === currentUser?.id);
  const myLeads = leads.filter(l => l.agentId === currentUser?.id);
  const myCalls = calls.filter(c => c.agentId === currentUser?.id);
  const myNotifs = notifications.filter(n => n.userId === currentUser?.id && !n.isRead);

  const allApproved = allCustomers.filter(c => c.status === 'approved');
  const allPending = allCustomers.filter(c => c.status === 'pending');
  const myApproved = myCustomers.filter(c => c.status === 'approved');
  const myPending = myCustomers.filter(c => c.status === 'pending');
  const myRejected = myCustomers.filter(c => c.status === 'rejected');

  // Renewals due in next 30 days — from ALL customers (team view)
  const today = new Date();
  const renewalsDue = allCustomers.flatMap(c =>
    c.policies.filter(p => {
      if (!p.renewalDate) return false;
      try {
        const rd = parseISO(p.renewalDate);
        return isAfter(rd, today) && isBefore(rd, addDays(today, 30));
      } catch { return false; }
    }).map(p => ({ ...p, customerName: c.name, customerAgentId: c.agentId }))
  );

  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const month = d.toLocaleString('default', { month: 'short' });
    const count = myCustomers.filter(c => {
      const cd = parseISO(c.createdAt);
      return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
    }).length;
    return { month, count };
  });

  const birthdays = allCustomers.filter(c => {
    if (!c.dob) return false;
    try {
      const dob = new Date(c.dob);
      return dob.getDate() === today.getDate() && dob.getMonth() === today.getMonth();
    } catch { return false; }
  });

  const kpis = [
    { label: 'All Customers', value: allCustomers.length, icon: Users, color: 'blue', sub: `${myCustomers.length} mine · ${allApproved.length} approved`, link: '/employee/customers' },
    { label: 'Active Leads', value: myLeads.filter(l => l.status !== 'lost' && l.status !== 'converted').length, icon: Target, color: 'purple', sub: `${myLeads.length} total`, link: '/employee/leads' },
    { label: 'Total Calls', value: myCalls.length, icon: Phone, color: 'green', sub: `${myCalls.filter(c => c.status === 'completed').length} completed`, link: '/employee/calls' },
    { label: 'Renewals Due', value: renewalsDue.length, icon: RefreshCw, color: 'amber', sub: 'Next 30 days', link: '/employee/renewals' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome, {currentUser?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-slate-500 text-sm mt-1">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/employee/customers/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Add Customer
          </Link>
        </div>
      </div>

      {/* Notifications Banner */}
      {myNotifs.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm text-blue-700 font-medium">You have {myNotifs.length} unread notification{myNotifs.length > 1 ? 's' : ''}</p>
          <Link to="/employee/notifications" className="text-xs text-blue-600 font-semibold hover:underline">View All →</Link>
        </div>
      )}

      {/* Team visibility notice */}
      <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5 text-xs text-indigo-700">
        <Shield className="w-3.5 h-3.5 flex-shrink-0" />
        <span><strong>Team View:</strong> You can see all {allCustomers.length} customers across the team. {myCustomers.length} were added by you.</span>
      </div>

      {/* Birthdays banner */}
      {birthdays.length > 0 && (
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-pink-700">🎂 Today's Birthdays</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {birthdays.map(b => (
              <span key={b.id} className="text-sm text-pink-600 bg-white px-3 py-1 rounded-full border border-pink-200">
                🎉 {b.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <Link key={kpi.label} to={kpi.link} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-all card-hover">
            <div className={`inline-flex p-2 rounded-lg border mb-3 ${colorMap[kpi.color]}`}>
              <kpi.icon className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{kpi.value}</div>
            <div className="text-xs font-medium text-slate-600 mt-0.5">{kpi.label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{kpi.sub}</div>
          </Link>
        ))}
      </div>

      {/* Status breakdown + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-900 mb-4">My Customer Submissions (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Customers" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-900 mb-4">My Approval Status</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${myCustomers.length ? (myApproved.length / myCustomers.length) * 100 : 0}%` }} />
              </div>
              <div className="text-right min-w-20">
                <p className="text-xs text-slate-500">Approved</p>
                <p className="text-sm font-bold text-green-600">{myApproved.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${myCustomers.length ? (myPending.length / myCustomers.length) * 100 : 0}%` }} />
              </div>
              <div className="text-right min-w-20">
                <p className="text-xs text-slate-500">Pending</p>
                <p className="text-sm font-bold text-amber-600">{myPending.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${myCustomers.length ? (myRejected.length / myCustomers.length) * 100 : 0}%` }} />
              </div>
              <div className="text-right min-w-20">
                <p className="text-xs text-slate-500">Rejected</p>
                <p className="text-sm font-bold text-red-600">{myRejected.length}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Conversion Rate</span>
                <span className="font-semibold text-slate-900">
                  {myCustomers.length ? Math.round((myApproved.length / myCustomers.length) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Policies (All)</span>
                <span className="font-semibold text-slate-900">{allCustomers.reduce((s, c) => s + c.policies.length, 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/employee/customers/new', icon: Plus, label: 'New Customer', color: 'bg-blue-600 hover:bg-blue-700' },
          { to: '/employee/renewals', icon: RefreshCw, label: 'Renewals', color: 'bg-green-600 hover:bg-green-700' },
          { to: '/employee/calculator', icon: Calculator, label: 'Premium Calc', color: 'bg-purple-600 hover:bg-purple-700' },
          { to: '/employee/leads', icon: Target, label: 'Manage Leads', color: 'bg-amber-600 hover:bg-amber-700' },
        ].map(item => (
          <Link key={item.to} to={item.to} className={`${item.color} text-white rounded-xl p-4 flex flex-col items-center gap-2 text-center transition-colors shadow-sm`}>
            <item.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* ALL customers — team view */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">
            All Team Customers
            <span className="ml-2 text-xs font-normal text-slate-500">({allCustomers.length} total — visible to all employees)</span>
          </h3>
          <Link to="/employee/customers" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All →</Link>
        </div>
        {allCustomers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No customers yet. Add your first customer!</p>
            <Link to="/employee/customers/new" className="inline-flex items-center gap-2 mt-3 text-sm text-blue-600 hover:underline">
              <Plus className="w-4 h-4" /> Add Customer
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {allCustomers.slice(-6).reverse().map(c => {
              const agent = users.find(u => u.id === c.agentId);
              const isMine = c.agentId === currentUser?.id;
              return (
                <div key={c.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">{c.name}</p>
                      {isMine && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full border border-blue-100">Mine</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {c.customerId} · By {agent?.name || 'Unknown'} · {format(parseISO(c.createdAt), 'dd MMM')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.status === 'approved' ? (
                      <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Approved
                      </span>
                    ) : c.status === 'rejected' ? (
                      <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3" /> Rejected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                    <Link to={`/employee/customers/${c.id}`} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5">
                      <Eye className="w-3 h-3" /> View
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Renewals due soon */}
      {renewalsDue.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-100 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-amber-500" /> Renewals Due Soon
            </h3>
            <Link to="/employee/renewals" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All →</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {renewalsDue.slice(0, 3).map((p, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{p.customerName}</p>
                  <p className="text-xs text-slate-500">{p.type} · {p.policyNumber}</p>
                </div>
                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                  Due: {p.renewalDate}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
