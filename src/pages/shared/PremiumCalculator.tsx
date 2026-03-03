import { useState } from 'react';
import { Calculator, Heart, Shield, Car, Briefcase, Info, TrendingUp, IndianRupee, ChevronDown } from 'lucide-react';

type PolicyType = 'health' | 'life' | 'motor' | 'misc';
type PaymentFreq = 'annual' | 'semi-annual' | 'quarterly' | 'monthly';

interface CalcResult {
  annualPremium: number;
  frequencyPremium: number;
  breakdown: { label: string; amount: number; info?: string }[];
  comparison: { plan: string; premium: number; features: string[] }[];
}

const HEALTH_BASE_RATES: Record<string, number> = {
  '18-25': 4500, '26-30': 5500, '31-35': 7000, '36-40': 9000,
  '41-45': 12000, '46-50': 16000, '51-55': 22000, '56-60': 30000,
  '61-65': 42000, '66-70': 55000, '71-75': 72000, '76+': 95000,
};

const LIFE_MORTALITY: Record<string, number> = {
  '18-25': 0.0008, '26-30': 0.0010, '31-35': 0.0013, '36-40': 0.0018,
  '41-45': 0.0026, '46-50': 0.0038, '51-55': 0.0055, '56-60': 0.0082,
  '61-65': 0.012, '66-70': 0.018,
};

const MOTOR_OD_RATES: Record<string, Record<string, number>> = {
  Car: { '0-1': 0.028, '1-3': 0.025, '3-5': 0.022, '5-10': 0.019, '10+': 0.016 },
  Bike: { '0-1': 0.022, '1-3': 0.020, '3-5': 0.018, '5-10': 0.015, '10+': 0.012 },
  Truck: { '0-1': 0.035, '1-3': 0.032, '3-5': 0.028, '5-10': 0.024, '10+': 0.020 },
  Bus: { '0-1': 0.038, '1-3': 0.034, '3-5': 0.030, '5-10': 0.026, '10+': 0.022 },
  Auto: { '0-1': 0.025, '1-3': 0.022, '3-5': 0.019, '5-10': 0.016, '10+': 0.013 },
  'Commercial Vehicle': { '0-1': 0.032, '1-3': 0.028, '3-5': 0.025, '5-10': 0.021, '10+': 0.018 },
};

const TP_RATES: Record<string, number> = {
  'Car (<1000cc)': 2094, 'Car (1000-1500cc)': 3416, 'Car (>1500cc)': 7897,
  'Bike (<75cc)': 538, 'Bike (75-150cc)': 714, 'Bike (150-350cc)': 1366, 'Bike (>350cc)': 2804,
  Truck: 15746, Bus: 17882, Auto: 6521, 'Commercial Vehicle': 12500,
};

function getAgeGroup(age: number, type: 'health' | 'life'): string {
  if (type === 'health') {
    if (age <= 25) return '18-25'; if (age <= 30) return '26-30';
    if (age <= 35) return '31-35'; if (age <= 40) return '36-40';
    if (age <= 45) return '41-45'; if (age <= 50) return '46-50';
    if (age <= 55) return '51-55'; if (age <= 60) return '56-60';
    if (age <= 65) return '61-65'; if (age <= 70) return '66-70';
    if (age <= 75) return '71-75'; return '76+';
  } else {
    if (age <= 25) return '18-25'; if (age <= 30) return '26-30';
    if (age <= 35) return '31-35'; if (age <= 40) return '36-40';
    if (age <= 45) return '41-45'; if (age <= 50) return '46-50';
    if (age <= 55) return '51-55'; if (age <= 60) return '56-60';
    if (age <= 65) return '61-65'; return '66-70';
  }
}

function getVehicleAgeGroup(vehicleAge: number): string {
  if (vehicleAge <= 1) return '0-1'; if (vehicleAge <= 3) return '1-3';
  if (vehicleAge <= 5) return '3-5'; if (vehicleAge <= 10) return '5-10'; return '10+';
}

