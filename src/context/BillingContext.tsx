import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_CATALOG,
  INITIAL_CLIENTS,
  INITIAL_COMPANY,
  INITIAL_INVOICES,
  INITIAL_USERS,
} from '../data/initialData';
import {
  AuditLogEntry,
  CatalogItem,
  Client,
  CompanyProfile,
  Invoice,
  PaymentRecord,
  User,
} from '../types';
import {
  getTodayString,
  recalculateInvoiceFinancials,
  runAutomatedPaymentAudit,
} from '../utils/paymentAutomation';
import { hasPermission } from '../utils/rbac';

interface BillingContextType {
  currentUser: User | null;
  users: User[];
  invoices: Invoice[];
  clients: Client[];
  catalog: CatalogItem[];
  company: CompanyProfile;
  auditLogs: AuditLogEntry[];
  lastAutoAuditTime: string;

  // Auth methods
  login: (username: string, password: string) => { success: boolean; message?: string };
  logout: () => void;
  switchUser: (userId: string) => void;

  // User Management (Admin only)
  createUser: (userData: {
    username: string;
    passwordHash: string;
    fullName: string;
    email: string;
    role: User['role'];
    department: string;
    status: 'active' | 'suspended';
  }) => { success: boolean; message?: string };
  updateUser: (id: string, updates: Partial<User>) => { success: boolean; message?: string };
  deleteUser: (id: string) => { success: boolean; message?: string };
  toggleUserStatus: (id: string) => void;
  resetUserPassword: (id: string, newPassword: string) => void;

