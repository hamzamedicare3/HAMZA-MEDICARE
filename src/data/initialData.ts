import { AuditLogEntry, CatalogItem, Client, CompanyProfile, Invoice, User } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user_admin_01',
    username: 'admin',
    passwordHash: 'admin123',
    fullName: 'Fahad Khan',
    email: 'fahad@aurabill.pk',
    role: 'admin',
    department: 'Executive Administration',
    status: 'active',
    createdAt: '2026-10-23T00:00:00Z',
    lastLoginAt: '2026-10-23T15:25:00Z',
  },
];

export const INITIAL_COMPANY: CompanyProfile = {
  name: 'Aura Commercial Solutions (Pvt) Ltd.',
  email: 'billing@aurasolutions.pk',
  phone: '+92 (21) 3584-9201',
  website: 'https://aurasolutions.pk',
  address: 'Plot 14-C, Main Khayaban-e-Shahbaz, Phase 6, DHA, Karachi, Pakistan',
  taxId: 'NTN: 8492019-4 | STRN: 3277876123456',
  defaultCurrency: 'PKR',
  defaultPaymentTerms: 'net_30',
  bankName: '',
  bankAccount: '',
  bankRouting: '',
  swiftCode: '',
  paypalEmail: '',
  paymentInstructions: 'Thank you for your business!',
};

export const INITIAL_CLIENTS: Client[] = [];

export const INITIAL_CATALOG: CatalogItem[] = [];

export const INITIAL_INVOICES: Invoice[] = [];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log_01',
    timestamp: '2026-10-23T15:25:00Z',
    userId: 'user_admin_01',
    username: 'admin',
    action: 'SYSTEM_INITIALIZED',
    entityType: 'system',
    entityId: 'sys_root',
    details: 'System database cleared and initialized for Administrator Fahad Khan.',
  },
];
