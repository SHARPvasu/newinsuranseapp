import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { Upload, Download, FileText, Check, X, AlertTriangle, ArrowLeft, Table } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Customer } from '../../types';

interface Props { isEmployee?: boolean; }

interface ParsedRow {
  name: string;
  phone: string;
  email: string;
  address: string;
  dob: string;
  notes: string;
  valid: boolean;
  error?: string;
}

export default function BulkImport({ isEmployee }: Props) {
  const { currentUser, importCustomers, customers } = useAppStore();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const prefix = isEmployee ? '/employee' : '/owner';

  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');

  const downloadTemplate = () => {
    const csv = 'Name,Phone,Email,Address,Date of Birth (YYYY-MM-DD),Notes\nRajesh Kumar,+91 9876543210,rajesh@email.com,"123 MG Road, Mumbai",1990-01-15,Health insurance inquiry\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'customer-import-template.csv'; a.click();
    toast.success('Template downloaded!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) { toast.error('CSV file is empty or has only headers'); return; }

      const rows: ParsedRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        const name = cols[0] || '';
        const phone = cols[1] || '';
        const email = cols[2] || '';
        const address = cols[3] || '';
        const dob = cols[4] || '';
        const notes = cols[5] || '';

        let valid = true;
        let error = '';
        if (!name) { valid = false; error = 'Name is required'; }
        else if (!phone) { valid = false; error = 'Phone is required'; }
        else if (customers.some(c => c.phone === phone)) { valid = false; error = 'Duplicate phone number'; }

        rows.push({ name, phone, email, address, dob, notes, valid, error });
      }

      setParsedRows(rows);
      setStep('preview');
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    const validRows = parsedRows.filter(r => r.valid);
    if (validRows.length === 0) { toast.error('No valid rows to import'); return; }

    const newCustomers: Customer[] = validRows.map((row, i) => ({
      id: `cust-import-${Date.now()}-${i}`,
      customerId: `CUS-${100007 + customers.length + i}`,
      isExisting: false,
      name: row.name,
      phone: row.phone,
      email: row.email,
      address: row.address,
      dob: row.dob,
      status: 'pending' as const,
      agentId: currentUser!.id,
      documents: [],
      policies: [],
      notes: row.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notificationSent: true,
    }));

    importCustomers(newCustomers);
    toast.success(`${newCustomers.length} customers imported successfully! 🎉`);
    setStep('done');
  };

  const validCount = parsedRows.filter(r => r.valid).length;
  const invalidCount = parsedRows.filter(r => !r.valid).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`${prefix}/customers`)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bulk Import Customers</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Upload a CSV file to import multiple customers at once</p>
        </div>
      </div>

      {step === 'upload' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white text-lg mb-1">Step 1: Download Template</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Download the CSV template and fill in customer data</p>
            <button onClick={downloadTemplate} className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
              <Download className="w-4 h-4" /> Download CSV Template
            </button>
          </div>

          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white text-lg mb-1">Step 2: Upload Filled CSV</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Upload the completed CSV file</p>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
            >
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Click to upload CSV file</p>
              <p className="text-xs text-slate-400 mt-1">Supported: .csv files</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl p-4 text-sm text-amber-700 dark:text-amber-300">
            <strong>CSV Format:</strong> Name, Phone, Email, Address, Date of Birth (YYYY-MM-DD), Notes<br />
            Each customer will be submitted for owner approval.
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white text-lg">Preview Import</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{fileName} — {parsedRows.length} rows found</p>
            </div>
            <div className="flex gap-2">
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg font-medium">✓ {validCount} valid</span>
              {invalidCount > 0 && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-lg font-medium">✗ {invalidCount} invalid</span>}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">#</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">Phone</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">Email</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">DOB</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {parsedRows.map((row, i) => (
                  <tr key={i} className={row.valid ? '' : 'bg-red-50 dark:bg-red-900/20'}>
                    <td className="px-3 py-2 text-xs text-slate-500">{i + 1}</td>
                    <td className="px-3 py-2">{row.valid ? <Check className="w-4 h-4 text-green-600" /> : <span title={row.error}><AlertTriangle className="w-4 h-4 text-red-500" /></span>}</td>
                    <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">{row.name || '—'}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{row.phone || '—'}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300 text-xs">{row.email || '—'}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300 text-xs">{row.dob || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {invalidCount > 0 && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-3 text-sm text-red-700 dark:text-red-400">
              {invalidCount} row(s) have errors and will be skipped: {parsedRows.filter(r => !r.valid).map(r => r.error).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
            <button onClick={() => { setStep('upload'); setParsedRows([]); }} className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg text-sm">Back</button>
            <button onClick={handleImport} disabled={validCount === 0} className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              <Check className="w-4 h-4" /> Import {validCount} Customer{validCount !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Import Successful!</h2>
          <p className="text-slate-500 dark:text-slate-400">{validCount} customers imported and submitted for approval.</p>
          <div className="flex justify-center gap-3 mt-6">
            <button onClick={() => navigate(`${prefix}/customers`)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">View Customers</button>
            <button onClick={() => { setStep('upload'); setParsedRows([]); }} className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg text-sm">Import More</button>
          </div>
        </div>
      )}
    </div>
  );
}