  // Invoices & Payments
  createInvoice: (invoiceData: Partial<Invoice>) => Invoice;
  updateInvoice: (id: string, invoiceData: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => boolean;
  recordPayment: (invoiceId: string, payment: {
    amount: number;
    paymentDate: string;
    paymentMethod: PaymentRecord['paymentMethod'];
    reference: string;
    notes?: string;
  }) => { success: boolean; message?: string };
  sendInvoice: (id: string) => void;
  cancelInvoice: (id: string) => void;
  duplicateInvoice: (id: string) => Invoice;
  runAutoStatusCheck: () => { changedCount: number; message: string };
  sendPaymentReminders: (targetIds?: string[]) => { remindersSent: number; invoiceTitles: string[] };

  // Clients
  createClient: (clientData: Omit<Client, 'id' | 'createdAt'>) => Client;
  updateClient: (id: string, clientData: Partial<Client>) => void;
  deleteClient: (id: string) => boolean;

  // Catalog
  createCatalogItem: (item: Omit<CatalogItem, 'id'>) => CatalogItem;
  updateCatalogItem: (id: string, item: Partial<CatalogItem>) => void;
  deleteCatalogItem: (id: string) => void;

  // Settings & Reset
  updateCompanyProfile: (profile: Partial<CompanyProfile>) => void;
  resetToDefaults: () => void;
  exportDataJson: () => string;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'aurabill_users_fahad_v5',
  CURRENT_USER: 'aurabill_current_user_fahad_v5',
  INVOICES: 'aurabill_invoices_fahad_v5',
  CLIENTS: 'aurabill_clients_fahad_v5',
  CATALOG: 'aurabill_catalog_fahad_v5',
  COMPANY: 'aurabill_company_fahad_v5',
  AUDIT: 'aurabill_audit_fahad_v5',
};

export const BillingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load or fallback to initial data
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USERS);
      return stored ? JSON.parse(stored) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed;
      }
      // Website opens with username & password screen or active admin session
      return null;
    } catch {
      return null;
    }
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.INVOICES);
      return stored ? JSON.parse(stored) : INITIAL_INVOICES;
    } catch {
      return INITIAL_INVOICES;
    }
  });

  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CLIENTS);
      return stored ? JSON.parse(stored) : INITIAL_CLIENTS;
    } catch {
      return INITIAL_CLIENTS;
    }
  });

  const [catalog, setCatalog] = useState<CatalogItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CATALOG);
      return stored ? JSON.parse(stored) : INITIAL_CATALOG;
    } catch {
      return INITIAL_CATALOG;
    }
  });

  const [company, setCompany] = useState<CompanyProfile>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COMPANY);
      return stored ? JSON.parse(stored) : INITIAL_COMPANY;
    } catch {
      return INITIAL_COMPANY;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUDIT);
      return stored ? JSON.parse(stored) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  const [lastAutoAuditTime, setLastAutoAuditTime] = useState<string>(new Date().toLocaleTimeString());

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(catalog));
  }, [catalog]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(company));
  }, [company]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Helper to add audit log
  const logAudit = (
    action: string,
    entityType: AuditLogEntry['entityType'],
    entityId: string,
    details: string
  ) => {
    const newEntry: AuditLogEntry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'sys_user',
      username: currentUser?.username || 'system',
      action,
      entityType,
      entityId,
      details,
    };
    setAuditLogs(prev => [newEntry, ...prev.slice(0, 199)]);
  };

  // Run automated payment status check whenever mounted or periodically
  useEffect(() => {
    const executeAutoAudit = () => {
      const auditResult = runAutomatedPaymentAudit(
        invoices,
        currentUser?.id || 'system_auto',
        currentUser?.username || 'Auto-Billing Engine'
      );
      if (auditResult.changedInvoices.length > 0) {
        setInvoices(auditResult.updatedInvoices);
        setAuditLogs(prev => [...auditResult.auditLogs, ...prev]);
      }
      setLastAutoAuditTime(new Date().toLocaleTimeString());
    };

    // Run once on load
    executeAutoAudit();

    // Check every 45 seconds for automatic real-time consistency
    const timer = setInterval(executeAutoAudit, 45000);
    return () => clearInterval(timer);
  }, []);

  // Auth: Login
  const login = (username: string, password: string) => {
    const cleanUsername = username.trim().toLowerCase();
    const user = users.find(u => u.username.toLowerCase() === cleanUsername);

    if (!user) {
      return { success: false, message: 'Invalid username or user does not exist.' };
    }

    if (user.status === 'suspended') {
      return { success: false, message: 'Your account has been suspended. Please contact the system administrator.' };
    }

    if (user.passwordHash !== password) {
      return { success: false, message: 'Incorrect password. Please try again.' };
    }

    // Update last login
    const updatedUser = { ...user, lastLoginAt: new Date().toISOString() };
    setUsers(prev => prev.map(u => (u.id === user.id ? updatedUser : u)));
    setCurrentUser(updatedUser);

    logAudit('USER_LOGIN', 'user', user.id, `User ${user.username} (${user.fullName}) logged in successfully.`);
    return { success: true };
  };

  const logout = () => {
    if (currentUser) {
      logAudit('USER_LOGOUT', 'user', currentUser.id, `User ${currentUser.username} logged out.`);
    }
    setCurrentUser(null);
  };

  const switchUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user && user.status === 'active') {
      setCurrentUser(user);
      logAudit('SWITCH_USER', 'user', user.id, `Switched active session to user ${user.username} (${user.role}).`);
    }
  };

  // User Management (Admin only)
  const createUser = (userData: {
    username: string;
    passwordHash: string;
    fullName: string;
    email: string;
    role: User['role'];
    department: string;
    status: 'active' | 'suspended';
  }) => {
    if (!hasPermission(currentUser, 'canManageUsers')) {
      return { success: false, message: 'Permission denied: Only administrators can create users.' };
    }

    const cleanUsername = userData.username.trim().toLowerCase();
    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, message: 'Username must be at least 3 characters long.' };
    }

    if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
      return { success: false, message: `Username "${userData.username}" is already taken.` };
    }

    if (!userData.passwordHash || userData.passwordHash.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters.' };
    }

    const newUser: User = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      username: cleanUsername,
      passwordHash: userData.passwordHash,
      fullName: userData.fullName.trim() || cleanUsername,
      email: userData.email.trim() || `${cleanUsername}@aurabill.io`,
      role: userData.role,
      department: userData.department.trim() || 'General Operations',
      status: userData.status,
      createdAt: new Date().toISOString(),
    };

    setUsers(prev => [...prev, newUser]);
    logAudit(
      'CREATE_USER',
      'user',
      newUser.id,
      `Admin created new user "${newUser.username}" with role: ${newUser.role.toUpperCase()} (${newUser.department}).`
    );

    return { success: true };
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    if (!hasPermission(currentUser, 'canManageUsers')) {
      return { success: false, message: 'Permission denied: Administrator privileges required.' };
    }

    setUsers(prev =>
      prev.map(u => {
        if (u.id === id) {
          const updated = { ...u, ...updates };
          logAudit(
            'UPDATE_USER',
            'user',
            id,
            `Admin updated user account "${u.username}".`
          );
          return updated;
        }
        return u;
      })
    );

    // If updating current user, sync
    if (currentUser?.id === id) {
      setCurrentUser(prev => (prev ? { ...prev, ...updates } : null));
    }

    return { success: true };
  };

  const deleteUser = (id: string) => {
    if (!hasPermission(currentUser, 'canManageUsers')) {
      return { success: false, message: 'Permission denied: Only administrators can delete users.' };
    }

    if (currentUser?.id === id) {
      return { success: false, message: 'You cannot delete your own active administrator account.' };
    }

    const targetUser = users.find(u => u.id === id);
    if (!targetUser) return { success: false, message: 'User not found.' };

    setUsers(prev => prev.filter(u => u.id !== id));
    logAudit(
      'DELETE_USER',
      'user',
      id,
      `Admin deleted user account "${targetUser.username}" (${targetUser.fullName}).`
    );

    return { success: true };
  };

  const toggleUserStatus = (id: string) => {
    if (!hasPermission(currentUser, 'canManageUsers')) return;
    if (currentUser?.id === id) return; // Prevent self lock

    setUsers(prev =>
      prev.map(u => {
        if (u.id === id) {
          const newStatus = u.status === 'active' ? 'suspended' : 'active';
          logAudit(
            'TOGGLE_USER_STATUS',
            'user',
            id,
            `Admin changed user "${u.username}" status to ${newStatus.toUpperCase()}.`
          );
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
  };

  const resetUserPassword = (id: string, newPassword: string) => {
    if (!hasPermission(currentUser, 'canManageUsers')) return;
    setUsers(prev =>
      prev.map(u => {
        if (u.id === id) {
          logAudit(
            'RESET_PASSWORD',
            'user',
            id,
            `Admin reset password for user "${u.username}".`
          );
          return { ...u, passwordHash: newPassword };
        }
        return u;
      })
    );
  };

  // Invoices & Payment Automation
  const createInvoice = (invoiceData: Partial<Invoice>): Invoice => {
    if (!hasPermission(currentUser, 'canCreateInvoice')) {
      throw new Error('Permission denied: You do not have permissions to create invoices.');
    }

    const nextNumber = invoices.length + 1;
    const generatedId = invoiceData.id || `INV-2026-${String(nextNumber).padStart(3, '0')}`;

    const items = invoiceData.items && invoiceData.items.length > 0
      ? invoiceData.items
      : [];

    const issueDate = invoiceData.issueDate || getTodayString();
    let dueDate = invoiceData.dueDate;

    if (!dueDate) {
      // Net 30 default calculation
      const d = new Date(issueDate + 'T00:00:00');
      d.setDate(d.getDate() + 30);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dueDate = `${year}-${month}-${day}`;
    }

    const requestedStatus = invoiceData.status || 'paid';
    const isPaidInFull = requestedStatus === 'paid';

    const financials = recalculateInvoiceFinancials(
      items,
      invoiceData.shippingFee || 0,
      [],
      requestedStatus,
      dueDate,
      false
    );

    const initialPayments: PaymentRecord[] = isPaidInFull && financials.total > 0
      ? [
          {
            id: 'pay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            invoiceId: generatedId,
            amount: financials.total,
            paymentDate: issueDate,
            paymentMethod: 'cash',
            reference: 'Counter / Paid in Full',
            notes: 'Auto-recorded payment upon invoice generation (₨ 0 Due Balance).',
            recordedBy: currentUser?.fullName || currentUser?.username || 'Staff',
            recordedAt: new Date().toISOString(),
          },
        ]
      : [];

    const newInvoice: Invoice = {
      id: generatedId,
      title: invoiceData.title || 'Official Commercial Invoice',
      clientId: invoiceData.clientId || (clients[0] ? clients[0].id : 'cli_' + Date.now().toString().slice(-5)),
      clientName: invoiceData.clientName || 'Walk-in Customer',
      clientEmail: invoiceData.clientEmail || '',
      clientAddress: invoiceData.clientAddress || '',
      clientTaxId: invoiceData.clientTaxId || '',
      issueDate,
      dueDate,
      paymentTerms: invoiceData.paymentTerms || 'due_on_receipt',
      items: financials.items,
      subtotal: financials.subtotal,
      taxTotal: financials.taxTotal,
      discountTotal: financials.discountTotal,
      shippingFee: invoiceData.shippingFee || 0,
      total: financials.total,
      amountPaid: isPaidInFull ? financials.total : 0,
      amountDue: isPaidInFull ? 0 : financials.total,
      status: isPaidInFull ? 'paid' : (invoiceData.status || financials.status),
      notes: invoiceData.notes || company.paymentInstructions,
      terms: invoiceData.terms || 'Payment completed. Thank you for your business.',
      currency: invoiceData.currency || company.defaultCurrency,
      createdBy: currentUser?.id || 'usr_unknown',
      createdByName: currentUser?.fullName || currentUser?.username || 'Staff',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payments: initialPayments,
      remindersSentCount: 0,
      lastReminderAt: null,
      autoStatusEnabled: false,
    };

    setInvoices(prev => [newInvoice, ...prev]);
    logAudit(
      'CREATE_INVOICE',
      'invoice',
      newInvoice.id,
      `User ${currentUser?.username} created invoice ${newInvoice.id} for ₨ ${newInvoice.total.toLocaleString()} (PAID - ₨ 0 BALANCE DUE).`
    );

    return newInvoice;
  };

  const updateInvoice = (id: string, invoiceData: Partial<Invoice>) => {
    if (!hasPermission(currentUser, 'canEditInvoice')) {
      logAudit(
        'SECURITY_EDIT_BLOCKED',
        'invoice',
        id,
        `Blocked edit attempt by user ${currentUser?.username} (${currentUser?.role}) on invoice ${id}. Role policy forbids editing previous invoices.`
      );
      return;
    }

    setInvoices(prev =>
      prev.map(inv => {
        if (inv.id !== id) return inv;

        const mergedItems = invoiceData.items || inv.items;
        const mergedShipping = invoiceData.shippingFee !== undefined ? invoiceData.shippingFee : inv.shippingFee;
        const mergedDueDate = invoiceData.dueDate || inv.dueDate;
        const mergedPayments = invoiceData.payments || inv.payments;
        const targetStatus = invoiceData.status || inv.status;
        const autoEnabled = invoiceData.autoStatusEnabled !== undefined ? invoiceData.autoStatusEnabled : inv.autoStatusEnabled;

        const financials = recalculateInvoiceFinancials(
          mergedItems,
          mergedShipping,
          mergedPayments,
          targetStatus,
          mergedDueDate,
          autoEnabled
        );

        const updated: Invoice = {
          ...inv,
          ...invoiceData,
          items: financials.items,
          subtotal: financials.subtotal,
          taxTotal: financials.taxTotal,
          discountTotal: financials.discountTotal,
          total: financials.total,
          amountPaid: financials.amountPaid,
          amountDue: financials.amountDue,
          status: financials.status,
          updatedAt: new Date().toISOString(),
        };

        logAudit(
          'UPDATE_INVOICE',
          'invoice',
          id,
          `User ${currentUser?.username} updated invoice ${id}. New balance: ₨ ${financials.amountDue.toLocaleString()}.`
        );

        return updated;
      })
    );
  };

  const deleteInvoice = (id: string): boolean => {
    if (!hasPermission(currentUser, 'canDeleteInvoice')) {
      return false;
    }

    setInvoices(prev => prev.filter(inv => inv.id !== id));
    logAudit('DELETE_INVOICE', 'invoice', id, `Admin ${currentUser?.username} deleted invoice ${id}.`);
    return true;
  };

  const recordPayment = (
    invoiceId: string,
    payment: {
      amount: number;
      paymentDate: string;
      paymentMethod: PaymentRecord['paymentMethod'];
      reference: string;
      notes?: string;
    }
  ) => {
    if (!hasPermission(currentUser, 'canRecordPayments')) {
      return { success: false, message: 'Permission denied: Your role cannot record payments.' };
    }

    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) {
      return { success: false, message: 'Invoice not found.' };
    }

    if (payment.amount <= 0) {
      return { success: false, message: 'Payment amount must be greater than 0.' };
    }

    const newPaymentRecord: PaymentRecord = {
      id: 'pay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      invoiceId,
      amount: Math.round(payment.amount * 100) / 100,
      paymentDate: payment.paymentDate || getTodayString(),
      paymentMethod: payment.paymentMethod,
      reference: payment.reference.trim() || `REF-${Date.now().toString().slice(-6)}`,
      notes: payment.notes || '',
      recordedBy: currentUser?.username || 'admin',
      recordedAt: new Date().toISOString(),
    };

    const updatedPayments = [...inv.payments, newPaymentRecord];
    const financials = recalculateInvoiceFinancials(
      inv.items,
      inv.shippingFee,
      updatedPayments,
      inv.status,
      inv.dueDate,
      inv.autoStatusEnabled
    );

    const oldStatus = inv.status;
    const newStatus = financials.status;

    setInvoices(prev =>
      prev.map(i => {
        if (i.id === invoiceId) {
          return {
            ...i,
            payments: updatedPayments,
            amountPaid: financials.amountPaid,
            amountDue: financials.amountDue,
            status: newStatus,
            updatedAt: new Date().toISOString(),
          };
        }
        return i;
      })
    );

    logAudit(
      'RECORD_PAYMENT',
      'payment',
      invoiceId,
      `User ${currentUser?.username} recorded payment of ₨ ${newPaymentRecord.amount.toLocaleString()} on ${invoiceId} via ${newPaymentRecord.paymentMethod.toUpperCase()}. Status updated to ${newStatus.toUpperCase()}.`
    );

    return {
      success: true,
      message: `Payment of ₨ ${newPaymentRecord.amount.toLocaleString()} recorded. Status automatically updated to ${newStatus.toUpperCase()}.`,
    };
  };

  const sendInvoice = (id: string) => {
    setInvoices(prev =>
      prev.map(inv => {
        if (inv.id === id) {
          const newStatus = inv.amountDue <= 0 ? 'paid' : (inv.dueDate < getTodayString() ? 'overdue' : 'sent');
          logAudit('SEND_INVOICE', 'invoice', id, `Invoice ${id} marked as dispatched to ${inv.clientEmail}. Status: ${newStatus.toUpperCase()}.`);
          return {
            ...inv,
            status: newStatus,
            updatedAt: new Date().toISOString(),
          };
        }
        return inv;
      })
    );
  };

  const cancelInvoice = (id: string) => {
    setInvoices(prev =>
      prev.map(inv => {
        if (inv.id === id) {
          logAudit('CANCEL_INVOICE', 'invoice', id, `User ${currentUser?.username} cancelled invoice ${id}.`);
          return { ...inv, status: 'cancelled', updatedAt: new Date().toISOString() };
        }
        return inv;
      })
    );
  };

  const duplicateInvoice = (id: string): Invoice => {
    const existing = invoices.find(i => i.id === id);
    if (!existing) throw new Error('Invoice not found');

    const nextNum = invoices.length + 1;
    const newId = `INV-2026-${String(nextNum).padStart(3, '0')}`;
    const today = getTodayString();

    const d = new Date(today + 'T00:00:00');
    d.setDate(d.getDate() + 30);
    const newDueDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const newInv: Invoice = {
      ...existing,
      id: newId,
      title: `${existing.title || 'Invoice'} (Copy)`,
      issueDate: today,
      dueDate: newDueDate,
      status: 'draft',
      amountPaid: 0,
      amountDue: existing.total,
      payments: [],
      remindersSentCount: 0,
      lastReminderAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUser?.id || 'usr',
      createdByName: currentUser?.fullName || currentUser?.username || 'Staff',
    };

    setInvoices(prev => [newInv, ...prev]);
    logAudit('DUPLICATE_INVOICE', 'invoice', newId, `Duplicated from ${id} as draft ${newId}.`);
    return newInv;
  };

  const runAutoStatusCheck = () => {
    const auditResult = runAutomatedPaymentAudit(
      invoices,
      currentUser?.id || 'system_auto',
      currentUser?.username || 'Auto-Billing Engine'
    );

    if (auditResult.changedInvoices.length > 0) {
      setInvoices(auditResult.updatedInvoices);
      setAuditLogs(prev => [...auditResult.auditLogs, ...prev]);
    }
    setLastAutoAuditTime(new Date().toLocaleTimeString());

    return {
      changedCount: auditResult.changedInvoices.length,
      message: auditResult.changedInvoices.length > 0
        ? `Automatic check complete: ${auditResult.changedInvoices.length} invoice(s) auto-updated based on calendar dates & balances.`
        : 'All invoice payment statuses are fully up to date.',
    };
  };

  const sendPaymentReminders = (targetIds?: string[]) => {
    const today = getTodayString();
    let count = 0;
    const titles: string[] = [];

    setInvoices(prev =>
      prev.map(inv => {
        const matchesTarget = !targetIds || targetIds.includes(inv.id);
        const isEligible = (inv.status === 'overdue' || inv.status === 'partially_paid' || inv.status === 'sent') && inv.amountDue > 0;

        if (matchesTarget && isEligible) {
          count++;
          titles.push(`${inv.id} (${inv.clientName})`);
          logAudit(
            'SEND_REMINDER',
            'invoice',
            inv.id,
            `Automated payment reminder dispatched to ${inv.clientEmail} for balance $${inv.amountDue.toFixed(2)}.`
          );
          return {
            ...inv,
            remindersSentCount: (inv.remindersSentCount || 0) + 1,
            lastReminderAt: new Date().toISOString(),
          };
        }
        return inv;
      })
    );

    return { remindersSent: count, invoiceTitles: titles };
  };

  // Clients
  const createClient = (clientData: Omit<Client, 'id' | 'createdAt'>): Client => {
    const newClient: Client = {
      ...clientData,
      id: 'cli_' + Date.now().toString().slice(-6),
      createdAt: new Date().toISOString(),
    };
    setClients(prev => [newClient, ...prev]);
    logAudit('CREATE_CLIENT', 'client', newClient.id, `Created client record "${newClient.company || newClient.name}".`);
    return newClient;
  };

  const updateClient = (id: string, clientData: Partial<Client>) => {
    setClients(prev =>
      prev.map(c => (c.id === id ? { ...c, ...clientData } : c))
    );
    logAudit('UPDATE_CLIENT', 'client', id, `Updated client ${id}.`);
  };

  const deleteClient = (id: string): boolean => {
    // Check if client has invoices
    const hasInvoices = invoices.some(i => i.clientId === id);
    if (hasInvoices) return false;
    setClients(prev => prev.filter(c => c.id !== id));
    logAudit('DELETE_CLIENT', 'client', id, `Deleted client ${id}.`);
    return true;
  };

  // Catalog
  const createCatalogItem = (item: Omit<CatalogItem, 'id'>): CatalogItem => {
    const newItem: CatalogItem = {
      ...item,
      id: 'cat_' + Date.now().toString().slice(-6),
    };
    setCatalog(prev => [newItem, ...prev]);
    logAudit('CREATE_CATALOG_ITEM', 'settings', newItem.id, `Added catalog product/service "${newItem.name}".`);
    return newItem;
  };

  const updateCatalogItem = (id: string, item: Partial<CatalogItem>) => {
    setCatalog(prev => prev.map(c => (c.id === id ? { ...c, ...item } : c)));
  };

  const deleteCatalogItem = (id: string) => {
    setCatalog(prev => prev.filter(c => c.id !== id));
  };

  // Company Profile & Settings
  const updateCompanyProfile = (profile: Partial<CompanyProfile>) => {
    setCompany(prev => ({ ...prev, ...profile }));
    logAudit('UPDATE_SETTINGS', 'settings', 'company', `Updated business profile and payment instructions.`);
  };

  const resetToDefaults = () => {
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setInvoices(INITIAL_INVOICES);
    setClients(INITIAL_CLIENTS);
    setCatalog(INITIAL_CATALOG);
    setCompany(INITIAL_COMPANY);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    localStorage.clear();
    logAudit('RESET_SYSTEM', 'system', 'sys_root', `Restored system state to default initial configuration.`);
  };

  const exportDataJson = (): string => {
    const data = {
      exportedAt: new Date().toISOString(),
      users,
      invoices,
      clients,
      catalog,
      company,
      auditLogs,
    };
    return JSON.stringify(data, null, 2);
  };

  return (
    <BillingContext.Provider
      value={{
        currentUser,
        users,
        invoices,
        clients,
        catalog,
        company,
        auditLogs,
        lastAutoAuditTime,
        login,
        logout,
        switchUser,
        createUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        resetUserPassword,
        createInvoice,
        updateInvoice,
        deleteInvoice,
        recordPayment,
        sendInvoice,
        cancelInvoice,
        duplicateInvoice,
        runAutoStatusCheck,
        sendPaymentReminders,
        createClient,
        updateClient,
        deleteClient,
        createCatalogItem,
        updateCatalogItem,
        deleteCatalogItem,
        updateCompanyProfile,
        resetToDefaults,
        exportDataJson,
      }}
    >
      {children}
    </BillingContext.Provider>
  );
};

export function useBilling() {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
}
