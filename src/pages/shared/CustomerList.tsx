import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { Plus, Search, User, Phone, Mail, Calendar, CheckCircle, XCircle, Clock, Eye, Users, Shield } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Props { isEmployee?: boolean; }

export default function CustomerList({ isEmployee }: Props) {
  const { customers, users, currentUser } = useAppStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');

  // ALL employees see ALL customers (shared visibility across team)
  const allCustomers = customers;

  const employees = users.filter(u => u.role === 'employee');

  const filtered = allCustomers.filter(c => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.customerId.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchAgent = agentFilter === 'all' || c.agentId === agentFilter;
    return matchSearch && matchStatus && matchAgent;
  });

  const statusConfig = {
    pending: { icon: Clock, color: 'bg-amber-100 text-amber-700', label: 'Pending' },
    approved: { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: 'Approved' },
    rejected: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Rejected' },
  };

  const prefix = isEmployee ? '/employee' : '/owner';

  const counts = {
    all: allCustomers.length,
    pending: allCustomers.filter(c => c.status === 'pending').length,
    approved: allCustomers.filter(c => c.status === 'approved').length,
    rejected: allCustomers.filter(c => c.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-slate-500 text-sm flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {allCustomers.length} total · visible to all team members
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`${prefix}/customers/import`}
            className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            📥 Import CSV
          </Link>
          <Link
            to={`${prefix}/customers/new`}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Customer
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, phone, email, ID..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        {/* Agent filter for owner */}
        {!isEmployee && (
          <select
            value={agentFilter}
            onChange={e => setAgentFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Employees</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              statusFilter === s ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
          </button>
        ))}
      </div>

      {/* Team visibility notice */}
      <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 text-xs text-blue-700">
        <Shield className="w-3.5 h-3.5 flex-shrink-0" />
        All team members can view all customers. Only the assigned employee or owner can edit.
      </div>

      {/* Customer cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-600">No customers found</h3>
          <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filter.</p>
          <Link
            to={`${prefix}/customers/new`}
            className="inline-flex items-center gap-2 mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> Add First Customer
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(customer => {
            const cfg = statusConfig[customer.status];
            const agent = users.find(u => u.id === customer.agentId);
            const isMyCustomer = customer.agentId === currentUser?.id;
            return (
              <div
                key={customer.id}
                className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-all card-hover"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {customer.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900 truncate">{customer.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{customer.customerId}</p>
                  </div>
                </div>

                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="text-xs">{customer.phone}</span>
                  </div>
                  {customer.email && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="text-xs truncate">{customer.email}</span>
                    </div>
                  )}
                  {customer.dob && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="text-xs">DOB: {format(parseISO(customer.dob), 'dd MMM yyyy')}</span>
                    </div>
                  )}
                </div>

                {/* Policies */}
                {customer.policies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {customer.policies.map(p => (
                      <span key={p.id} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                        {p.type.charAt(0).toUpperCase() + p.type.slice(1)}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isMyCustomer ? 'bg-blue-400' : 'bg-slate-300'}`}
                      title={isMyCustomer ? 'Your customer' : `By ${agent?.name}`}
                    />
                    {agent?.name} · {format(parseISO(customer.createdAt), 'dd MMM')}
                  </div>
                  <Link
                    to={`${prefix}/customers/${customer.id}`}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </Link>
                </div>

                {customer.status === 'rejected' && customer.rejectionReason && (
                  <div className="mt-2 bg-red-50 rounded-lg p-2 text-xs text-red-600">
                    ❌ {customer.rejectionReason}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
