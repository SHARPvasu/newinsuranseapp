export type UserRole = 'owner' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export type PolicyType = 'health' | 'life' | 'motor' | 'miscellaneous';
export type CustomerStatus = 'pending' | 'approved' | 'rejected';
export type LeadStatus = 'new' | 'contacted' | 'interested' | 'converted' | 'lost';
export type CallStatus = 'completed' | 'missed' | 'scheduled' | 'no_answer';

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  dob: string;
  medicalConditions?: string;
}

export interface HealthPolicyDetails {
  height: string;
  weight: string;
  medicalConditions: string;
  rareConditions: string;
  familyMembers: FamilyMember[];
  notes: string;
}

export interface LifePolicyDetails {
  occupation: string;
  annualIncome: string;
  smoker: boolean;
  coverAmount: string;
  term: string;
  nominees: FamilyMember[];
  notes: string;
}

export interface MotorPolicyDetails {
  vehicleType: string;
  vehicleNumber: string;
  make: string;
  model: string;
  year: string;
  engineNumber: string;
  chassisNumber: string;
  idv: string;
  previousInsurer: string;
  notes: string;
}

export interface MiscPolicyDetails {
  policyName: string;
  description: string;
  coverAmount: string;
  employeeCount?: string;
  specialNotes: string;
  notes: string;
}

export interface Document {
  id: string;
  name: string;
  type: 'aadhaar' | 'pan' | 'photo' | 'rc_book' | 'other';
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Policy {
  id: string;
  customerId: string;
  type: PolicyType;
  policyNumber: string;
  insurer: string;
  premium: number;
  sumAssured: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  renewalDate: string;
  documents: Document[];
  healthDetails?: HealthPolicyDetails;
  lifeDetails?: LifePolicyDetails;
  motorDetails?: MotorPolicyDetails;
  miscDetails?: MiscPolicyDetails;
  createdAt: string;
  createdBy: string;
  agentId: string;
}

export interface Customer {
  id: string;
  customerId: string;
  isExisting: boolean;
  name: string;
  phone: string;
  email: string;
  address: string;
  dob: string;
  status: CustomerStatus;
  agentId: string;
  documents: Document[];
  livePhoto?: string;
  policies: Policy[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  notificationSent: boolean;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: string;
  status: LeadStatus;
  policyInterest: PolicyType[];
  notes: string;
  agentId: string;
  followUpDate?: string;
  convertedCustomerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CallRecord {
  id: string;
  customerId?: string;
  leadId?: string;
  agentId: string;
  contactName: string;
  phone: string;
  duration: number;
  status: CallStatus;
  notes: string;
  scheduledAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'approval_request' | 'approved' | 'rejected' | 'renewal' | 'birthday' | 'system' | 'call' | 'claim';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

export interface Claim {
  id: string;
  claimNumber: string;
  policyId: string;
  customerId: string;
  customerName: string;
  policyNumber: string;
  policyType: PolicyType;
  claimDate: string;
  claimAmount: number;
  approvedAmount: number;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid';
  claimType: string;
  description: string;
  documents: Document[];
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  paidAt?: string;
  notes: string;
  agentId: string;
  createdAt: string;
}

export interface Commission {
  id: string;
  agentId: string;
  customerId: string;
  customerName: string;
  policyId: string;
  policyNumber: string;
  policyType: PolicyType;
  commissionType: 'first_year' | 'renewal' | 'referral';
  amount: number;
  status: 'pending' | 'approved' | 'paid';
  paidAt?: string;
  createdAt: string;
}

export interface PremiumCalcInput {
  policyType: PolicyType;
  age: number;
  sumAssured: number;
  term?: number;
  smoker?: boolean;
  vehicleType?: string;
  idv?: number;
}

export interface AppState {
  users: User[];
  customers: Customer[];
  leads: Lead[];
  calls: CallRecord[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  claims: Claim[];
  commissions: Commission[];
  currentUser: User | null;
  darkMode: boolean;
}
