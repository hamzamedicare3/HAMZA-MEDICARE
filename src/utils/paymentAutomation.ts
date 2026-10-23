import { AuditLogEntry, Invoice, InvoiceStatus, LineItem, PaymentRecord } from '../types';

/**
 * Returns today's date formatted as YYYY-MM-DD in local time
 */
export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates days difference between target date and today
 * Positive value = overdue by N days
 * Negative value = N days remaining until due
 */
export function getDaysOverdue(dueDateStr: string, referenceDateStr: string = getTodayString()): number {
  if (!dueDateStr) return 0;
  const due = new Date(dueDateStr + 'T00:00:00');
  const ref = new Date(referenceDateStr + 'T00:00:00');
  const diffTime = ref.getTime() - due.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Recalculates all financial totals for an invoice
 */
export function recalculateInvoiceFinancials(
  items: LineItem[],
  shippingFee: number = 0,
  payments: PaymentRecord[] = [],
  currentStatus: InvoiceStatus = 'draft',
  dueDate: string = '',
  autoStatusEnabled: boolean = true
): {
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  status: InvoiceStatus;
  items: LineItem[];
} {
  let subtotal = 0;
  let taxTotal = 0;
  let discountTotal = 0;

  const updatedItems = items.map(item => {
    const rawTotal = item.quantity * item.unitPrice;
    const discountAmount = rawTotal * ((item.discountPercent || 0) / 100);
    const discountedTotal = rawTotal - discountAmount;
    const taxAmount = discountedTotal * ((item.taxPercent || 0) / 100);
    const lineTotal = Math.round((discountedTotal + taxAmount) * 100) / 100;

    subtotal += rawTotal;
    discountTotal += discountAmount;
    taxTotal += taxAmount;

    return {
      ...item,
      total: lineTotal,
    };
  });

  subtotal = Math.round(subtotal * 100) / 100;
  discountTotal = Math.round(discountTotal * 100) / 100;
  taxTotal = Math.round(taxTotal * 100) / 100;
  const shipping = Math.round((shippingFee || 0) * 100) / 100;
  const total = Math.max(0, Math.round((subtotal - discountTotal + taxTotal + shipping) * 100) / 100);

  const amountPaid = Math.round(
    payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0) * 100
  ) / 100;

  const amountDue = Math.max(0, Math.round((total - amountPaid) * 100) / 100);

  let newStatus = currentStatus;

  if (autoStatusEnabled) {
    newStatus = determineAutomaticStatus(currentStatus, total, amountPaid, amountDue, dueDate);
  }

  return {
    subtotal,
    taxTotal,
    discountTotal,
    total,
    amountPaid,
    amountDue,
    status: newStatus,
    items: updatedItems,
  };
}

/**
 * Automatic Status Determination Algorithm:
 * - If cancelled or draft: stays as is unless explicitly sent
 * - If amountDue <= 0.005 and total > 0: 'paid'
 * - If amountPaid > 0 and amountDue > 0:
 *     - If dueDate < today: 'overdue' (or partially_paid with overdue alert)
 *     - If dueDate >= today: 'partially_paid'
 * - If amountPaid === 0:
 *     - If dueDate < today: 'overdue'
 *     - If dueDate >= today and status was sent/overdue: 'sent'
 */
export function determineAutomaticStatus(
  currentStatus: InvoiceStatus,
  total: number,
  amountPaid: number,
  amountDue: number,
  dueDate: string
): InvoiceStatus {
  // If draft or cancelled, do not auto-advance unless requested
  if (currentStatus === 'draft' || currentStatus === 'cancelled') {
    return currentStatus;
  }

  // Full payment complete
  if (total > 0 && amountDue <= 0.005) {
    return 'paid';
  }

  const today = getTodayString();
  const isPastDue = dueDate ? dueDate < today : false;

  // Partial payment received
  if (amountPaid > 0 && amountDue > 0.005) {
    if (isPastDue) {
      // It has overdue unpaid balance
      return 'overdue';
    }
    return 'partially_paid';
  }

  // Zero payments received
  if (amountPaid <= 0.005) {
    if (isPastDue) {
      return 'overdue';
    }
    return 'sent';
  }

  return currentStatus;
}

/**
 * Scans all invoices in the system and automatically updates statuses
 * based on the current calendar date and payments received.
 */
