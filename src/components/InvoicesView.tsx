import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle,
  Clock,
  Copy,
  DollarSign,
  Download,
  Eye,
  FileEdit,
  FilePlus,
  Filter,
  Lock,
  Mail,
  MoreVertical,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  Send,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useBilling } from '../context/BillingContext';
import { Invoice, InvoiceStatus } from '../types';
import { formatPKR } from '../utils/currency';
import { getDaysOverdue } from '../utils/paymentAutomation';
import { hasPermission } from '../utils/rbac';
import { ThermalReceiptModal } from './ThermalReceiptModal';

interface InvoicesViewProps {
  onOpenCreateInvoice: () => void;
  onViewInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onPayInvoice: (invoice: Invoice) => void;
  onPrintThermal?: (invoice: Invoice) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  onOpenCreateInvoice,
  onViewInvoice,
  onEditInvoice,
  onPayInvoice,
}) => {
  const {
    invoices,
    currentUser,
    deleteInvoice,
    sendInvoice,
    cancelInvoice,
    duplicateInvoice,
    runAutoStatusCheck,
    sendPaymentReminders,
  } = useBilling();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'due_desc'>('date_desc');
  const [notice, setNotice] = useState<string | null>(null);
  const [thermalInvoice, setThermalInvoice] = useState<Invoice | null>(null);

  const canCreate = hasPermission(currentUser, 'canCreateInvoice');
  const canDelete = hasPermission(currentUser, 'canDeleteInvoice');
  const canPay = hasPermission(currentUser, 'canRecordPayments');
  const canEdit = hasPermission(currentUser, 'canEditInvoice');

  // Filtered and sorted invoices
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(inv => {
        if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
          inv.id.toLowerCase().includes(q) ||
          inv.clientName.toLowerCase().includes(q) ||
          (inv.title && inv.title.toLowerCase().includes(q)) ||
          inv.clientEmail.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') {
          return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
        }
        if (sortBy === 'date_asc') {
          return new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
        }
        if (sortBy === 'amount_desc') {
          return b.total - a.total;
        }
        if (sortBy === 'due_desc') {
          return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
        }
        return 0;
      });
  }, [invoices, statusFilter, searchTerm, sortBy]);

  const handleRunAudit = () => {
    const res = runAutoStatusCheck();
    setNotice(res.message);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleSendReminders = () => {
    const res = sendPaymentReminders();
    setNotice(`Dispatched automated payment notices for ${res.remindersSent} pending/overdue invoices.`);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleDelete = (inv: Invoice) => {
    if (window.confirm(`Delete invoice ${inv.id}? This will permanently remove it from the ledger.`)) {
      deleteInvoice(inv.id);
      setNotice(`Invoice ${inv.id} deleted.`);
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const renderStatusBadge = (inv: Invoice) => {
    const days = getDaysOverdue(inv.dueDate);
    switch (inv.status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3" />
            <span>Paid (ادا شدہ)</span>
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3" />
            <span>Overdue · {days}d</span>
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            <span>Partially Paid</span>
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Send className="w-3 h-3" />
            <span>Sent</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-500">
            <XCircle className="w-3 h-3" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600">
            <span>Draft</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Invoices &amp; Thermal Billing (PKR)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Auto-tracking payment status in Pakistani Rupees (₨) with 80mm/58mm thermal receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRunAudit}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
            title="Evaluate payment statuses based on today's calendar date"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-Check Statuses</span>
          </button>

          <button
            type="button"
            onClick={handleSendReminders}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-medium border border-amber-200 transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-amber-600" />
            <span>Dispatch Reminders</span>
          </button>

          {canCreate && (
            <button
              type="button"
              onClick={onOpenCreateInvoice}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <FilePlus className="w-4 h-4" />
              <span>Create New Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Operator Security Guard Notice */}
      {!canEdit && currentUser?.role === 'operator' && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            <strong>Operator Policy Active:</strong> You have permission to generate new invoices and print thermal receipts, but previously saved invoices are locked to prevent tampering.
          </span>
        </div>
      )}

      {notice && (
        <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-center justify-between">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="font-bold text-slate-400 hover:text-slate-600">
            ×
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Invoices' },
            { id: 'overdue', label: 'Overdue' },
            { id: 'partially_paid', label: 'Partially Paid' },
            { id: 'sent', label: 'Sent' },
            { id: 'paid', label: 'Paid' },
            { id: 'draft', label: 'Draft' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoice or client..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 sm:w-60"
            />
          </div>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="date_desc">Latest Issue Date</option>
            <option value="date_asc">Oldest Issue Date</option>
            <option value="amount_desc">Highest Amount (PKR)</option>
            <option value="due_desc">Due Date (Urgent)</option>
          </select>
        </div>
      </div>

      {/* Invoices Master Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-5 py-3.5">Billed To &amp; Subject</th>
                <th className="px-5 py-3.5">Issue &amp; Due Date</th>
                <th className="px-5 py-3.5">Payment Status</th>
                <th className="px-5 py-3.5 text-right">Total (PKR)</th>
                <th className="px-5 py-3.5 text-right">Balance Due</th>
                <th className="px-5 py-3.5 text-right">POS / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-slate-400">
                    No invoices matching the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => {
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-xs text-indigo-700 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onViewInvoice(inv)}
                          className="hover:underline"
                        >
                          {inv.id}
                        </button>
                      </td>

                      <td className="px-5 py-3.5 max-w-xs">
                        <div className="font-semibold text-slate-900 text-xs truncate">
                          {inv.clientName}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {inv.title || 'Invoice for Services'}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="text-xs text-slate-700 font-mono">
                          {inv.issueDate}
                        </div>
                        <div className={`text-[11px] font-mono ${inv.status === 'overdue' ? 'text-rose-600 font-semibold' : 'text-slate-400'}`}>
                          Due {inv.dueDate}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {renderStatusBadge(inv)}
                      </td>

                      <td className="px-5 py-3.5 text-right font-mono-nums font-semibold text-slate-900 text-xs">
                        {formatPKR(inv.total)}
                      </td>

                      <td className="px-5 py-3.5 text-right whitespace-nowrap font-mono-nums text-xs">
                        {inv.amountDue <= 0 ? (
                          <span className="text-emerald-600 font-semibold">Rs. 0</span>
                        ) : (
                          <span className={`font-bold ${inv.status === 'overdue' ? 'text-rose-600' : 'text-slate-800'}`}>
                            {formatPKR(inv.amountDue)}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1-Click Thermal Receipt Generator */}
                          <button
                            type="button"
                            onClick={() => setThermalInvoice(inv)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded transition-colors"
                            title="Generate 80mm/58mm POS Thermal Receipt"
                          >
                            <Receipt className="w-3.5 h-3.5 text-amber-700" />
                            <span>Thermal</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onViewInvoice(inv)}
                            className="px-2 py-1 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors"
                            title="View A4 Printable Document"
                          >
                            View
                          </button>

                          {canPay && inv.amountDue > 0 && inv.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => onPayInvoice(inv)}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
                              title="Record payment receipt"
                            >
                              Pay
                            </button>
                          )}

                          {canEdit ? (
                            <button
                              type="button"
                              onClick={() => onEditInvoice(inv)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded"
                              title="Edit invoice"
                            >
                              <FileEdit className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span
                              className="p-1 text-slate-300 cursor-not-allowed"
                              title="Editing existing invoices is restricted to Administrators"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(inv)}
                              className="p-1 text-rose-400 hover:text-rose-600 rounded"
                              title="Delete invoice (Admin only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Direct Thermal Receipt Modal */}
      {thermalInvoice && (
        <ThermalReceiptModal
          invoice={thermalInvoice}
          onClose={() => setThermalInvoice(null)}
        />
      )}
    </div>
  );
};
