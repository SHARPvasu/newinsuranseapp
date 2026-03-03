import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { Shield, Heart, Car, Briefcase, Search, FileText, Calendar, IndianRupee, Eye } from 'lucide-react';
import { format } from 'date-fns';

const policyIcons: Record<string, React.ElementType> = {
  health: Heart,
  life: Shield,
  motor: Car,
  miscellaneous: Briefcase,
};

const policyColors: Record<string, string> = {
  health: 'bg-blue-100 text-blue-700',
  life: 'bg-green-100 text-green-700',
  motor: 'bg-amber-100 text-amber-700',
  miscellaneous: 'bg-purple-100 text-purple-700',
};

export default function EmployeePolicies() {
  const { currentUser, customers } = useAppStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'health' | 'life' | 'motor' | 'miscellaneous'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'pending'>('all');

  const myCustomers = customers.filter(c => c.agentId === currentUser?.id);

  const allPolicies = myCustomers.flatMap(c =>
    c.policies.map(p => ({ ...p, customerName: c.name, customerId: c.customerId, customerDbId: c.id }))
  );

  const filtered = allPolicies.filter(p => {
    const matchSearch = !search ||
      p.policyNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.customerName.toLowerCase().includes(search.toLowerCase()) ||
      p.insurer.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || p.type === typeFilter;
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const totalPremium = filtered.reduce((s, p) => s + p.premium, 0);
  const totalSumAssured = filtered.reduce((s, p) => s + p.sumAssured, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Policies</h1>
          <p className="text-slate-500 text-sm">{allPolicies.length} total policies across {myCustomers.length} customers</p>
        </div>
        <Link to="/employee/customers/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Shield className="w-4 h-4" /> Add Policy
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Policies', value: allPolicies.length, color: 'blue' },
          { label: 'Active', value: allPolicies.filter(p => p.status === 'active').length, color: 'green' },
          { label: 'Total Premium', value: `₹${(totalPremium / 1000).toFixed(0)}K`, color: 'purple' },
          { label: 'Sum Assured', value: `₹${(totalSumAssured / 100000).toFixed(1)}L`, color: 'amber' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <p className={`text-xl font-bold text-${card.color}-600`}>{card.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by policy number, customer, insurer..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as typeof typeFilter)} className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="all">All Types</option>
          <option value="health">Health</option>
          <option value="life">Life</option>
          <option value="motor">Motor</option>
          <option value="miscellaneous">Miscellaneous</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Policy list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-600">No policies found</h3>
          <p className="text-slate-400 text-sm">Adjust filters or add new customers with policies.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => {
            const Icon = policyIcons[p.type] || Shield;
            const color = policyColors[p.type] || 'bg-slate-100 text-slate-700';
            return (
              <div key={p.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl ${color} flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <h3 className="font-semibold text-slate-900">{p.type.charAt(0).toUpperCase() + p.type.slice(1)} Insurance</h3>
                        <p className="text-xs text-slate-500">{p.policyNumber} · {p.insurer}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          p.status === 'active' ? 'bg-green-100 text-green-700' :
                          p.status === 'expired' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>{p.status}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                      <div className="flex items-center gap-1.5">
                        <IndianRupee className="w-3 h-3 text-slate-400" />
                        <div><p className="text-xs text-slate-500">Premium</p><p className="text-xs font-semibold text-slate-900">₹{p.premium.toLocaleString('en-IN')}/yr</p></div>
                      </div>
                      <div><p className="text-xs text-slate-500">Sum Assured</p><p className="text-xs font-semibold text-slate-900">₹{p.sumAssured.toLocaleString('en-IN')}</p></div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <div><p className="text-xs text-slate-500">Renewal</p><p className="text-xs font-semibold text-slate-900">{p.renewalDate || 'N/A'}</p></div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Customer</p>
                        <p className="text-xs font-semibold text-slate-900 truncate">{p.customerName}</p>
                      </div>
                    </div>
                  </div>
                  <Link to={`/employee/customers/${p.customerDbId}`} className="flex-shrink-0 p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