export function runAutomatedPaymentAudit(
  invoices: Invoice[],
  systemUserId: string = 'system_automator',
  systemUsername: string = 'Auto-Billing Engine'
): {
  updatedInvoices: Invoice[];
  changedInvoices: { id: string; oldStatus: InvoiceStatus; newStatus: InvoiceStatus; reason: string }[];
  auditLogs: AuditLogEntry[];
} {
  const today = getTodayString();
  const changedInvoices: { id: string; oldStatus: InvoiceStatus; newStatus: InvoiceStatus; reason: string }[] = [];
  const auditLogs: AuditLogEntry[] = [];

  const updatedInvoices = invoices.map(invoice => {
    if (!invoice.autoStatusEnabled || invoice.status === 'draft' || invoice.status === 'cancelled') {
      return invoice;
    }

    const { status: calculatedStatus, amountDue, amountPaid } = recalculateInvoiceFinancials(
      invoice.items,
      invoice.shippingFee,
      invoice.payments,
      invoice.status,
      invoice.dueDate,
      true
    );

    if (calculatedStatus !== invoice.status) {
      let reason = '';
      if (calculatedStatus === 'overdue') {
        const days = getDaysOverdue(invoice.dueDate, today);
        reason = `Auto-detected overdue: Invoice due date was ${invoice.dueDate} (${days} days ago) with ₨ ${amountDue.toLocaleString()} unpaid.`;
      } else if (calculatedStatus === 'paid') {
        reason = `Auto-marked Paid: Full balance received (₨ ${amountPaid.toLocaleString()} / ₨ ${invoice.total.toLocaleString()}).`;
      } else if (calculatedStatus === 'partially_paid') {
        reason = `Auto-updated to Partially Paid: Received ₨ ${amountPaid.toLocaleString()}, remaining balance ₨ ${amountDue.toLocaleString()}.`;
      } else if (calculatedStatus === 'sent') {
        reason = `Auto-restored to Sent: Due date is active on ${invoice.dueDate}.`;
      }

      changedInvoices.push({
        id: invoice.id,
        oldStatus: invoice.status,
        newStatus: calculatedStatus,
        reason,
      });

      auditLogs.push({
        id: 'audit_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        timestamp: new Date().toISOString(),
        userId: systemUserId,
        username: systemUsername,
        action: 'AUTO_STATUS_CHANGE',
        entityType: 'invoice',
        entityId: invoice.id,
        details: `Automatic Status Transition: ${invoice.status.toUpperCase()} -> ${calculatedStatus.toUpperCase()} (${reason})`,
      });

      return {
        ...invoice,
        status: calculatedStatus,
        amountDue,
        amountPaid,
        updatedAt: new Date().toISOString(),
      };
    }

    return invoice;
  });

  return {
    updatedInvoices,
    changedInvoices,
    auditLogs,
  };
}

/**
 * Calculates Accounts Receivable Aging breakdown
 */
export interface AgingReport {
  current: number; // 0 days overdue (not due yet)
  days1To30: number; // 1-30 days overdue
  days31To60: number; // 31-60 days overdue
  days61To90: number; // 61-90 days overdue
  days90Plus: number; // 90+ days overdue
  totalReceivable: number;
}

export function calculateAgingReport(invoices: Invoice[]): AgingReport {
  const report: AgingReport = {
    current: 0,
    days1To30: 0,
    days31To60: 0,
    days61To90: 0,
    days90Plus: 0,
    totalReceivable: 0,
  };

  invoices.forEach(inv => {
    if (inv.status === 'cancelled' || inv.status === 'paid' || inv.status === 'draft') return;
    if (inv.amountDue <= 0) return;

    report.totalReceivable += inv.amountDue;
    const daysOverdue = getDaysOverdue(inv.dueDate);

    if (daysOverdue === 0) {
      report.current += inv.amountDue;
    } else if (daysOverdue <= 30) {
      report.days1To30 += inv.amountDue;
    } else if (daysOverdue <= 60) {
      report.days31To60 += inv.amountDue;
    } else if (daysOverdue <= 90) {
      report.days61To90 += inv.amountDue;
    } else {
      report.days90Plus += inv.amountDue;
    }
  });

  // Round all report values
  (Object.keys(report) as (keyof AgingReport)[]).forEach(k => {
    report[k] = Math.round(report[k] * 100) / 100;
  });

  return report;
}
