import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import {
  ArrowLeft, Check, FileText, Camera, Upload,
  Plus, Trash2, Heart, Shield, Car, Briefcase, X, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Customer, Policy, PolicyType, FamilyMember, Document } from '../../types';

interface Props { isEmployee?: boolean; }

type Step = 'basic' | 'policy' | 'kyc' | 'review';
const STEPS: Step[] = ['basic', 'policy', 'kyc', 'review'];

const policyTypes = [
  { value: 'health' as PolicyType, label: 'Health', icon: Heart, color: 'blue', desc: 'Medical & hospitalization cover' },
  { value: 'life' as PolicyType, label: 'Life', icon: Shield, color: 'green', desc: 'Term & whole life plans' },
  { value: 'motor' as PolicyType, label: 'Motor', icon: Car, color: 'amber', desc: 'Vehicle insurance' },
  { value: 'miscellaneous' as PolicyType, label: 'Misc', icon: Briefcase, color: 'purple', desc: 'Other insurance types' },
];

export default function NewCustomerForm({ isEmployee }: Props) {
  const { addCustomer, currentUser, users } = useAppStore();
  const navigate = useNavigate();
  const prefix = isEmployee ? '/employee' : '/owner';

  const [step, setStep] = useState<Step>('basic');
  const [customerType, setCustomerType] = useState<'new' | 'existing'>('new');

  // Step 1: Basic Info
  const [basicInfo, setBasicInfo] = useState({
    name: '', phone: '', email: '', address: '', dob: '',
  });

  // Step 2: Policy
  const [selectedPolicyType, setSelectedPolicyType] = useState<PolicyType>('health');
  const [addPolicy, setAddPolicy] = useState(true);
  const [policyData, setPolicyData] = useState({
    policyNumber: '', insurer: '', premium: '', sumAssured: '',
    startDate: '', endDate: '',
    // Health
    height: '', weight: '', medicalConditions: '', rareConditions: '', healthNotes: '',
    // Life
    occupation: '', annualIncome: '', coverAmount: '', term: '', smoker: false, lifeNotes: '',
    // Motor
    motorPolicyType: 'comprehensive', vehicleType: '', vehicleNumber: '', make: '', model: '', year: '',
    engineNumber: '', chassisNumber: '', idv: '', previousInsurer: '', motorNotes: '',
    // Misc
    policyName: '', description: '', miscCoverAmount: '', employeeCount: '', specialNotes: '', miscNotes: '',
  });
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [nominees, setNominees] = useState<FamilyMember[]>([]);

  // Step 3: KYC docs + live photo
  const [aadhaarFront, setAadhaarFront] = useState<{ name: string; url: string } | null>(null);
  const [aadhaarBack, setAadhaarBack] = useState<{ name: string; url: string } | null>(null);
  const [panCard, setPanCard] = useState<{ name: string; url: string } | null>(null);
  const [rcBook, setRcBook] = useState<{ name: string; url: string } | null>(null);
  const [otherDocs, setOtherDocs] = useState<{ name: string; url: string }[]>([]);
  const [livePhoto, setLivePhoto] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stepIndex = STEPS.indexOf(step);

  const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setBasicInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePolicyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setPolicyData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const readFile = (file: File): Promise<string> =>
    new Promise((res) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result as string);
      reader.readAsDataURL(file);
    });

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: { name: string; url: string }) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await readFile(file);
    setter({ name: file.name, url });
    toast.success(`${file.name} uploaded!`);
  };

  const handleMultipleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const url = await readFile(file);
      setOtherDocs(prev => [...prev, { name: file.name, url }]);
    }
    if (files.length) toast.success(`${files.length} document(s) uploaded!`);
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      setStream(mediaStream);
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      }, 100);
    } catch {
      toast.error('Camera not accessible. Please upload a photo instead.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    setLivePhoto(canvas.toDataURL('image/jpeg', 0.8));
    stopCamera();
    toast.success('Live photo captured!');
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setCameraOpen(false);
  };

  const validateStep = (): boolean => {
    if (step === 'basic') {
      if (!basicInfo.name.trim()) { toast.error('Customer name is required'); return false; }
      if (!basicInfo.phone.trim()) { toast.error('Phone number is required'); return false; }
      return true;
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  };

  const prevStep = () => {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev);
  };

  const handleSubmit = () => {
    if (!basicInfo.name || !basicInfo.phone) {
      toast.error('Name and phone are required');
      setStep('basic');
      return;
    }

    const docs: Document[] = [];
    if (aadhaarFront) docs.push({ id: `doc-${Date.now()}-1`, name: 'Aadhaar Front', type: 'aadhaar', url: aadhaarFront.url, uploadedAt: new Date().toISOString(), uploadedBy: currentUser!.id });
    if (aadhaarBack) docs.push({ id: `doc-${Date.now()}-2`, name: 'Aadhaar Back', type: 'aadhaar', url: aadhaarBack.url, uploadedAt: new Date().toISOString(), uploadedBy: currentUser!.id });
    if (panCard) docs.push({ id: `doc-${Date.now()}-3`, name: 'PAN Card', type: 'pan', url: panCard.url, uploadedAt: new Date().toISOString(), uploadedBy: currentUser!.id });
    if (rcBook) docs.push({ id: `doc-${Date.now()}-4`, name: 'RC Book', type: 'rc_book', url: rcBook.url, uploadedAt: new Date().toISOString(), uploadedBy: currentUser!.id });
    if (livePhoto) docs.push({ id: `doc-${Date.now()}-5`, name: 'Live Photo', type: 'photo', url: livePhoto, uploadedAt: new Date().toISOString(), uploadedBy: currentUser!.id });
    otherDocs.forEach((d, i) => docs.push({ id: `doc-${Date.now()}-${i + 10}`, name: d.name, type: 'other', url: d.url, uploadedAt: new Date().toISOString(), uploadedBy: currentUser!.id }));

    const policies: Policy[] = [];
    if (addPolicy) {
      const policy: Policy = {
        id: `pol-${Date.now()}`,
        customerId: '',
        type: selectedPolicyType,
        policyNumber: policyData.policyNumber || `POL-${Date.now()}`,
        insurer: policyData.insurer,
        premium: parseFloat(policyData.premium) || 0,
        sumAssured: parseFloat(policyData.sumAssured) || 0,
        startDate: policyData.startDate,
        endDate: policyData.endDate,
        status: 'pending',
        renewalDate: policyData.endDate,
        documents: [],
        createdAt: new Date().toISOString(),
        createdBy: currentUser!.id,
        agentId: currentUser!.id,
        ...(selectedPolicyType === 'health' && {
          healthDetails: {
            height: policyData.height, weight: policyData.weight,
            medicalConditions: policyData.medicalConditions,
            rareConditions: policyData.rareConditions,
            familyMembers, notes: policyData.healthNotes,
          }
        }),
        ...(selectedPolicyType === 'life' && {
          lifeDetails: {
            occupation: policyData.occupation, annualIncome: policyData.annualIncome,
            smoker: policyData.smoker, coverAmount: policyData.coverAmount,
            term: policyData.term, nominees, notes: policyData.lifeNotes,
          }
        }),
        ...(selectedPolicyType === 'motor' && {
          motorDetails: {
            motorPolicyType: policyData.motorPolicyType as any,
            vehicleType: policyData.vehicleType, vehicleNumber: policyData.vehicleNumber,
            make: policyData.make, model: policyData.model, year: policyData.year,
            engineNumber: policyData.engineNumber, chassisNumber: policyData.chassisNumber,
            idv: policyData.motorPolicyType === 'third_party' ? '' : policyData.idv, previousInsurer: policyData.previousInsurer, notes: policyData.motorNotes,
          }
        }),
        ...(selectedPolicyType === 'miscellaneous' && {
          miscDetails: {
            policyName: policyData.policyName, description: policyData.description,
            coverAmount: policyData.miscCoverAmount, employeeCount: policyData.employeeCount,
            specialNotes: policyData.specialNotes, notes: policyData.miscNotes,
          }
        }),
      };
      policies.push(policy);
    }

    const customer: Customer = {
      id: `cust-${Date.now()}`,
      customerId: `CUS-${100006 + Math.floor(Math.random() * 1000)}`,
      isExisting: customerType === 'existing',
      name: basicInfo.name.trim(),
      phone: basicInfo.phone.trim(),
      email: basicInfo.email.trim(),
      address: basicInfo.address.trim(),
      dob: basicInfo.dob,
      status: 'pending',
      agentId: currentUser!.id,
      documents: docs,
      livePhoto: livePhoto || undefined,
      policies,
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notificationSent: true,
    };

    addCustomer(customer);
    toast.success(`${customer.name} submitted for approval! 🎉`);
    navigate(`${prefix}/customers`);
  };

  const stepLabels = ['Basic Info', 'Policy', 'KYC Docs', 'Review'];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`${prefix}/customers`)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Customer Registration</h1>
          <p className="text-slate-500 text-sm mt-0.5">Fill in all details and submit for approval</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center justify-between">
          {stepLabels.map((label, i) => {
            const s = STEPS[i];
            const isActive = step === s;
            const isDone = stepIndex > i;
            return (
              <div key={s} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${isDone ? 'bg-green-500 text-white' :
                      isActive ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                        'bg-slate-100 text-slate-400'
                    }`}>
                    {isDone ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-xs mt-1 font-medium hidden sm:block ${isActive ? 'text-blue-600' : isDone ? 'text-green-600' : 'text-slate-400'
                    }`}>{label}</span>
                </div>
                {i < 3 && (
                  <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${isDone ? 'bg-green-400' : 'bg-slate-100'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">

        {/* ═══════════════════════════════════
            STEP 1: BASIC INFO
        ═══════════════════════════════════ */}
        {step === 'basic' && (
          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Customer Information</h2>
              <p className="text-sm text-slate-500 mt-0.5">Basic personal details</p>
            </div>



            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Full Name *</label>
                <input
                  name="name" value={basicInfo.name} onChange={handleBasicChange}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Phone Number *</label>
                <input
                  name="phone" value={basicInfo.phone} onChange={handleBasicChange}
                  placeholder="+91 9876543210"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email Address</label>
                <input
                  name="email" type="email" value={basicInfo.email} onChange={handleBasicChange}
                  placeholder="customer@email.com"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date of Birth</label>
                <input
                  name="dob" type="date" value={basicInfo.dob} onChange={handleBasicChange}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Address</label>
                <textarea
                  name="address" value={basicInfo.address} onChange={handleBasicChange}
                  placeholder="Full address with city, state, pincode"
                  rows={2}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════
            STEP 2: POLICY DETAILS
        ═══════════════════════════════════ */}
        {step === 'policy' && (
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Policy Details</h2>
                <p className="text-sm text-slate-500">Select and configure insurance policy</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox" checked={addPolicy}
                  onChange={e => setAddPolicy(e.target.checked)}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-sm text-slate-700">Add policy now</span>
              </label>
            </div>

            {!addPolicy ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-slate-500">
                <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No policy will be added now. You can add policies later.</p>
              </div>
            ) : (
              <>
                {/* Policy type selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Policy Type *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {policyTypes.map(pt => (
                      <button
                        key={pt.value}
                        onClick={() => setSelectedPolicyType(pt.value)}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${selectedPolicyType === pt.value
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                      >
                        <pt.icon className={`w-6 h-6 ${selectedPolicyType === pt.value ? 'text-blue-600' : 'text-slate-400'}`} />
                        <div>
                          <div className={`text-sm font-bold ${selectedPolicyType === pt.value ? 'text-blue-700' : 'text-slate-800'}`}>{pt.label}</div>
                          <div className="text-xs text-slate-400 hidden sm:block">{pt.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Common fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4">
                  <div className="sm:col-span-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">Policy Information</div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Insurance Company *</label>
                    <input name="insurer" value={policyData.insurer} onChange={handlePolicyChange} placeholder="e.g. Star Health, LIC, HDFC ERGO" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Policy Number</label>
                    <input name="policyNumber" value={policyData.policyNumber} onChange={handlePolicyChange} placeholder="Auto-generated if empty" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Annual Premium (₹)</label>
                    <input name="premium" type="number" value={policyData.premium} onChange={handlePolicyChange} placeholder="15000" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Sum Assured (₹)</label>
                    <input name="sumAssured" type="number" value={policyData.sumAssured} onChange={handlePolicyChange} placeholder="500000" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
                    <input name="startDate" type="date" value={policyData.startDate} onChange={handlePolicyChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">End / Renewal Date</label>
                    <input name="endDate" type="date" value={policyData.endDate} onChange={handlePolicyChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                  </div>
                </div>

                {/* Health details */}
                {selectedPolicyType === 'health' && (
                  <div className="space-y-4 border border-blue-100 rounded-xl p-4 bg-blue-50/30">
                    <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Health Policy Details</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Height (cm)</label>
                        <input name="height" value={policyData.height} onChange={handlePolicyChange} placeholder="170" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Weight (kg)</label>
                        <input name="weight" value={policyData.weight} onChange={handlePolicyChange} placeholder="70" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Medical Conditions</label>
                      <textarea name="medicalConditions" value={policyData.medicalConditions} onChange={handlePolicyChange} rows={2} placeholder="Diabetes, hypertension, etc. (none if healthy)" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Rare/Special Conditions</label>
                      <textarea name="rareConditions" value={policyData.rareConditions} onChange={handlePolicyChange} rows={2} placeholder="Any rare conditions to note" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-slate-600">Family Members to Cover</label>
                        <button
                          onClick={() => setFamilyMembers(prev => [...prev, { id: Date.now().toString(), name: '', relationship: '', dob: '' }])}
                          className="text-xs text-blue-600 flex items-center gap-1 hover:underline"
                        >
                          <Plus className="w-3 h-3" /> Add Member
                        </button>
                      </div>
                      {familyMembers.map((m, i) => (
                        <div key={m.id} className="grid grid-cols-3 gap-2 mb-2">
                          <input placeholder="Name" value={m.name} onChange={e => setFamilyMembers(prev => prev.map((fm, fi) => fi === i ? { ...fm, name: e.target.value } : fm))} className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                          <input placeholder="Relation" value={m.relationship} onChange={e => setFamilyMembers(prev => prev.map((fm, fi) => fi === i ? { ...fm, relationship: e.target.value } : fm))} className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                          <div className="flex gap-1">
                            <input type="date" value={m.dob} onChange={e => setFamilyMembers(prev => prev.map((fm, fi) => fi === i ? { ...fm, dob: e.target.value } : fm))} className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none" />
                            <button onClick={() => setFamilyMembers(prev => prev.filter((_, fi) => fi !== i))} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Additional Notes</label>
                      <textarea name="healthNotes" value={policyData.healthNotes} onChange={handlePolicyChange} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none" />
                    </div>
                  </div>
                )}

                {/* Life details */}
                {selectedPolicyType === 'life' && (
                  <div className="space-y-4 border border-green-100 rounded-xl p-4 bg-green-50/30">
                    <div className="text-xs font-semibold text-green-700 uppercase tracking-wide">Life Policy Details</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Occupation</label>
                        <input name="occupation" value={policyData.occupation} onChange={handlePolicyChange} placeholder="e.g. Software Engineer" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Annual Income (₹)</label>
                        <input name="annualIncome" type="number" value={policyData.annualIncome} onChange={handlePolicyChange} placeholder="600000" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Cover Amount (₹)</label>
                        <input name="coverAmount" type="number" value={policyData.coverAmount} onChange={handlePolicyChange} placeholder="1000000" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Policy Term (years)</label>
                        <input name="term" type="number" value={policyData.term} onChange={handlePolicyChange} placeholder="20" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input type="checkbox" name="smoker" checked={policyData.smoker} onChange={handlePolicyChange} className="w-4 h-4 accent-blue-600" />
                      <span>Smoker</span>
                    </label>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-slate-600">Nominees</label>
                        <button onClick={() => setNominees(prev => [...prev, { id: Date.now().toString(), name: '', relationship: '', dob: '' }])} className="text-xs text-green-600 flex items-center gap-1 hover:underline"><Plus className="w-3 h-3" /> Add Nominee</button>
                      </div>
                      {nominees.map((n, i) => (
                        <div key={n.id} className="grid grid-cols-3 gap-2 mb-2">
                          <input placeholder="Name" value={n.name} onChange={e => setNominees(prev => prev.map((nm, ni) => ni === i ? { ...nm, name: e.target.value } : nm))} className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none" />
                          <input placeholder="Relation" value={n.relationship} onChange={e => setNominees(prev => prev.map((nm, ni) => ni === i ? { ...nm, relationship: e.target.value } : nm))} className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none" />
                          <div className="flex gap-1">
                            <input type="date" value={n.dob} onChange={e => setNominees(prev => prev.map((nm, ni) => ni === i ? { ...nm, dob: e.target.value } : nm))} className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none" />
                            <button onClick={() => setNominees(prev => prev.filter((_, ni) => ni !== i))}><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Additional Notes</label>
                      <textarea name="lifeNotes" value={policyData.lifeNotes} onChange={handlePolicyChange} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none" />
                    </div>
                  </div>
                )}

                {/* Motor details */}
                {selectedPolicyType === 'motor' && (
                  <div className="space-y-4 border border-amber-100 rounded-xl p-4 bg-amber-50/30">
                    <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Vehicle Details</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-medium text-slate-600 mb-1">Insurance Type</label>
                        <select name="motorPolicyType" value={policyData.motorPolicyType} onChange={handlePolicyChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                          <option value="comprehensive">Comprehensive</option>
                          <option value="third_party">Third Party Only</option>
                        </select>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-medium text-slate-600 mb-1">Vehicle Type</label>
                        <select name="vehicleType" value={policyData.vehicleType} onChange={handlePolicyChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                          <option value="">Select type</option>
                          <option>Car</option><option>Bike</option><option>Truck</option><option>Bus</option><option>Auto Rickshaw</option><option>Commercial Vehicle</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Vehicle Number *</label>
                        <input name="vehicleNumber" value={policyData.vehicleNumber} onChange={handlePolicyChange} placeholder="MH01AB1234" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Make (Brand)</label>
                        <input name="make" value={policyData.make} onChange={handlePolicyChange} placeholder="Maruti, Hyundai, Honda" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Model</label>
                        <input name="model" value={policyData.model} onChange={handlePolicyChange} placeholder="Swift, i20, City" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Year of Manufacture</label>
                        <input name="year" value={policyData.year} onChange={handlePolicyChange} placeholder="2022" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                      </div>
                      {policyData.motorPolicyType !== 'third_party' && (
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">IDV (₹)</label>
                          <input name="idv" type="number" value={policyData.idv} onChange={handlePolicyChange} placeholder="550000" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Engine Number</label>
                        <input name="engineNumber" value={policyData.engineNumber} onChange={handlePolicyChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Chassis Number</label>
                        <input name="chassisNumber" value={policyData.chassisNumber} onChange={handlePolicyChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-slate-600 mb-1">Previous Insurer</label>
                        <input name="previousInsurer" value={policyData.previousInsurer} onChange={handlePolicyChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                      <textarea name="motorNotes" value={policyData.motorNotes} onChange={handlePolicyChange} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none" />
                    </div>
                  </div>
                )}

                {/* Miscellaneous details */}
                {selectedPolicyType === 'miscellaneous' && (
                  <div className="space-y-4 border border-purple-100 rounded-xl p-4 bg-purple-50/30">
                    <div className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Policy Details</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Policy Name</label>
                        <input name="policyName" value={policyData.policyName} onChange={handlePolicyChange} placeholder="e.g. Group Mediclaim" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Cover Amount (₹)</label>
                        <input name="miscCoverAmount" type="number" value={policyData.miscCoverAmount} onChange={handlePolicyChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-slate-600 mb-1">Number of Employees Covered</label>
                        <input name="employeeCount" type="number" value={policyData.employeeCount} onChange={handlePolicyChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                      <textarea name="description" value={policyData.description} onChange={handlePolicyChange} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Special Notes</label>
                      <textarea name="specialNotes" value={policyData.specialNotes} onChange={handlePolicyChange} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none" />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════
            STEP 3: KYC & DOCUMENTS (Policy-based)
        ═══════════════════════════════════ */}
        {step === 'kyc' && (
          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">KYC Documents & Photo</h2>
              <p className="text-sm text-slate-500">
                Documents required for <span className="font-medium capitalize text-blue-600">{addPolicy ? selectedPolicyType : 'general'}</span> registration
              </p>
            </div>

            {/* Policy-based document info */}
            {addPolicy && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 flex items-start gap-2">
                <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Required documents for {selectedPolicyType} policy:</p>
                  <p>
                    {selectedPolicyType === 'motor'
                      ? 'Aadhaar Card (Front) • PAN Card • RC Book (Registration Certificate)'
                      : selectedPolicyType === 'health'
                        ? 'Aadhaar Card (Front & Back) • PAN Card • Passport Photo'
                        : selectedPolicyType === 'life'
                          ? 'Aadhaar Card (Front & Back) • PAN Card • Passport Photo'
                          : 'Aadhaar Card / Company ID • PAN Card / GST Certificate'}
                  </p>
                </div>
              </div>
            )}

            {/* Document uploads - show based on policy type */}
            <div className="space-y-3">
              {/* Required docs based on policy */}
              {[
                { label: 'Aadhaar Card (Front)', state: aadhaarFront, setter: setAadhaarFront, key: 'aadhaar-front', required: true },
                { label: 'Aadhaar Card (Back)', state: aadhaarBack, setter: setAadhaarBack, key: 'aadhaar-back', required: selectedPolicyType !== 'motor' && selectedPolicyType !== 'miscellaneous' },
                { label: 'PAN Card', state: panCard, setter: setPanCard, key: 'pan', required: true },
                { label: 'RC Book (Registration Certificate)', state: rcBook, setter: setRcBook, key: 'rc', required: selectedPolicyType === 'motor' },
              ]
                .filter(doc => doc.required || doc.state) // show non-required only if already uploaded
                .map(({ label, state, setter, key, required }) => (
                  <div key={key} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${state ? 'bg-green-50 border-green-200' : required ? 'bg-red-50/50 border-red-200/60' : 'border-slate-200 bg-slate-50/50'
                    }`}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-700 flex items-center gap-1">
                        {state ? <Check className="w-4 h-4 text-green-600" /> : <FileText className="w-4 h-4 text-slate-400" />}
                        {label}
                        {required && <span className="text-red-500 text-xs">*</span>}
                      </div>
                      {state ? (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-green-600 truncate">{state.name}</span>
                          <button onClick={() => setter(null)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className={`text-xs mt-0.5 ${required ? 'text-red-400' : 'text-slate-400'}`}>
                          {required ? 'Required — not uploaded' : 'Not uploaded'}
                        </div>
                      )}
                    </div>
                    <label className="flex-shrink-0 flex items-center gap-1.5 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg transition-colors">
                      <Upload className="w-3.5 h-3.5" /> Upload
                      <input
                        type="file" accept="image/*,.pdf" className="hidden"
                        onChange={e => handleFileUpload(e, setter)}
                      />
                    </label>
                  </div>
                ))}

              {/* Show RC Book upload option for non-motor if they want */}
              {selectedPolicyType !== 'motor' && !rcBook && (
                <div className="flex items-center gap-3 p-3 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-500">RC Book (Optional for {selectedPolicyType})</div>
                    <div className="text-xs text-slate-400">Only required for motor insurance</div>
                  </div>
                  <label className="flex-shrink-0 flex items-center gap-1.5 cursor-pointer bg-slate-500 hover:bg-slate-600 text-white text-xs px-3 py-2 rounded-lg">
                    <Upload className="w-3.5 h-3.5" /> Upload
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => handleFileUpload(e, setRcBook)} />
                  </label>
                </div>
              )}

              {/* Other documents */}
              <div className="border border-dashed border-slate-300 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm font-medium text-slate-700">Other Documents</div>
                    <div className="text-xs text-slate-400">Income proof, medical reports, etc.</div>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer bg-slate-600 hover:bg-slate-700 text-white text-xs px-3 py-2 rounded-lg">
                    <Plus className="w-3.5 h-3.5" /> Add Files
                    <input type="file" multiple accept="image/*,.pdf" className="hidden" onChange={handleMultipleFiles} />
                  </label>
                </div>
                {otherDocs.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {otherDocs.map((doc, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs bg-white border border-slate-100 rounded-lg p-2">
                        <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                        <span className="truncate text-slate-600">{doc.name}</span>
                        <button onClick={() => setOtherDocs(prev => prev.filter((_, di) => di !== i))} className="ml-auto text-red-400">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Live Photo */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                <div className="text-sm font-semibold text-slate-800">Live Photo *</div>
                <div className="text-xs text-slate-500">Take a photo with camera or upload from gallery</div>
              </div>
              <div className="p-4">
                {livePhoto ? (
                  <div className="flex items-center gap-4">
                    <img src={livePhoto} alt="Live photo" className="w-24 h-24 object-cover rounded-xl border-2 border-green-400 shadow-sm" />
                    <div>
                      <div className="flex items-center gap-1.5 text-green-700 font-medium text-sm mb-1">
                        <Check className="w-4 h-4" /> Photo captured!
                      </div>
                      <button onClick={() => setLivePhoto('')} className="text-xs text-red-500 hover:underline">Retake photo</button>
                    </div>
                  </div>
                ) : cameraOpen ? (
                  <div className="space-y-3">
                    <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl border border-slate-200 bg-black" style={{ maxHeight: 240 }} />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="flex gap-3">
                      <button onClick={capturePhoto} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700">
                        <Camera className="w-4 h-4" /> Capture Photo
                      </button>
                      <button onClick={stopCamera} className="py-2.5 px-4 bg-slate-100 text-slate-600 rounded-xl text-sm hover:bg-slate-200">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={startCamera}
                      className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-blue-200 rounded-xl text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all"
                    >
                      <Camera className="w-6 h-6" />
                      <span className="text-sm font-medium">Open Camera</span>
                      <span className="text-xs text-slate-400">Works on all devices</span>
                    </button>
                    <label className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 hover:border-slate-400 cursor-pointer transition-all">
                      <Upload className="w-6 h-6" />
                      <span className="text-sm font-medium">Upload Photo</span>
                      <span className="text-xs text-slate-400">From gallery</span>
                      <input
                        type="file" accept="image/*" capture="user" className="hidden"
                        onChange={async e => {
                          const file = e.target.files?.[0];
                          if (file) { const url = await readFile(file); setLivePhoto(url); toast.success('Photo uploaded!'); }
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════
            STEP 4: REVIEW & SUBMIT
        ═══════════════════════════════════ */}
        {step === 'review' && (
          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Review & Submit</h2>
              <p className="text-sm text-slate-500">Review all details before submission</p>
            </div>

            {/* Customer info */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                  {basicInfo.name.charAt(0) || '?'}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{basicInfo.name || '—'}</div>
                  <div className="text-xs text-slate-500">{customerType === 'existing' ? 'Existing Customer' : 'New Customer'}</div>
                </div>
                {livePhoto && (
                  <img src={livePhoto} alt="Photo" className="ml-auto w-12 h-12 rounded-xl object-cover border-2 border-green-300" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-slate-500">Phone:</span> <span className="font-medium">{basicInfo.phone || '—'}</span></div>
                <div><span className="text-slate-500">Email:</span> <span className="font-medium truncate">{basicInfo.email || '—'}</span></div>
                <div><span className="text-slate-500">DOB:</span> <span className="font-medium">{basicInfo.dob || '—'}</span></div>
                <div><span className="text-slate-500">Address:</span> <span className="font-medium">{basicInfo.address ? basicInfo.address.substring(0, 30) + '...' : '—'}</span></div>
              </div>
            </div>

            {/* Policy summary */}
            {addPolicy && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-800 mb-2">
                  {policyTypes.find(p => p.value === selectedPolicyType)?.label} Policy
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-slate-500">Insurer:</span> <span className="font-medium">{policyData.insurer || '—'}</span></div>
                  <div><span className="text-slate-500">Premium:</span> <span className="font-medium">₹{policyData.premium ? parseInt(policyData.premium).toLocaleString('en-IN') : '—'}</span></div>
                  <div><span className="text-slate-500">Sum Assured:</span> <span className="font-medium">₹{policyData.sumAssured ? parseInt(policyData.sumAssured).toLocaleString('en-IN') : '—'}</span></div>
                  <div><span className="text-slate-500">Start Date:</span> <span className="font-medium">{policyData.startDate || '—'}</span></div>
                </div>
              </div>
            )}

            {/* Documents summary - policy-based */}
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <div className="text-sm font-semibold text-green-800 mb-2">Documents ({addPolicy ? selectedPolicyType : 'general'})</div>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {[
                  { label: 'Aadhaar Front', uploaded: !!aadhaarFront, required: true },
                  { label: 'Aadhaar Back', uploaded: !!aadhaarBack, required: selectedPolicyType !== 'motor' && selectedPolicyType !== 'miscellaneous' },
                  { label: 'PAN Card', uploaded: !!panCard, required: true },
                  { label: 'RC Book', uploaded: !!rcBook, required: selectedPolicyType === 'motor' },
                  { label: 'Live Photo', uploaded: !!livePhoto, required: false },
                  { label: `Other Docs (${otherDocs.length})`, uploaded: otherDocs.length > 0, required: false },
                ]
                  .filter(({ required, uploaded }) => required || uploaded)
                  .map(({ label, uploaded, required }) => (
                    <div key={label} className={`flex items-center gap-1.5 ${uploaded ? 'text-green-700' : required ? 'text-red-500' : 'text-slate-400'}`}>
                      {uploaded ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {label} {required && !uploaded && <span className="text-red-500">*</span>}
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
              ℹ️ After submission, the owner will review and approve this customer. You'll get notified once approved.
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between p-6 pt-0 gap-3">
          {stepIndex > 0 ? (
            <button onClick={prevStep} className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <button onClick={() => navigate(`${prefix}/customers`)} className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">
              <ArrowLeft className="w-4 h-4" /> Cancel
            </button>
          )}

          {step !== 'review' ? (
            <button onClick={nextStep} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
              <Check className="w-4 h-4" /> Submit for Approval
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