export default function PremiumCalculator() {
  const [type, setType] = useState<PolicyType>('health');
  const [payFreq, setPayFreq] = useState<PaymentFreq>('annual');
  const [result, setResult] = useState<CalcResult | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  // Health inputs
  const [age, setAge] = useState('30');
  const [sumAssured, setSumAssured] = useState('500000');
  const [familySize, setFamilySize] = useState('1');
  const [preExisting, setPreExisting] = useState(false);
  const [coverType, setCoverType] = useState<'individual' | 'floater'>('individual');
  const [zone, setZone] = useState<'A' | 'B' | 'C'>('B');

  // Life inputs
  const [lifeSA, setLifeSA] = useState('10000000');
  const [term, setTerm] = useState('20');
  const [smoker, setSmoker] = useState(false);
  const [lifeAge, setLifeAge] = useState('30');
  const [lifeType, setLifeType] = useState<'term' | 'endowment' | 'ulip'>('term');

  // Motor inputs
  const [vehicleType, setVehicleType] = useState('Car');
  const [idv, setIdv] = useState('500000');
  const [vehicleAge, setVehicleAge] = useState('2');
  const [cc, setCc] = useState('1200');
  const [ncb, setNcb] = useState('0');
  const [addons, setAddons] = useState({ zeroDepreciation: false, engineProtect: false, roadAssist: false, passengerCover: false });

  // Misc inputs
  const [miscSA, setMiscSA] = useState('500000');
  const [miscType, setMiscType] = useState<'fire' | 'marine' | 'travel' | 'group_health' | 'wc'>('fire');
  const [empCount, setEmpCount] = useState('50');
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');

  const freqMultiplier: Record<PaymentFreq, number> = {
    annual: 1, 'semi-annual': 0.52, quarterly: 0.27, monthly: 0.09,
  };
  const freqLabels: Record<PaymentFreq, string> = {
    annual: 'Annual', 'semi-annual': 'Semi-Annual', quarterly: 'Quarterly', monthly: 'Monthly',
  };

  const calculate = () => {
    let annualPremium = 0;
    const breakdown: { label: string; amount: number; info?: string }[] = [];
    const comparison: { plan: string; premium: number; features: string[] }[] = [];

    if (type === 'health') {
      const a = parseInt(age) || 30;
      const sa = parseInt(sumAssured) || 500000;
      const members = parseInt(familySize) || 1;
      const ageGroup = getAgeGroup(a, 'health');
      const baseRate = HEALTH_BASE_RATES[ageGroup] || 5500;

      // Scale based on sum assured (base rate is for ₹5L)
      const saFactor = sa / 500000;
      let basePremium = Math.round(baseRate * saFactor);

      // Zone loading
      const zoneLoading = zone === 'A' ? 1.25 : zone === 'B' ? 1.0 : 0.85;
      basePremium = Math.round(basePremium * zoneLoading);
      breakdown.push({ label: 'Base Premium', amount: basePremium, info: `Age ${a}, Zone ${zone}, ₹${(sa / 100000).toFixed(0)}L cover` });

      // Family floater discount or loading
      if (coverType === 'floater' && members > 1) {
        const floaterLoading = Math.round(basePremium * (members - 1) * 0.45);
        breakdown.push({ label: `Family Floater (+${members - 1} members)`, amount: floaterLoading, info: '45% per additional member' });
        basePremium += floaterLoading;
      }

      // Pre-existing disease loading
      if (preExisting) {
        const peLoading = Math.round(basePremium * 0.30);
        breakdown.push({ label: 'Pre-existing Condition Loading', amount: peLoading, info: '30% additional for declared conditions' });
        basePremium += peLoading;
      }

      // GST 18%
      const gst = Math.round(basePremium * 0.18);
      breakdown.push({ label: 'GST (18%)', amount: gst });
      annualPremium = basePremium + gst;

      // Comparison plans
      comparison.push(
        { plan: 'Star Health - Family Health Optima', premium: Math.round(annualPremium * 0.95), features: ['No co-pay', 'Day 1 cover for newborn', 'Restoration benefit'] },
        { plan: 'HDFC ERGO Optima Secure', premium: Math.round(annualPremium * 1.05), features: ['Unlimited restoration', 'OPD cover', 'Global coverage option'] },
        { plan: 'Care Health Supreme', premium: Math.round(annualPremium * 0.90), features: ['No sub-limits', 'AYUSH treatment', 'Air ambulance cover'] },
      );
    }

    else if (type === 'life') {
      const a = parseInt(lifeAge) || 30;
      const sa = parseInt(lifeSA) || 10000000;
      const t = parseInt(term) || 20;
      const ageGroup = getAgeGroup(a, 'life');
      const mortalityRate = LIFE_MORTALITY[ageGroup] || 0.0013;

      if (lifeType === 'term') {
        let basePremium = Math.round(sa * mortalityRate);
        breakdown.push({ label: 'Mortality Charge', amount: basePremium, info: `Rate: ${(mortalityRate * 100).toFixed(2)}% for age ${a}` });

        // Term adjustment (longer term = slightly higher)
        const termFactor = t > 30 ? 1.15 : t > 20 ? 1.08 : t > 10 ? 1.0 : 0.95;
        const termAdj = Math.round(basePremium * (termFactor - 1));
        if (termAdj !== 0) {
          breakdown.push({ label: `Term Adjustment (${t} years)`, amount: termAdj });
          basePremium += termAdj;
        }

        // Smoker loading (50-80% higher)
        if (smoker) {
          const smokerLoading = Math.round(basePremium * 0.65);
          breakdown.push({ label: 'Smoker Loading', amount: smokerLoading, info: '65% additional for tobacco users' });
          basePremium += smokerLoading;
        }

        const gst = Math.round(basePremium * 0.18);
        breakdown.push({ label: 'GST (18%)', amount: gst });
        annualPremium = basePremium + gst;

        comparison.push(
          { plan: 'LIC Tech Term', premium: Math.round(annualPremium * 1.10), features: ['LIC brand trust', 'High claim settlement', 'Loyalty addition'] },
          { plan: 'HDFC Life Click 2 Protect', premium: Math.round(annualPremium * 0.92), features: ['Life stage benefit', 'Waiver of premium', 'Increasing cover option'] },
          { plan: 'ICICI Pru iProtect Smart', premium: Math.round(annualPremium * 0.88), features: ['Terminal illness cover', 'Return of premium option', 'Accidental death benefit'] },
        );
      } else if (lifeType === 'endowment') {
        // Endowment: savings + insurance, much higher premium
        const savingsComponent = Math.round(sa * 0.035);
        const insuranceComponent = Math.round(sa * mortalityRate * 1.5);
        breakdown.push({ label: 'Savings Component', amount: savingsComponent, info: '3.5% of Sum Assured saved annually' });
        breakdown.push({ label: 'Insurance Component', amount: insuranceComponent });
        const base = savingsComponent + insuranceComponent;
        const gst = Math.round(base * 0.045); // 4.5% GST on endowment
        breakdown.push({ label: 'GST (4.5%)', amount: gst });
        annualPremium = base + gst;

        comparison.push(
          { plan: 'LIC Jeevan Labh', premium: Math.round(annualPremium * 0.95), features: ['Guaranteed maturity', 'Bonus additions', 'Tax benefits u/s 80C'] },
          { plan: 'SBI Life Smart Wealth Builder', premium: Math.round(annualPremium * 1.02), features: ['Flexible premium', 'Wealth boosters', 'Partial withdrawal'] },
        );
      } else {
        // ULIP: market-linked
        const fundMgmt = Math.round(sa * 0.013);
        const mortalityCharge = Math.round(sa * mortalityRate * 0.8);
        const adminCharge = 500;
        breakdown.push({ label: 'Fund Management Charge', amount: fundMgmt, info: '1.3% of fund value' });
        breakdown.push({ label: 'Mortality Charge', amount: mortalityCharge });
        breakdown.push({ label: 'Admin Charge', amount: adminCharge });
        const base = fundMgmt + mortalityCharge + adminCharge;
        const gst = Math.round(base * 0.18);
        breakdown.push({ label: 'GST (18%)', amount: gst });
        annualPremium = base + gst;
        // Minimum ULIP premium
        if (annualPremium < 25000) annualPremium = 25000;

        comparison.push(
          { plan: 'HDFC Life ProGrowth Plus', premium: Math.round(annualPremium * 1.05), features: ['Multiple fund options', 'Portfolio strategies', 'Wealth boosters'] },
          { plan: 'ICICI Pru Signature', premium: Math.round(annualPremium * 0.98), features: ['Loyalty additions', 'Life cover option', 'Fund switching free'] },
        );
      }
    }

    else if (type === 'motor') {
      const iv = parseInt(idv) || 500000;
      const vAge = parseInt(vehicleAge) || 2;
      const engineCC = parseInt(cc) || 1200;
      const ncbPct = parseInt(ncb) || 0;
      const ageGroup = getVehicleAgeGroup(vAge);
      const odRate = MOTOR_OD_RATES[vehicleType]?.[ageGroup] || 0.025;

      // Own Damage Premium
      let odPremium = Math.round(iv * odRate);
      breakdown.push({ label: 'Own Damage (OD) Premium', amount: odPremium, info: `IDV ₹${iv.toLocaleString('en-IN')} × ${(odRate * 100).toFixed(1)}%` });

      // NCB Discount
      if (ncbPct > 0) {
        const ncbDiscount = Math.round(odPremium * ncbPct / 100);
        breakdown.push({ label: `NCB Discount (${ncbPct}%)`, amount: -ncbDiscount, info: 'No Claim Bonus for claim-free years' });
        odPremium -= ncbDiscount;
      }

      // Third Party Premium (fixed by IRDAI)
      let tpKey = vehicleType;
      if (vehicleType === 'Car') {
        tpKey = engineCC <= 1000 ? 'Car (<1000cc)' : engineCC <= 1500 ? 'Car (1000-1500cc)' : 'Car (>1500cc)';
      } else if (vehicleType === 'Bike') {
        tpKey = engineCC <= 75 ? 'Bike (<75cc)' : engineCC <= 150 ? 'Bike (75-150cc)' : engineCC <= 350 ? 'Bike (150-350cc)' : 'Bike (>350cc)';
      }
      const tpPremium = TP_RATES[tpKey] || TP_RATES[vehicleType] || 3416;
      breakdown.push({ label: 'Third Party (TP) Premium', amount: tpPremium, info: 'Fixed by IRDAI regulations' });

      // PA Cover for owner-driver
      const paCover = vehicleType === 'Bike' ? 750 : 1500;
      breakdown.push({ label: 'PA Cover (Owner-Driver)', amount: paCover, info: '₹15 Lakh mandatory PA cover' });

      // Add-ons
      let addonTotal = 0;
      if (addons.zeroDepreciation) { const zd = Math.round(odPremium * 0.20); addonTotal += zd; breakdown.push({ label: 'Zero Depreciation', amount: zd, info: 'Full claim without depreciation deduction' }); }
      if (addons.engineProtect) { const ep = Math.round(odPremium * 0.08); addonTotal += ep; breakdown.push({ label: 'Engine Protector', amount: ep }); }
      if (addons.roadAssist) { addonTotal += 499; breakdown.push({ label: '24×7 Road Assistance', amount: 499 }); }
      if (addons.passengerCover) { const pc = vehicleType === 'Car' ? 1200 : 600; addonTotal += pc; breakdown.push({ label: 'Passenger Cover', amount: pc }); }

      const subTotal = odPremium + tpPremium + paCover + addonTotal;
      const gst = Math.round(subTotal * 0.18);
      breakdown.push({ label: 'GST (18%)', amount: gst });
      annualPremium = subTotal + gst;

      comparison.push(
        { plan: 'HDFC ERGO Motor Insurance', premium: Math.round(annualPremium * 0.95), features: ['Cashless at 8000+ garages', 'Quick claim settlement', 'NCB protection'] },
        { plan: 'ICICI Lombard Motor', premium: Math.round(annualPremium * 1.02), features: ['Instant policy', 'Free RSA', 'Flexible IDV'] },
        { plan: 'Bajaj Allianz Motor', premium: Math.round(annualPremium * 0.92), features: ['7500+ cashless garages', 'Quick renewal', 'Add-on covers'] },
      );
    }

    else {
      const sa = parseInt(miscSA) || 500000;
      const employees = parseInt(empCount) || 50;
      const riskFactors: Record<string, number> = { low: 0.8, medium: 1.0, high: 1.4 };
      const rFactor = riskFactors[riskLevel];

      const rates: Record<string, { rate: number; label: string }> = {
        fire: { rate: 0.0015, label: 'Fire & Allied Perils' },
        marine: { rate: 0.003, label: 'Marine Cargo Insurance' },
        travel: { rate: 0.008, label: 'Travel Insurance' },
        group_health: { rate: 0.025, label: 'Group Health Insurance' },
        wc: { rate: 0.012, label: "Workmen's Compensation" },
      };

      const { rate, label } = rates[miscType];
      let basePremium: number;

      if (miscType === 'group_health') {
        basePremium = Math.round(employees * (sa / employees) * rate * rFactor);
        breakdown.push({ label: `${label} Base`, amount: basePremium, info: `${employees} employees × ₹${Math.round(sa / employees).toLocaleString('en-IN')} per head` });
      } else if (miscType === 'wc') {
        basePremium = Math.round(employees * 1500 * rFactor);
        breakdown.push({ label: `${label} Base`, amount: basePremium, info: `${employees} workers × ₹1,500 avg. rate` });
      } else {
        basePremium = Math.round(sa * rate * rFactor);
        breakdown.push({ label: `${label} Base`, amount: basePremium, info: `Rate: ${(rate * 100).toFixed(2)}% × Risk: ${riskLevel}` });
      }

      const stampDuty = Math.round(basePremium * 0.005);
      breakdown.push({ label: 'Stamp Duty', amount: stampDuty });
      const gst = Math.round((basePremium + stampDuty) * 0.18);
      breakdown.push({ label: 'GST (18%)', amount: gst });
      annualPremium = basePremium + stampDuty + gst;

      comparison.push(
        { plan: `New India Assurance - ${label}`, premium: Math.round(annualPremium * 0.90), features: ['Government-backed', 'Wide coverage', 'Pan-India claims'] },
        { plan: `Tata AIG - ${label}`, premium: Math.round(annualPremium * 1.05), features: ['Quick settlement', 'Online portal', 'Dedicated manager'] },
      );
    }

    const frequencyPremium = Math.round(annualPremium * freqMultiplier[payFreq]);

    setResult({ annualPremium, frequencyPremium, breakdown, comparison });
  };

  const policyTypesList = [
    { value: 'health' as PolicyType, label: 'Health', icon: Heart, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { value: 'life' as PolicyType, label: 'Life', icon: Shield, color: 'text-green-600 bg-green-50 border-green-200' },
    { value: 'motor' as PolicyType, label: 'Motor', icon: Car, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { value: 'misc' as PolicyType, label: 'Misc', icon: Briefcase, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  ];

  const inp = "w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const lbl = "block text-xs font-medium text-slate-600 mb-1.5";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-blue-600" /> Premium Calculator
        </h1>
        <p className="text-slate-500 text-sm mt-1">Accurate premium estimates based on IRDAI guidelines & market rates</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
        {/* Policy type */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Insurance Type</label>
          <div className="grid grid-cols-4 gap-2">
            {policyTypesList.map(pt => (
              <button key={pt.value}
                onClick={() => { setType(pt.value); setResult(null); setShowComparison(false); }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${type === pt.value ? `border-blue-500 bg-blue-50` : 'border-slate-200 hover:border-slate-300'}`}
              >
                <pt.icon className={`w-5 h-5 ${type === pt.value ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="text-xs font-semibold text-slate-800">{pt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Payment frequency */}
        <div>
          <label className={lbl}>Payment Frequency</label>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(freqLabels) as PaymentFreq[]).map(f => (
              <button key={f} onClick={() => setPayFreq(f)}
                className={`px-2 py-2 rounded-lg text-xs font-medium border transition-all ${payFreq === f ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {freqLabels[f]}
              </button>
            ))}
          </div>
        </div>

        {/* ====== HEALTH ====== */}
        {type === 'health' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Age of Eldest Member (years) *</label>
                <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="30" className={inp} />
              </div>
              <div>
                <label className={lbl}>Sum Insured (₹) *</label>
                <select value={sumAssured} onChange={e => setSumAssured(e.target.value)} className={inp}>
                  <option value="300000">₹3 Lakh</option>
                  <option value="500000">₹5 Lakh</option>
                  <option value="750000">₹7.5 Lakh</option>
                  <option value="1000000">₹10 Lakh</option>
                  <option value="1500000">₹15 Lakh</option>
                  <option value="2000000">₹20 Lakh</option>
                  <option value="2500000">₹25 Lakh</option>
                  <option value="5000000">₹50 Lakh</option>
                  <option value="10000000">₹1 Crore</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Cover Type</label>
                <select value={coverType} onChange={e => setCoverType(e.target.value as 'individual' | 'floater')} className={inp}>
                  <option value="individual">Individual</option>
                  <option value="floater">Family Floater</option>
                </select>
              </div>
              {coverType === 'floater' && (
                <div>
                  <label className={lbl}>Number of Members</label>
                  <select value={familySize} onChange={e => setFamilySize(e.target.value)} className={inp}>
                    {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n===1?'member':'members'}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className={lbl}>City Zone</label>
                <select value={zone} onChange={e => setZone(e.target.value as 'A'|'B'|'C')} className={inp}>
                  <option value="A">Zone A (Metro - Mumbai, Delhi)</option>
                  <option value="B">Zone B (Tier 1 cities)</option>
                  <option value="C">Zone C (Other cities)</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input type="checkbox" checked={preExisting} onChange={e => setPreExisting(e.target.checked)} className="w-4 h-4 accent-blue-600" />
              Has pre-existing conditions (diabetes, BP, etc.)
            </label>
          </div>
        )}

        {/* ====== LIFE ====== */}
        {type === 'life' && (
          <div className="space-y-4">
            <div>
              <label className={lbl}>Plan Type</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: 'term', l: 'Term Plan', d: 'Pure protection' },
                  { v: 'endowment', l: 'Endowment', d: 'Savings + cover' },
                  { v: 'ulip', l: 'ULIP', d: 'Market-linked' },
                ].map(p => (
                  <button key={p.v} onClick={() => setLifeType(p.v as typeof lifeType)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${lifeType === p.v ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className="text-sm font-semibold text-slate-900">{p.l}</div>
                    <div className="text-xs text-slate-500">{p.d}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Age (years) *</label>
                <input type="number" value={lifeAge} onChange={e => setLifeAge(e.target.value)} className={inp} />
              </div>
              <div>
                <label className={lbl}>Sum Assured (₹) *</label>
                <select value={lifeSA} onChange={e => setLifeSA(e.target.value)} className={inp}>
                  <option value="2500000">₹25 Lakh</option>
                  <option value="5000000">₹50 Lakh</option>
                  <option value="7500000">₹75 Lakh</option>
                  <option value="10000000">₹1 Crore</option>
                  <option value="15000000">₹1.5 Crore</option>
                  <option value="20000000">₹2 Crore</option>
                  <option value="50000000">₹5 Crore</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Policy Term (years)</label>
                <select value={term} onChange={e => setTerm(e.target.value)} className={inp}>
                  {[5,10,15,20,25,30,35,40].map(t => <option key={t} value={t}>{t} years</option>)}
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input type="checkbox" checked={smoker} onChange={e => setSmoker(e.target.checked)} className="w-4 h-4 accent-blue-600" />
              Tobacco user / Smoker
            </label>
          </div>
        )}

        {/* ====== MOTOR ====== */}
        {type === 'motor' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Vehicle Type *</label>
                <select value={vehicleType} onChange={e => setVehicleType(e.target.value)} className={inp}>
                  {Object.keys(MOTOR_OD_RATES).map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>IDV (Insured Declared Value ₹) *</label>
                <input type="number" value={idv} onChange={e => setIdv(e.target.value)} placeholder="500000" className={inp} />
              </div>
              <div>
                <label className={lbl}>Vehicle Age (years)</label>
                <input type="number" value={vehicleAge} onChange={e => setVehicleAge(e.target.value)} placeholder="2" className={inp} />
              </div>
              <div>
                <label className={lbl}>Engine CC</label>
                <input type="number" value={cc} onChange={e => setCc(e.target.value)} placeholder="1200" className={inp} />
              </div>
              <div>
                <label className={lbl}>NCB (No Claim Bonus %)</label>
                <select value={ncb} onChange={e => setNcb(e.target.value)} className={inp}>
                  <option value="0">0% (First year / Claim made)</option>
                  <option value="20">20% (1 claim-free year)</option>
                  <option value="25">25% (2 claim-free years)</option>
                  <option value="35">35% (3 claim-free years)</option>
                  <option value="45">45% (4 claim-free years)</option>
                  <option value="50">50% (5+ claim-free years)</option>
                </select>
              </div>
            </div>
            <div>
              <label className={lbl}>Add-on Covers</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'zeroDepreciation', label: 'Zero Depreciation', desc: 'Full claim amount' },
                  { key: 'engineProtect', label: 'Engine Protector', desc: 'Water damage cover' },
                  { key: 'roadAssist', label: 'Road Assistance', desc: '24×7 breakdown help' },
                  { key: 'passengerCover', label: 'Passenger Cover', desc: 'Passenger PA cover' },
                ].map(a => (
                  <label key={a.key} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${addons[a.key as keyof typeof addons] ? 'bg-amber-50 border-amber-200' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="checkbox" checked={addons[a.key as keyof typeof addons]}
                      onChange={e => setAddons(prev => ({ ...prev, [a.key]: e.target.checked }))} className="w-3.5 h-3.5 accent-amber-600" />
                    <div>
                      <div className="text-xs font-medium text-slate-700">{a.label}</div>
                      <div className="text-xs text-slate-400">{a.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ====== MISC ====== */}
        {type === 'misc' && (
          <div className="space-y-4">
            <div>
              <label className={lbl}>Policy Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { v: 'fire', l: 'Fire Insurance' },
                  { v: 'marine', l: 'Marine Cargo' },
                  { v: 'travel', l: 'Travel Insurance' },
                  { v: 'group_health', l: 'Group Health' },
                  { v: 'wc', l: "Workmen's Comp" },
                ].map(p => (
                  <button key={p.v} onClick={() => setMiscType(p.v as typeof miscType)}
                    className={`p-2.5 rounded-xl border-2 text-xs font-medium transition-all ${miscType === p.v ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                  >{p.l}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Sum Insured / Cover (₹)</label>
                <input type="number" value={miscSA} onChange={e => setMiscSA(e.target.value)} className={inp} />
              </div>
              {(miscType === 'group_health' || miscType === 'wc') && (
                <div>
                  <label className={lbl}>Number of Employees</label>
                  <input type="number" value={empCount} onChange={e => setEmpCount(e.target.value)} className={inp} />
                </div>
              )}
              <div>
                <label className={lbl}>Risk Level</label>
                <select value={riskLevel} onChange={e => setRiskLevel(e.target.value as typeof riskLevel)} className={inp}>
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <button onClick={calculate}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Calculator className="w-4 h-4" /> Calculate Premium
        </button>
      </div>

      {/* ====== RESULT ====== */}
      {result && (
        <div className="space-y-4">
          {/* Main result card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-lg">Premium Estimate</h3>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                {type.charAt(0).toUpperCase() + type.slice(1)} Insurance
              </span>
            </div>

            {/* Premium breakdown */}
            <div className="space-y-2 mb-4">
              {result.breakdown.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">{item.label}</span>
                    {item.info && (
                      <div className="group relative">
                        <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                        <div className="hidden group-hover:block absolute bottom-full left-0 mb-1 bg-slate-800 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap z-10">
                          {item.info}
                        </div>
                      </div>
                    )}
                  </div>
                  <span className={`font-medium ${item.amount < 0 ? 'text-green-700' : 'text-slate-800'}`}>
                    {item.amount < 0 ? '-' : ''}₹{Math.abs(item.amount).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-blue-200 pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">Total Annual Premium</span>
                <span className="text-2xl font-bold text-blue-700 flex items-center">
                  <IndianRupee className="w-5 h-5" />{result.annualPremium.toLocaleString('en-IN')}
                </span>
              </div>
              {payFreq !== 'annual' && (
                <div className="flex justify-between items-center bg-white/60 rounded-lg px-3 py-2">
                  <span className="text-sm text-slate-600">{freqLabels[payFreq]} Premium</span>
                  <span className="text-lg font-bold text-blue-600">
                    ₹{result.frequencyPremium.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-start gap-1.5 text-xs text-slate-500">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>This is an approximate estimate based on IRDAI guidelines and market rates. Actual premium may vary by ±10-15% depending on insurer, underwriting, and specific conditions.</span>
            </div>
          </div>

          {/* Comparison */}
          {result.comparison.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <button onClick={() => setShowComparison(!showComparison)}
                className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-slate-900 text-sm">Compare Plans ({result.comparison.length} options)</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showComparison ? 'rotate-180' : ''}`} />
              </button>
              {showComparison && (
                <div className="px-5 pb-5 space-y-3 border-t border-slate-100 pt-3">
                  {result.comparison.map((plan, i) => (
                    <div key={i} className="flex items-start justify-between p-3 bg-slate-50 rounded-xl">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{plan.plan}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {plan.features.map((f, j) => (
                            <span key={j} className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded-full text-slate-600">✓ {f}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <div className="text-sm font-bold text-blue-700">₹{plan.premium.toLocaleString('en-IN')}</div>
                        <div className="text-xs text-slate-400">/year</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
          <h4 className="font-semibold text-slate-900 mb-2 text-sm flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-blue-500" /> Health Insurance Tips
          </h4>
          <ul className="text-xs text-slate-500 space-y-1">
            <li>• Higher age = significantly higher premium after 45</li>
            <li>• Family floater saves 30-40% vs individual plans</li>
            <li>• Pre-existing conditions have 2-4 year waiting period</li>
            <li>• Metro cities (Zone A) cost 20-25% more</li>
            <li>• Top-up plans provide extra cover at lower cost</li>
          </ul>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
          <h4 className="font-semibold text-slate-900 mb-2 text-sm flex items-center gap-1.5">
            <Car className="w-4 h-4 text-amber-500" /> Motor Insurance Tips
          </h4>
          <ul className="text-xs text-slate-500 space-y-1">
            <li>• NCB can save up to 50% on OD premium</li>
            <li>• Zero depreciation is must for cars &lt; 3 years old</li>
            <li>• TP premium is fixed by IRDAI, same across insurers</li>
            <li>• Higher IDV = higher premium but better coverage</li>
            <li>• Compare at least 3 insurers before buying</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
