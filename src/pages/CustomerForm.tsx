import { useNavigate } from 'react-router-dom';
import { User, FileText, ArrowRight } from 'lucide-react';

interface Props { isEmployee?: boolean; }

/**
 * This page is the entry point: choose New Customer or Existing Customer.
 * New customer → full multi-step form (CustomerFormNew)
 * Existing customer → search + add policy (ExistingCustomerPolicy)
 */
export default function CustomerForm({ isEmployee }: Props) {
  const navigate = useNavigate();
  const prefix = isEmployee ? '/employee' : '/owner';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Add Customer</h1>
        <p className="text-slate-500 text-sm mt-1">Choose whether to register a new customer or add a policy to an existing one.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* New Customer */}
        <button
          onClick={() => navigate(`${prefix}/customers/new-form`)}
          className="group p-6 bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left shadow-sm hover:shadow-md"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">New Customer</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Register a brand-new customer with personal details, policy information, KYC documents, and live photo.
          </p>
          <div className="flex items-center gap-1 mt-4 text-blue-600 text-sm font-medium group-hover:gap-2 transition-all">
            Start Registration <ArrowRight className="w-4 h-4" />
          </div>
        </button>

        {/* Existing Customer */}
        <button
          onClick={() => navigate(`${prefix}/customers/existing`)}
          className="group p-6 bg-white rounded-2xl border-2 border-slate-200 hover:border-green-400 hover:bg-green-50 transition-all text-left shadow-sm hover:shadow-md"
        >
          <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition-all">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Existing Customer</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Search for an already approved customer and add a new insurance policy to their profile.
          </p>
          <div className="flex items-center gap-1 mt-4 text-green-600 text-sm font-medium group-hover:gap-2 transition-all">
            Search & Add Policy <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
        <strong>Note:</strong> All new customer submissions require owner approval before they become active.
        Existing customer policy additions are reflected immediately.
      </div>
    </div>
  );
}
