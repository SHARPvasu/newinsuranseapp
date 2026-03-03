import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import {
  Search, User, Phone, Mail, CheckCircle, Shield, Heart, Car, Briefcase,
  ChevronRight, ChevronLeft, Check, Plus, Trash2, Camera, Upload, X, ArrowLeft,
  FileText, AlertTriangle, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Policy, PolicyType, FamilyMember, Document as DocType } from '../../types';

interface Props { isEmployee?: boolean; }
type Step = 'search' | 'policy' | 'documents' | 'review';

// Required documents based on policy type
const POLICY_DOCUMENT_REQUIREMENTS: Record<PolicyType, { required: { key: string; label: string; type: DocType['type'] }[]; optional: { key: string; label: string; type: DocType['type'] }[] }> = {
  health: {
    required: [
      { key: 'aadhaar_front', label: 'Aadhaar Card (Front)', type: 'aadhaar' },
      { key: 'aadhaar_back', label: 'Aadhaar Card (Back)', type: 'aadhaar' },
      { key: 'pan', label: 'PAN Card', type: 'pan' },
      { key: 'photo', label: 'Passport Size Photo', type: 'photo' },
    ],
    optional: [
      { key: 'medical_report', label: 'Medical Report', type: 'other' },
      { key: 'prev_policy', label: 'Previous Policy Copy', type: 'other' },
    ],
  },
  life: {
    required: [
      { key: 'aadhaar_front', label: 'Aadhaar Card (Front)', type: 'aadhaar' },
      { key: 'aadhaar_back', label: 'Aadhaar Card (Back)', type: 'aadhaar' },
      { key: 'pan', label: 'PAN Card', type: 'pan' },
      { key: 'photo', label: 'Passport Size Photo', type: 'photo' },
    ],
    optional: [
      { key: 'income_proof', label: 'Income Proof / Salary Slip', type: 'other' },
      { key: 'medical_report', label: 'Medical Report', type: 'other' },
      { key: 'address_proof', label: 'Address Proof', type: 'other' },
    ],
  },
  motor: {
    required: [
      { key: 'aadhaar_front', label: 'Aadhaar Card (Front)', type: 'aadhaar' },
      { key: 'pan', label: 'PAN Card', type: 'pan' },
      { key: 'rc_book', label: 'RC Book (Registration Certificate)', type: 'rc_book' },
    ],
    optional: [
      { key: 'driving_license', label: 'Driving License', type: 'other' },
      { key: 'prev_policy', label: 'Previous Insurance Policy', type: 'other' },
      { key: 'vehicle_photo', label: 'Vehicle Photo', type: 'other' },
      { key: 'pollution_cert', label: 'Pollution Certificate (PUC)', type: 'other' },
    ],
  },
  miscellaneous: {
    required: [
      { key: 'aadhaar_front', label: 'Aadhaar Card / Company ID', type: 'aadhaar' },
      { key: 'pan', label: 'PAN Card / GST Certificate', type: 'pan' },
    ],
    optional: [
      { key: 'company_doc', label: 'Company Registration Document', type: 'other' },
      { key: 'employee_list', label: 'Employee List (for Group Policy)', type: 'other' },
      { key: 'asset_doc', label: 'Asset Valuation Document', type: 'other' },
      { key: 'special_notes', label: 'Special Notes / Endorsement', type: 'other' },
    ],
  },
};

