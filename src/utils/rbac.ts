import { RolePermissions, User, UserRole } from '../types';

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canManageUsers: true,
    canCreateInvoice: true,
    canEditInvoice: true,
    canDeleteInvoice: true,
    canRecordPayments: true,
    canManageClients: true,
    canManageCatalog: true,
    canAccessSettings: true,
    canViewReports: true,
    canOverrideStatus: true,
  },
  operator: {
    canManageUsers: false,
    canCreateInvoice: true, // CAN create new invoices
    canEditInvoice: false,  // CANNOT edit previous invoices (tamper-proof)
    canDeleteInvoice: false, // CANNOT delete previous invoices
    canRecordPayments: true, // CAN take payment & print thermal receipt
    canManageClients: true,
    canManageCatalog: false,
    canAccessSettings: false,
    canViewReports: true,
    canOverrideStatus: false,
  },
  accountant: {
    canManageUsers: false,
    canCreateInvoice: true,
    canEditInvoice: true,
    canDeleteInvoice: false,
    canRecordPayments: true,
    canManageClients: true,
    canManageCatalog: true,
    canAccessSettings: false,
    canViewReports: true,
    canOverrideStatus: true,
  },
  staff: {
    canManageUsers: false,
    canCreateInvoice: true,
    canEditInvoice: false, // Strictly cannot edit previous invoices
    canDeleteInvoice: false,
    canRecordPayments: false,
    canManageClients: true,
    canManageCatalog: false,
    canAccessSettings: false,
    canViewReports: false,
    canOverrideStatus: false,
  },
  viewer: {
    canManageUsers: false,
    canCreateInvoice: false,
    canEditInvoice: false,
    canDeleteInvoice: false,
    canRecordPayments: false,
    canManageClients: false,
    canManageCatalog: false,
    canAccessSettings: false,
    canViewReports: true,
    canOverrideStatus: false,
  },
};

export const ROLE_LABELS: Record<UserRole, { title: string; badge: string; desc: string }> = {
  admin: {
    title: 'Administrator',
    badge: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    desc: 'Full system authority: create other users, edit any existing invoice, delete records & manage company configuration.',
  },
  operator: {
    title: 'Billing Operator (No Edit)',
    badge: 'bg-amber-50 text-amber-800 border border-amber-300 font-semibold',
    desc: 'Can create new invoices & print thermal receipts. STRICTLY PREVENTED from editing or modifying previous invoices.',
  },
  accountant: {
    title: 'Senior Accountant',
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    desc: 'Financial management: create/edit invoices, record payments, manage clients & view revenue reports.',
  },
  staff: {
    title: 'Sales Rep (No Edit)',
    badge: 'bg-blue-50 text-blue-700 border border-blue-200',
    desc: 'Sales staff: can issue new draft invoices. Cannot edit previous invoices or access financial settings.',
  },
  viewer: {
    title: 'Auditor & Viewer',
    badge: 'bg-slate-100 text-slate-700 border border-slate-200',
    desc: 'Read-only access: view invoices, audit logs, and print thermal receipts. Cannot alter data.',
  },
};

export function hasPermission(user: User | null | undefined, permission: keyof RolePermissions): boolean {
  if (!user || user.status !== 'active') return false;
  const permissions = ROLE_PERMISSIONS[user.role];
  return Boolean(permissions && permissions[permission]);
}
