import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { RefreshCw, AlertTriangle, CheckCircle, Calendar, Eye, Shield, Heart, Car, Briefcase } from 'lucide-react';
import { parseISO, differenceInDays, isAfter, isBefore, addDays, format } from 'date-fns';
import toast from 'react-hot-toast';

const policyIcons: Record<string, React.ElementType> = {
  health: Heart, life: Shield, motor: Car, miscellaneous: Briefcase,
};

export default function EmployeeRenewals() {
  const { currentUser, customers } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'overdue' | 'due30' | 'due60' | 'due90'>('all');

  const myCustomers = customers.filter(c => c.agentId === currentUser?.id);
  const today = new Date();

  const allRenewals = myCustomers.flatMap(c =>
    c.policies
      .filter(p => p.renewalDate || p.endDate)
      .map(p => {
        const dueDate = p.renewalDate || p.endDate;
        const due = parseISO(dueDate);
        const daysLeft = differenceInDays(due, today);
        return {
          ...p,
          customerName: c.name,
          customerId: c.id,
          customerCode: c.customerId,
          dueDate,
          daysLeft,
          isOverdue: daysLeft < 0,
          isDue30: daysLeft >= 0 && daysLeft <= 30,
          isDue60: daysLeft > 30 && daysLeft <= 60,
          isDue90: daysLeft > 60 && daysLeft <= 90,
        };
      })
  ).sort((a, b) => a.daysLeft - b.daysLeft);

  const filtered = allRenewals.filter(r => {
    if (filter === 'overdue') return r.isOverdue;
    if (filter === 'due30') return r.isDue30;
    if (filter === 'due60') return r.isDue60;
    if (filter === 'due90') return r.isDue90;
    return true;
  });

  const counts = {
    all: allRenewals.length,
    overdue: allRenewals.filter(r => r.isOverdue).length,
    due30: allRenewals.filter(r => r.isDue30).length,
    due60: allRenewals.filter(r => r.isDue60).length,
    due90: allRenewals.filter(r => r.isDue90).length,
  };

  const getUrgencyColor = (daysLeft: number) => {
    if (daysLeft < 0) return 'bg-red-100 text-red-700 border-red-200';
    if (daysLeft <= 7) return 'bg-red-50 text-red-600 border-red-100';
    if (daysLeft <= 30) return 'bg-amber-50 text-amber-600 border-amber-100';
    if (daysLeft <= 60) return 'bg-yellow-50 text-yellow-600 border-yellow-100';
    return 'bg-green-50 text-green-600 border-green-100';
  };

  const handleSendReminder = (name: string) => {
    toast.success(`Reminder sent to ${name}!`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Policy Renewals</h1>
        <p className="text-slate-500 text-sm mt-1">Track upcoming and overdue policy renewals.</p>
      </div>

      {/* Summary badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-red-600">{counts.overdue}</p>
          <p className="text-xs text-red-500">Overdue</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-amber-600">{counts.due30}</p>
          <p className="text-xs text-amber-500">Due in 30 days</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-yellow-600">{counts.due60}</p>
          <p className="text-xs text-yellow-500">Due in 60 days</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{counts.due90}</p>
          <p className="text-xs text-green-500">Due in 90 days</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: 'all', label: 'All Renewals' },
          { key: 'overdue', label: '🔴 Overdue' },
          { key: 'due30', label: '🟡 30 Days' },
          { key: 'due60', label: '🟢 60 Days' },
          { key: 'due90', label: '⚪ 90 Days' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              filter === tab.key ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label} ({counts[tab.key]})
          </button>
        ))}
      </div>

      {/* Renewal list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-600">No renewals in this category</h3>
          <p className="text-slate-400 text-sm">Great! Your policies are up to date.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p, i) => {
            const Icon = policyIcons[p.type] || Shield;
            const urgencyColor = getUrgencyColor(p.daysLeft);

            return (
              <div key={i} className={`bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition-all ${p.isOverdue ? 'border-red-200' : 'border-slate-100'}`}>
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-blue-50 rounded-xl flex-shrink-0">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <h3 className="font-semibold text-slate-900">{p.customerName}</h3>
                        <p className="text-xs text-slate-500">{p.type.charAt(0).toUpperCase() + p.type.slice(1)} · {p.policyNumber} · {p.insurer}</p>
                      </div>
                      <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold border ${urgencyColor}`}>
                        {p.isOverdue ? (
                          <><AlertTriangle className="w-3 h-3" /> {Math.abs(p.daysLeft)} days overdue</>
                        ) : p.daysLeft === 0 ? (
                          <><AlertTriangle className="w-3 h-3" /> Due today</>
                        ) : (
                          <><Calendar className="w-3 h-3" /> {p.daysLeft} days left</>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <div>
                        <span className="text-xs text-slate-500">Premium: </span>
                        <span className="text-xs font-semibold text-slate-900">₹{p.premium.toLocaleString('en-IN')}/yr</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">Due Date: </span>
                        <span className="text-xs font-semibold text-slate-900">{format(parseISO(p.dueDate), 'dd MMM yyyy')}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">Customer: </span>
                        <span className="text-xs font-semibold text-slate-900">{p.customerCode}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleSendReminder(p.customerName)}
                        className="flex items-center gap-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg font-medium transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" /> Send Reminder
                      </button>
                      <Link to={`/employee/customers/${p.customerId}`} className="flex items-center gap-1.5 text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg font-medium transition-colors">
                        <Eye className="w-3 h-3" /> View Customer
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