export default function ExistingCustomerPolicy({ isEmployee }: Props) {
  const { customers, addPolicyToCustomer, currentUser, addNotification, users } = useAppStore();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Policy form state
  const [policyType, setPolicyType] = useState<PolicyType>('health');
  const [formData, setFormData] = useState({
    policyNumber: '', insurer: '', premium: '', sumAssured: '', startDate: '', endDate: '',
    height: '', weight: '', medicalConditions: '', rareConditions: '', notes: '',
    occupation: '', annualIncome: '', smoker: false, coverAmount: '', term: '',
    motorPolicyType: 'comprehensive', vehicleType: '', vehicleNumber: '', make: '', model: '', year: '',
    engineNumber: '', chassisNumber: '', idv: '', previousInsurer: '',
    policyName: '', description: '', coverAmountMisc: '', employeeCount: '', specialNotes: '',
  });
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [nominees, setNominees] = useState<FamilyMember[]>([]);

  // Document uploads (keyed by document requirement key)
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, { name: string; url: string }>>({});
  const [otherDocs, setOtherDocs] = useState<{ name: string; url: string }[]>([]);

  // Live photo
  const [livePhoto, setLivePhoto] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const approvedCustomers = customers.filter(c => c.status === 'approved');
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const docRequirements = POLICY_DOCUMENT_REQUIREMENTS[policyType];

  // Search logic with fuzzy matching
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 1) return approvedCustomers;
    return approvedCustomers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
      c.email.toLowerCase().includes(q) ||
      c.customerId.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q)
    );
  }, [searchQuery, approvedCustomers]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleDocUpload = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedDocs(prev => ({ ...prev, [key]: { name: file.name, url: reader.result as string } }));
      toast.success(`${file.name} uploaded!`);
    };
    reader.readAsDataURL(file);
  };

  const handleOtherDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setOtherDocs(prev => [...prev, { name: file.name, url: reader.result as string }]);
      };
      reader.readAsDataURL(file);
    });
    if (e.target.files?.length) toast.success(`${e.target.files.length} document(s) uploaded!`);
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(mediaStream); setCameraOpen(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = mediaStream; }, 100);
    } catch { toast.error('Camera not accessible. Upload photo instead.'); }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    setLivePhoto(canvas.toDataURL('image/jpeg', 0.8));
    stopCamera();
    toast.success('Photo captured!');
  };

  const stopCamera = () => { stream?.getTracks().forEach(t => t.stop()); setStream(null); setCameraOpen(false); };

  const requiredDocsComplete = docRequirements.required.every(doc => uploadedDocs[doc.key]);

  const handleSubmitPolicy = () => {
    if (!selectedCustomerId || !selectedCustomer) return;
    if (!formData.insurer) { toast.error('Please enter insurance company'); setStep('policy'); return; }

    // Build documents array
    const docs: DocType[] = [];
    Object.entries(uploadedDocs).forEach(([key, val]) => {
      const req = [...docRequirements.required, ...docRequirements.optional].find(r => r.key === key);
      docs.push({
        id: `doc-${Date.now()}-${key}`,
        name: req?.label || val.name,
        type: req?.type || 'other',
        url: val.url,
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUser!.id,
      });
    });
    otherDocs.forEach((d, i) => {
      docs.push({ id: `doc-${Date.now()}-other-${i}`, name: d.name, type: 'other', url: d.url, uploadedAt: new Date().toISOString(), uploadedBy: currentUser!.id });
    });
    if (livePhoto) {
      docs.push({ id: `doc-${Date.now()}-live`, name: 'Live Photo', type: 'photo', url: livePhoto, uploadedAt: new Date().toISOString(), uploadedBy: currentUser!.id });
    }

    const policy: Policy = {
      id: `pol-${Date.now()}`, customerId: selectedCustomerId, type: policyType,
      policyNumber: formData.policyNumber || `POL-${Date.now()}`, insurer: formData.insurer,
      premium: parseFloat(formData.premium) || 0, sumAssured: parseFloat(formData.sumAssured) || 0,
      startDate: formData.startDate, endDate: formData.endDate, status: 'active',
      renewalDate: formData.endDate, documents: docs,
      createdAt: new Date().toISOString(), createdBy: currentUser!.id, agentId: currentUser!.id,
      ...(policyType === 'health' && {
        healthDetails: { height: formData.height, weight: formData.weight, medicalConditions: formData.medicalConditions, rareConditions: formData.rareConditions, familyMembers, notes: formData.notes }
      }),
      ...(policyType === 'life' && {
        lifeDetails: { occupation: formData.occupation, annualIncome: formData.annualIncome, smoker: formData.smoker, coverAmount: formData.coverAmount, term: formData.term, nominees, notes: formData.notes }
      }),
      ...(policyType === 'motor' && {
        motorDetails: { motorPolicyType: formData.motorPolicyType as any, vehicleType: formData.vehicleType, vehicleNumber: formData.vehicleNumber, make: formData.make, model: formData.model, year: formData.year, engineNumber: formData.engineNumber, chassisNumber: formData.chassisNumber, idv: formData.motorPolicyType === 'third_party' ? '' : formData.idv, previousInsurer: formData.previousInsurer, notes: formData.notes }
      }),
      ...(policyType === 'miscellaneous' && {
        miscDetails: { policyName: formData.policyName, description: formData.description, coverAmount: formData.coverAmountMisc, employeeCount: formData.employeeCount, specialNotes: formData.specialNotes, notes: formData.notes }
      }),
    };

    addPolicyToCustomer(selectedCustomerId, policy);

    const owners = users.filter(u => u.role === 'owner');
    owners.forEach(owner => {
      addNotification({
        id: `notif-${Date.now()}-${owner.id}`, userId: owner.id,
        title: '📋 New Policy Added to Existing Customer',
        message: `${currentUser?.name} added a ${policyType} policy for ${selectedCustomer.name}.`,
        type: 'approval_request', isRead: false,
        link: `/owner/customers/${selectedCustomerId}`, createdAt: new Date().toISOString(),
      });
    });

    toast.success(`Policy added successfully to ${selectedCustomer.name}! 🎉`);
    navigate(isEmployee ? '/employee/customers' : '/owner/customers');
  };

  const policyTypes = [
    { value: 'health' as PolicyType, label: 'Health', icon: Heart, color: 'blue', desc: 'Medical coverage' },
    { value: 'life' as PolicyType, label: 'Life', icon: Shield, color: 'green', desc: 'Term & whole life' },
    { value: 'motor' as PolicyType, label: 'Motor', icon: Car, color: 'amber', desc: 'Vehicle insurance' },
    { value: 'miscellaneous' as PolicyType, label: 'Misc', icon: Briefcase, color: 'purple', desc: 'Other policies' },
  ];

  const prefix = isEmployee ? '/employee' : '/owner';
  const inp = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

  const steps: { key: Step; label: string }[] = [
    { key: 'search', label: 'Search Customer' },
    { key: 'policy', label: 'Policy Details' },
    { key: 'documents', label: 'Documents' },
    { key: 'review', label: 'Review & Save' },
  ];
  const stepIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`${prefix}/customers`)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add Policy — Existing Customer</h1>
          <p className="text-slate-500 text-sm mt-0.5">Search an approved customer and add a new policy with required documents</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center flex-1">
            <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all ${step === s.key ? 'bg-blue-600 text-white' :
                stepIndex > i ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
              }`}>
              {stepIndex > i ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < steps.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300 mx-0.5 flex-shrink-0" />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">

        {/* ═══ STEP 1: SEARCH ═══ */}
        {step === 'search' && (
          <div className="p-6 space-y-5">
            <div>
              <h2 className="font-semibold text-slate-900 text-lg mb-1">Search Approved Customer</h2>
              <p className="text-sm text-slate-500">Find a customer by name, phone, email, ID or address</p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Type name, phone number, email, or customer ID..."
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                autoFocus
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="text-xs text-slate-400">{searchResults.length} customer{searchResults.length !== 1 ? 's' : ''} found</div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {searchResults.length === 0 && (
                <div className="text-center py-10 text-slate-400">
                  <User className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No approved customers match your search.</p>
                  <p className="text-xs mt-1">Try searching by phone number or customer ID.</p>
                </div>
              )}
              {searchResults.map(customer => {
                const agent = users.find(u => u.id === customer.agentId);
                const isSelected = selectedCustomerId === customer.id;
                return (
                  <button key={customer.id}
                    onClick={() => setSelectedCustomerId(customer.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${isSelected ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {customer.livePhoto ? (
                        <img src={customer.livePhoto} alt="" className={`w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 ${isSelected ? 'border-blue-400' : 'border-slate-200'}`} />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${isSelected ? 'bg-blue-500' : 'bg-gradient-to-br from-blue-400 to-purple-500'}`}>
                          {customer.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900">{customer.name}</span>
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <CheckCircle className="w-3 h-3" /> Approved
                          </span>
                          {isSelected && <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full ml-auto">✓ Selected</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.phone}</span>
                          {customer.email && <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3" /> {customer.email}</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          <span>ID: {customer.customerId}</span>
                          <span>Agent: {agent?.name}</span>
                        </div>
                        {customer.policies.length > 0 && (
                          <div className="flex gap-1 mt-1.5">
                            {customer.policies.map(p => (
                              <span key={p.id} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full capitalize">{p.type}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedCustomer && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-800 font-medium text-sm mb-1">
                  <CheckCircle className="w-4 h-4" /> Customer Selected
                </div>
                <p className="text-blue-700 text-sm">{selectedCustomer.name} — {selectedCustomer.customerId}</p>
                <p className="text-blue-600 text-xs mt-0.5">{selectedCustomer.phone} · {selectedCustomer.email}</p>
                {selectedCustomer.policies.length > 0 && (
                  <p className="text-blue-500 text-xs mt-1">Existing policies: {selectedCustomer.policies.map(p => p.type).join(', ')}</p>
                )}
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button onClick={() => navigate(`${prefix}/customers`)} className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">
                <ArrowLeft className="w-4 h-4" /> Cancel
              </button>
              <button onClick={() => { if (!selectedCustomerId) { toast.error('Please select a customer'); return; } setStep('policy'); }}
                disabled={!selectedCustomerId}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next: Policy Details <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 2: POLICY DETAILS ═══ */}
        {step === 'policy' && selectedCustomer && (
          <div className="p-6 space-y-5">
            {/* Selected customer bar */}
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                {selectedCustomer.name.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">{selectedCustomer.name}</div>
                <div className="text-xs text-slate-500">{selectedCustomer.customerId} · {selectedCustomer.phone}</div>
              </div>
              <button onClick={() => setStep('search')} className="ml-auto text-xs text-blue-600 hover:underline">Change</button>
            </div>

            <div>
              <h2 className="font-semibold text-slate-900 text-lg mb-1">Select Policy Type</h2>
              <p className="text-sm text-slate-500">Documents required will change based on policy type</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {policyTypes.map(pt => (
                <button key={pt.value} onClick={() => { setPolicyType(pt.value); setUploadedDocs({}); setOtherDocs([]); }}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all ${policyType === pt.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                >
                  <pt.icon className={`w-5 h-5 ${policyType === pt.value ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="text-xs font-medium text-slate-800">{pt.label}</span>
                  <span className="text-xs text-slate-400">{pt.desc}</span>
                </button>
              ))}
            </div>

            {/* Required docs info */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 flex items-start gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Required documents for {policyType} policy:</p>
                <p>{docRequirements.required.map(d => d.label).join(' • ')}</p>
              </div>
            </div>

            {/* Common policy fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
              <div className="sm:col-span-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">Policy Information</div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Insurance Company *</label>
                <input name="insurer" value={formData.insurer} onChange={handleChange} placeholder="e.g. Star Health, LIC" className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Policy Number</label>
                <input name="policyNumber" value={formData.policyNumber} onChange={handleChange} placeholder="Auto-generated if empty" className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Annual Premium (₹)</label>
                <input name="premium" type="number" value={formData.premium} onChange={handleChange} placeholder="15000" className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sum Assured (₹)</label>
                <input name="sumAssured" type="number" value={formData.sumAssured} onChange={handleChange} placeholder="500000" className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
                <input name="startDate" type="date" value={formData.startDate} onChange={handleChange} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">End / Renewal Date</label>
                <input name="endDate" type="date" value={formData.endDate} onChange={handleChange} className={inp} />
              </div>
            </div>

            {/* Health specific */}
            {policyType === 'health' && (
              <div className="space-y-3 border border-blue-100 rounded-xl p-4 bg-blue-50/30">
                <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Health Details</div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Height (cm)</label><input name="height" value={formData.height} onChange={handleChange} placeholder="170" className={inp} /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Weight (kg)</label><input name="weight" value={formData.weight} onChange={handleChange} placeholder="70" className={inp} /></div>
                </div>
                <div><label className="block text-xs font-medium text-slate-600 mb-1">Medical Conditions</label><textarea name="medicalConditions" value={formData.medicalConditions} onChange={handleChange} rows={2} placeholder="Diabetes, BP, etc." className={inp + " resize-none"} /></div>
                <div><label className="block text-xs font-medium text-slate-600 mb-1">Rare/Special Conditions</label><textarea name="rareConditions" value={formData.rareConditions} onChange={handleChange} rows={2} className={inp + " resize-none"} /></div>
                <div>
                  <div className="flex items-center justify-between mb-2"><label className="text-xs font-medium text-slate-600">Family Members</label><button onClick={() => setFamilyMembers(p => [...p, { id: Date.now().toString(), name: '', relationship: '', dob: '' }])} className="text-xs text-blue-600 flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button></div>
                  {familyMembers.map((m, i) => (<div key={m.id} className="grid grid-cols-3 gap-2 mb-2"><input placeholder="Name" value={m.name} onChange={e => setFamilyMembers(p => p.map((f, fi) => fi === i ? { ...f, name: e.target.value } : f))} className="px-2 py-1.5 border border-slate-200 rounded text-xs" /><input placeholder="Relation" value={m.relationship} onChange={e => setFamilyMembers(p => p.map((f, fi) => fi === i ? { ...f, relationship: e.target.value } : f))} className="px-2 py-1.5 border border-slate-200 rounded text-xs" /><div className="flex gap-1"><input type="date" value={m.dob} onChange={e => setFamilyMembers(p => p.map((f, fi) => fi === i ? { ...f, dob: e.target.value } : f))} className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-xs" /><button onClick={() => setFamilyMembers(p => p.filter((_, fi) => fi !== i))} className="text-red-400"><Trash2 className="w-3.5 h-3.5" /></button></div></div>))}
                </div>
              </div>
            )}

            {/* Life specific */}
            {policyType === 'life' && (
              <div className="space-y-3 border border-green-100 rounded-xl p-4 bg-green-50/30">
                <div className="text-xs font-semibold text-green-700 uppercase tracking-wide">Life Details</div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Occupation</label><input name="occupation" value={formData.occupation} onChange={handleChange} className={inp} /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Annual Income (₹)</label><input name="annualIncome" type="number" value={formData.annualIncome} onChange={handleChange} className={inp} /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Cover Amount (₹)</label><input name="coverAmount" type="number" value={formData.coverAmount} onChange={handleChange} className={inp} /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Term (years)</label><input name="term" type="number" value={formData.term} onChange={handleChange} className={inp} /></div>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" name="smoker" checked={formData.smoker} onChange={handleChange} className="w-4 h-4 accent-blue-600" /> Smoker
                </label>
                <div>
                  <div className="flex items-center justify-between mb-2"><label className="text-xs font-medium text-slate-600">Nominees</label><button onClick={() => setNominees(p => [...p, { id: Date.now().toString(), name: '', relationship: '', dob: '' }])} className="text-xs text-green-600 flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button></div>
                  {nominees.map((n, i) => (<div key={n.id} className="grid grid-cols-3 gap-2 mb-2"><input placeholder="Name" value={n.name} onChange={e => setNominees(p => p.map((nm, ni) => ni === i ? { ...nm, name: e.target.value } : nm))} className="px-2 py-1.5 border border-slate-200 rounded text-xs" /><input placeholder="Relation" value={n.relationship} onChange={e => setNominees(p => p.map((nm, ni) => ni === i ? { ...nm, relationship: e.target.value } : nm))} className="px-2 py-1.5 border border-slate-200 rounded text-xs" /><div className="flex gap-1"><input type="date" value={n.dob} onChange={e => setNominees(p => p.map((nm, ni) => ni === i ? { ...nm, dob: e.target.value } : nm))} className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-xs" /><button onClick={() => setNominees(p => p.filter((_, ni) => ni !== i))}><Trash2 className="w-3.5 h-3.5 text-red-400" /></button></div></div>))}
                </div>
              </div>
            )}

            {/* Motor specific */}
            {policyType === 'motor' && (
              <div className="space-y-3 border border-amber-100 rounded-xl p-4 bg-amber-50/30">
                <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Vehicle Details</div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Insurance Type</label><select name="motorPolicyType" value={formData.motorPolicyType} onChange={handleChange} className={inp}><option value="comprehensive">Comprehensive</option><option value="third_party">Third Party Only</option></select></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Vehicle Type</label><select name="vehicleType" value={formData.vehicleType} onChange={handleChange} className={inp}><option value="">Select</option><option>Car</option><option>Bike</option><option>Truck</option><option>Bus</option><option>Auto</option><option>Commercial Vehicle</option></select></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Vehicle Number *</label><input name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} placeholder="MH01AB1234" className={inp} /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Make</label><input name="make" value={formData.make} onChange={handleChange} placeholder="Maruti" className={inp} /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Model</label><input name="model" value={formData.model} onChange={handleChange} placeholder="Swift" className={inp} /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Year</label><input name="year" value={formData.year} onChange={handleChange} placeholder="2022" className={inp} /></div>
                  {formData.motorPolicyType !== 'third_party' && <div><label className="block text-xs font-medium text-slate-600 mb-1">IDV (₹)</label><input name="idv" type="number" value={formData.idv} onChange={handleChange} className={inp} /></div>}
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Engine Number</label><input name="engineNumber" value={formData.engineNumber} onChange={handleChange} className={inp} /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Chassis Number</label><input name="chassisNumber" value={formData.chassisNumber} onChange={handleChange} className={inp} /></div>
                </div>
              </div>
            )}

            {/* Misc specific */}
            {policyType === 'miscellaneous' && (
              <div className="space-y-3 border border-purple-100 rounded-xl p-4 bg-purple-50/30">
                <div className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Miscellaneous Details</div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Policy Name</label><input name="policyName" value={formData.policyName} onChange={handleChange} className={inp} /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Cover Amount (₹)</label><input name="coverAmountMisc" type="number" value={formData.coverAmountMisc} onChange={handleChange} className={inp} /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">No. of Employees</label><input name="employeeCount" type="number" value={formData.employeeCount} onChange={handleChange} className={inp} /></div>
                </div>
                <div><label className="block text-xs font-medium text-slate-600 mb-1">Description</label><textarea name="description" value={formData.description} onChange={handleChange} rows={2} className={inp + " resize-none"} /></div>
                <div><label className="block text-xs font-medium text-slate-600 mb-1">Special Notes</label><textarea name="specialNotes" value={formData.specialNotes} onChange={handleChange} rows={2} className={inp + " resize-none"} /></div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Additional Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} className={inp + " resize-none"} />
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button onClick={() => setStep('search')} className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={() => setStep('documents')} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                Next: Documents <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: DOCUMENTS (Policy-based) ═══ */}
        {step === 'documents' && selectedCustomer && (
          <div className="p-6 space-y-5">
            <div>
              <h2 className="font-semibold text-slate-900 text-lg mb-1">Upload Documents</h2>
              <p className="text-sm text-slate-500">Documents required for <span className="font-medium capitalize text-blue-600">{policyType}</span> policy</p>
            </div>

            {/* Required Documents */}
            <div>
              <div className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Required Documents
              </div>
              <div className="space-y-3">
                {docRequirements.required.map(doc => (
                  <div key={doc.key} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${uploadedDocs[doc.key] ? 'bg-green-50 border-green-200' : 'bg-red-50/50 border-red-200/60'
                    }`}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                        {uploadedDocs[doc.key] ? <Check className="w-4 h-4 text-green-600" /> : <FileText className="w-4 h-4 text-red-400" />}
                        {doc.label} <span className="text-red-500">*</span>
                      </div>
                      {uploadedDocs[doc.key] ? (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-green-600 truncate">{uploadedDocs[doc.key].name}</span>
                          <button onClick={() => setUploadedDocs(p => { const n = { ...p }; delete n[doc.key]; return n; })} className="text-red-400 hover:text-red-600 flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : <div className="text-xs text-red-400 mt-0.5">Not uploaded — required</div>}
                    </div>
                    <label className="flex-shrink-0 flex items-center gap-1.5 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg transition-colors">
                      <Upload className="w-3.5 h-3.5" /> {uploadedDocs[doc.key] ? 'Replace' : 'Upload'}
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => handleDocUpload(doc.key, e)} />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Optional Documents */}
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Optional Documents</div>
              <div className="space-y-2">
                {docRequirements.optional.map(doc => (
                  <div key={doc.key} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${uploadedDocs[doc.key] ? 'bg-green-50 border-green-200' : 'border-slate-200 bg-slate-50/50'
                    }`}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                        {uploadedDocs[doc.key] ? <Check className="w-4 h-4 text-green-600" /> : <FileText className="w-4 h-4 text-slate-400" />}
                        {doc.label}
                      </div>
                      {uploadedDocs[doc.key] && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-green-600 truncate">{uploadedDocs[doc.key].name}</span>
                          <button onClick={() => setUploadedDocs(p => { const n = { ...p }; delete n[doc.key]; return n; })} className="text-red-400"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                    </div>
                    <label className="flex-shrink-0 flex items-center gap-1 cursor-pointer bg-slate-600 hover:bg-slate-700 text-white text-xs px-3 py-2 rounded-lg">
                      <Upload className="w-3 h-3" /> Upload
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => handleDocUpload(doc.key, e)} />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Other docs */}
            <div className="border border-dashed border-slate-300 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-sm font-medium text-slate-700">Additional Documents</div>
                  <div className="text-xs text-slate-400">Any other relevant files</div>
                </div>
                <label className="flex items-center gap-1 cursor-pointer bg-slate-600 hover:bg-slate-700 text-white text-xs px-3 py-2 rounded-lg">
                  <Plus className="w-3 h-3" /> Add Files
                  <input type="file" multiple accept="image/*,.pdf" className="hidden" onChange={handleOtherDocUpload} />
                </label>
              </div>
              {otherDocs.length > 0 && (
                <div className="space-y-1 mt-2">
                  {otherDocs.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs bg-white border border-slate-100 rounded-lg p-2">
                      <Check className="w-3 h-3 text-green-500" />
                      <span className="truncate text-slate-600">{d.name}</span>
                      <button onClick={() => setOtherDocs(p => p.filter((_, di) => di !== i))} className="ml-auto text-red-400"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live Photo (for health & life) */}
            {(policyType === 'health' || policyType === 'life') && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <div className="text-sm font-semibold text-slate-800">Live Photo</div>
                  <div className="text-xs text-slate-500">Capture or upload customer photo</div>
                </div>
                <div className="p-4">
                  {livePhoto ? (
                    <div className="flex items-center gap-4">
                      <img src={livePhoto} alt="" className="w-20 h-20 object-cover rounded-xl border-2 border-green-400" />
                      <div>
                        <div className="flex items-center gap-1.5 text-green-700 font-medium text-sm"><Check className="w-4 h-4" /> Photo captured!</div>
                        <button onClick={() => setLivePhoto('')} className="text-xs text-red-500 hover:underline mt-1">Retake</button>
                      </div>
                    </div>
                  ) : cameraOpen ? (
                    <div className="space-y-2">
                      <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl border border-slate-200 bg-black" style={{ maxHeight: 200 }} />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="flex gap-2">
                        <button onClick={capturePhoto} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"><Camera className="w-4 h-4" /> Capture</button>
                        <button onClick={stopCamera} className="py-2 px-4 bg-slate-100 rounded-lg text-sm text-slate-600">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={startCamera} className="flex flex-col items-center gap-2 p-3 border-2 border-dashed border-blue-200 rounded-xl text-blue-600 hover:bg-blue-50">
                        <Camera className="w-5 h-5" /><span className="text-xs font-medium">Camera</span>
                      </button>
                      <label className="flex flex-col items-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 cursor-pointer">
                        <Upload className="w-5 h-5" /><span className="text-xs font-medium">Upload</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setLivePhoto(r.result as string); r.readAsDataURL(f); } }} />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Completion status */}
            <div className={`rounded-xl p-3 text-xs flex items-center gap-2 ${requiredDocsComplete ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              {requiredDocsComplete ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {requiredDocsComplete
                ? `All ${docRequirements.required.length} required documents uploaded!`
                : `${docRequirements.required.filter(d => uploadedDocs[d.key]).length} of ${docRequirements.required.length} required documents uploaded`
              }
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button onClick={() => setStep('policy')} className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={() => {
                if (!requiredDocsComplete) { toast.error('Please upload all required documents'); return; }
                setStep('review');
              }}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Review <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 4: REVIEW ═══ */}
        {step === 'review' && selectedCustomer && (
          <div className="p-6 space-y-5">
            <h2 className="font-semibold text-slate-900 text-lg">Review & Confirm</h2>

            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Customer</div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">{selectedCustomer.name.charAt(0)}</div>
                <div>
                  <div className="font-semibold text-slate-900">{selectedCustomer.name}</div>
                  <div className="text-xs text-slate-500">{selectedCustomer.customerId} · {selectedCustomer.phone}</div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3">Policy Details</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-slate-500">Type:</span> <span className="font-medium capitalize text-slate-900">{policyType}</span></div>
                <div><span className="text-slate-500">Insurer:</span> <span className="font-medium text-slate-900">{formData.insurer || 'N/A'}</span></div>
                <div><span className="text-slate-500">Premium:</span> <span className="font-medium text-slate-900">₹{formData.premium ? parseInt(formData.premium).toLocaleString('en-IN') : 'N/A'}</span></div>
                <div><span className="text-slate-500">Sum Assured:</span> <span className="font-medium text-slate-900">₹{formData.sumAssured ? parseInt(formData.sumAssured).toLocaleString('en-IN') : 'N/A'}</span></div>
                <div><span className="text-slate-500">Start:</span> <span className="font-medium text-slate-900">{formData.startDate || 'N/A'}</span></div>
                <div><span className="text-slate-500">End:</span> <span className="font-medium text-slate-900">{formData.endDate || 'N/A'}</span></div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <div className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Documents</div>
              <div className="space-y-1">
                {docRequirements.required.map(doc => (
                  <div key={doc.key} className="flex items-center gap-2 text-xs">
                    {uploadedDocs[doc.key] ? <Check className="w-3.5 h-3.5 text-green-600" /> : <X className="w-3.5 h-3.5 text-red-500" />}
                    <span className={uploadedDocs[doc.key] ? 'text-green-700' : 'text-red-600'}>{doc.label}</span>
                    <span className="text-red-500">*</span>
                  </div>
                ))}
                {docRequirements.optional.map(doc => uploadedDocs[doc.key] && (
                  <div key={doc.key} className="flex items-center gap-2 text-xs text-green-700">
                    <Check className="w-3.5 h-3.5" /> {doc.label}
                  </div>
                ))}
                {otherDocs.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-green-700">
                    <Check className="w-3.5 h-3.5" /> {d.name}
                  </div>
                ))}
                {livePhoto && (
                  <div className="flex items-center gap-2 text-xs text-green-700"><Check className="w-3.5 h-3.5" /> Live Photo</div>
                )}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
              ℹ️ This policy will be added to {selectedCustomer.name}'s profile and the owner will be notified.
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button onClick={() => setStep('documents')} className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={handleSubmitPolicy} className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                <Check className="w-4 h-4" /> Save Policy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
