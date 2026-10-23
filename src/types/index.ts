export type UserRole = 'admin' | 'operator' | 'accountant' | 'staff' | 'viewer';

export interface User {
  id: string;
  username: string;
  passwordHash: string; // Plaintext or hashed for demo auth
  fullName: string;
  email: string;
  role: UserRole;
  department: string;
  status: 'active' | 'suspended';
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface RolePermissions {
  canManageUsers: boolean;
  canCreateInvoice: boolean;
  canEditInvoice: boolean;
  canDeleteInvoice: boolean;
  canRecordPayments: boolean;
  canManageClients: boolean;
  canManageCatalog: boolean;
  canAccessSettings: boolean;
  canViewReports: boolean;
  canOverrideStatus: boolean;
}

export type InvoiceStatus = 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  discountPercent: number;
  total: number;
}

export type PaymentMethod = 'bank_transfer' | 'credit_card' | 'stripe' | 'check' | 'cash' | 'paypal';

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  reference: string;
  notes?: string;
  recordedBy: string; // username or user id
  recordedAt: string;
}

export interface Invoice {
  id: string; // e.g. INV-2026-001
  title?: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  clientTaxId?: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  paymentTerms: 'due_on_receipt' | 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'custom';
  items: LineItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  shippingFee: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  status: InvoiceStatus;
  notes?: string;
  terms?: string;
  currency: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  payments: PaymentRecord[];
  remindersSentCount: number;
  lastReminderAt: string | null;
  autoStatusEnabled: boolean;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  taxId?: string;
  currency: string;
  notes?: string;
  createdAt: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  defaultPrice: number;
  defaultTaxPercent: number;
  unit: string; // hour, project, unit, license
  category: string;
}

export interface CompanyProfile {
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  taxId: string;
  defaultCurrency: string;
  defaultPaymentTerms: 'due_on_receipt' | 'net_15' | 'net_30' | 'net_45' | 'net_60';
  bankName?: string;
  bankAccount?: string;
  bankRouting?: string;
  swiftCode?: string;
  paypalEmail?: string;
  paymentInstructions?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  username: string;
  action: string;
  entityType: 'invoice' | 'payment' | 'user' | 'client' | 'system' | 'settings';
  entityId: string;
  details: string;
}
