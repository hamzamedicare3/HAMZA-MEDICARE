import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowDownCircle,
  Building,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Mail,
  Printer,
  Receipt,
  Send,
  Shield,
  X,
} from 'lucide-react';
import { useBilling } from '../context/BillingContext';
import { Invoice } from '../types';
import { formatPKR } from '../utils/currency';
import { getDaysOverdue } from '../utils/paymentAutomation';
import { hasPermission } from '../utils/rbac';
import { PaymentModal } from './PaymentModal';
import { ThermalReceiptModal } from './ThermalReceiptModal';

interface InvoiceDetailModalProps {
  invoice: Invoice;
  onClose: () => void;
  onEdit?: (invoice: Invoice) => void;
  onOpenThermal?: (invoice: Invoice) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  onClose,
  onEdit,
  onOpenThermal,
}) => {
  const { company, currentUser, sendPaymentReminders, sendInvoice, invoices } = useBilling();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showThermalModal, setShowThermalModal] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Re-fetch current invoice state to ensure reactive updates after payment
  const currentInvoice = invoices.find(i => i.id === invoice.id) || invoice;

  const daysOverdue = getDaysOverdue(currentInvoice.dueDate);
  const canPay = hasPermission(currentUser, 'canRecordPayments') && currentInvoice.amountDue > 0;
  const canEdit = hasPermission(currentUser, 'canEditInvoice') && currentInvoice.status !== 'paid';

  const handlePrint = () => {
    window.print();
  };

  const handleSendReminder = () => {
    sendPaymentReminders([currentInvoice.id]);
    setActionNotice(`Automated payment reminder dispatched to ${currentInvoice.clientEmail}.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleDispatch = () => {
    sendInvoice(currentInvoice.id);
    setActionNotice(`Invoice ${currentInvoice.id} marked as sent to client.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const getStatusBadge = () => {
    switch (currentInvoice.status) {
      case 'paid':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider border border-emerald-300">
            <CheckCircle className="w-4 h-4 text-emerald-700" />
            <span>PAID IN FULL (ادا شدہ)</span>
          </div>
        );
      case 'overdue':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider border border-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-700" />
            <span>OVERDUE · {daysOverdue} DAYS PAST DUE</span>
          </div>
        );
      case 'partially_paid':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider border border-amber-300">
            <Clock className="w-4 h-4 text-amber-700" />
            <span>PARTIALLY PAID</span>
          </div>
        );
      case 'sent':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-sky-100 text-sky-800 text-xs font-bold uppercase tracking-wider border border-sky-300">
            <Send className="w-4 h-4 text-sky-700" />
            <span>SENT · DUE {currentInvoice.dueDate}</span>
          </div>
        );
      case 'cancelled':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider">
            <span>CANCELLED</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
            <span>DRAFT</span>
          </div>
        );
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
        <div className="bg-white rounded-2xl max-w-3xl w-full my-8 shadow-2xl border border-slate-200 overflow-hidden print:border-none print:shadow-none print:m-0 print:max-w-none">
          {/* Header Action Bar (Hidden in Print) */}
          <div className="no-print px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                {currentInvoice.id}
              </span>
              <span className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
                {currentInvoice.title || 'Official Commercial Invoice'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Thermal Receipt Button */}
              <button
                type="button"
                onClick={() => setShowThermalModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-xs font-semibold text-slate-950 transition-colors shadow-xs"
                title="Print 80mm / 58mm POS thermal receipt"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Thermal Receipt</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
                title="Print A4 PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">A4 Invoice</span>
              </button>

              {currentInvoice.status === 'draft' && (
                <button
                  type="button"
                  onClick={handleDispatch}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              )}

              {canPay && (
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Record Pay</span>
                </button>
              )}

              {canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    if (onEdit) onEdit(currentInvoice);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
                >
                  Edit
                </button>
              )}

              {!canEdit && currentUser?.role === 'operator' && (
                <span className="text-[10px] text-amber-400 bg-amber-950/60 px-2 py-1 rounded border border-amber-800 font-mono">
                  Operator: Edit Locked
                </span>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {actionNotice && (
            <div className="no-print p-3 bg-emerald-50 text-emerald-800 text-xs flex items-center justify-between border-b border-emerald-200">
              <span>{actionNotice}</span>
              <button type="button" onClick={() => setActionNotice(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Printable Document Body */}
          <div className="p-8 sm:p-12 text-slate-900 bg-white">
            {/* Top Company & Invoice ID Lockup */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-8 border-b border-slate-200">
              <div>
                <div className="mb-2">
                  <span className="text-xl font-bold tracking-tight text-slate-900">
                    {company.name}
                  </span>
                </div>
                <div className="text-xs text-slate-500 space-y-0.5">
                  <p>{company.address}</p>
                  <p>{company.email} · {company.phone}</p>
                  <p className="font-mono text-slate-700 font-semibold">{company.taxId}</p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">
                  INVOICE / بل
                </h1>
                <p className="font-mono font-bold text-sm text-indigo-700 mt-0.5">
                  #{currentInvoice.id}
                </p>
                <div className="mt-3">
                  {getStatusBadge()}
                </div>
              </div>
            </div>

            {/* Billing Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b border-slate-200 text-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Billed To
                </span>
                <p className="font-bold text-base text-slate-900">{currentInvoice.clientName}</p>
              </div>

              <div className="sm:text-right space-y-1.5">
                <div>
                  <span className="text-slate-400">Issue Date:</span>{' '}
                  <span className="font-semibold text-slate-800 font-mono">{currentInvoice.issueDate}</span>
                </div>
                <div>
                  <span className="text-slate-400">Due Date:</span>{' '}
                  <span className={`font-semibold font-mono ${currentInvoice.status === 'overdue' ? 'text-rose-600 font-bold' : 'text-slate-800'}`}>
                    {currentInvoice.dueDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Payment Terms:</span>{' '}
                  <span className="font-medium text-slate-700 uppercase">{currentInvoice.paymentTerms.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-slate-400">Operator / Cashier:</span>{' '}
                  <span className="font-medium text-slate-700">{currentInvoice.createdByName || 'Staff'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Currency:</span>{' '}
                  <span className="font-mono font-bold text-indigo-700">PKR (Pakistani Rupee)</span>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="py-6">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-900 text-slate-900 font-bold uppercase tracking-wider">
                    <th className="py-3 pr-4">Description</th>
                    <th className="py-3 px-3 text-right">Qty</th>
                    <th className="py-3 px-3 text-right">Unit Price (PKR)</th>
                    <th className="py-3 px-3 text-right">Tax (GST)</th>
                    <th className="py-3 pl-3 text-right">Total (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {currentInvoice.items.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="py-3.5 pr-4">
                        <p className="font-semibold text-slate-900">{item.description}</p>
                        {item.discountPercent > 0 && (
                          <span className="text-[11px] text-emerald-600">
                            {item.discountPercent}% discount applied
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono-nums text-slate-700">
                        {item.quantity}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono-nums text-slate-700">
                        {formatPKR(item.unitPrice)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono-nums text-slate-500">
                        {item.taxPercent > 0 ? `${item.taxPercent}%` : '—'}
                      </td>
                      <td className="py-3.5 pl-3 text-right font-mono-nums font-semibold text-slate-900">
                        {formatPKR(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-8 pt-4 pb-8 border-t border-slate-200 text-xs">
              <div className="max-w-xs space-y-3">
                {currentInvoice.notes && (
                  <div>
                    <span className="font-bold text-slate-700 block mb-0.5">Notes:</span>
                    <p className="text-slate-500 leading-relaxed text-[11px]">{currentInvoice.notes}</p>
                  </div>
                )}
              </div>

              <div className="w-full sm:w-72 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono-nums">{formatPKR(currentInvoice.subtotal)}</span>
                </div>
                {currentInvoice.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span className="font-mono-nums">-{formatPKR(currentInvoice.discountTotal)}</span>
                  </div>
                )}
                {currentInvoice.taxTotal > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tax (GST):</span>
                    <span className="font-mono-nums">{formatPKR(currentInvoice.taxTotal)}</span>
                  </div>
                )}
                {currentInvoice.shippingFee > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Shipping / TCS:</span>
                    <span className="font-mono-nums">{formatPKR(currentInvoice.shippingFee)}</span>
                  </div>
                )}

                <div className="pt-2 border-t-2 border-slate-900 flex justify-between font-bold text-base text-slate-900">
                  <span>Total Amount (PKR):</span>
                  <span className="font-mono-nums text-indigo-700">{formatPKR(currentInvoice.total)}</span>
                </div>

                <div className="flex justify-between text-emerald-700 font-semibold pt-1">
                  <span>Amount Paid:</span>
                  <span className="font-mono-nums">{formatPKR(currentInvoice.amountPaid)}</span>
                </div>

                <div className={`pt-2 border-t border-slate-200 flex justify-between font-bold text-sm ${currentInvoice.amountDue > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  <span>Balance Due:</span>
                  <span className="font-mono-nums">{formatPKR(currentInvoice.amountDue)}</span>
                </div>
              </div>
            </div>

            {/* Payment Receipts Table */}
            {currentInvoice.payments.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Payment Receipts &amp; Reconciliation History
                  </h3>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Method</th>
                        <th className="px-3 py-2">Reference</th>
                        <th className="px-3 py-2">Recorded By</th>
                        <th className="px-3 py-2 text-right">Amount (PKR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentInvoice.payments.map(pay => (
                        <tr key={pay.id} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2 font-mono text-slate-700">{pay.paymentDate}</td>
                          <td className="px-3 py-2 capitalize text-slate-700">{pay.paymentMethod.replace('_', ' ')}</td>
                          <td className="px-3 py-2 font-mono text-slate-500">{pay.reference}</td>
                          <td className="px-3 py-2 text-slate-600">{pay.recordedBy}</td>
                          <td className="px-3 py-2 text-right font-mono-nums font-bold text-emerald-700">
                            +{formatPKR(pay.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <PaymentModal
          invoice={currentInvoice}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {showThermalModal && (
        <ThermalReceiptModal
          invoice={currentInvoice}
          onClose={() => setShowThermalModal(false)}
        />
      )}
    </>
  );
};
