import React, { useState } from 'react';
import {
  Banknote,
  Calendar,
  CheckCircle2,
  CreditCard,
  DollarSign,
  HelpCircle,
  Receipt,
  X,
  Zap,
} from 'lucide-react';
import { useBilling } from '../context/BillingContext';
import { Invoice, PaymentMethod } from '../types';
import { formatPKR } from '../utils/currency';
import { getTodayString } from '../utils/paymentAutomation';

interface PaymentModalProps {
  invoice: Invoice;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ invoice, onClose, onSuccess }) => {
  const { recordPayment, company } = useBilling();

  const [amount, setAmount] = useState<number>(invoice.amountDue);
  const [paymentDate, setPaymentDate] = useState<string>(getTodayString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [reference, setReference] = useState<string>(`RAAST-${Date.now().toString().slice(-6)}`);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const remainingAfterPayment = Math.max(0, Math.round((invoice.amountDue - (amount || 0)) * 100) / 100);
  const willBeFullyPaid = remainingAfterPayment <= 0.005;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amount <= 0) {
      setError('Payment amount must be greater than zero.');
      return;
    }

    const result = recordPayment(invoice.id, {
      amount,
      paymentDate,
      paymentMethod,
      reference,
      notes,
    });

    if (result.success) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setError(result.message || 'Failed to record payment.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              ₨
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Record Payment (PKR)
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {invoice.id} · {invoice.clientName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Financial Summary Strip */}
        <div className="mt-4 grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <div className="text-[11px] text-slate-500">Invoice Total</div>
            <div className="font-semibold text-slate-900 font-mono-nums">
              {formatPKR(invoice.total)}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500">Amount Paid</div>
            <div className="font-semibold text-emerald-600 font-mono-nums">
              {formatPKR(invoice.amountPaid)}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500">Balance Due</div>
            <div className="font-semibold text-rose-600 font-mono-nums">
              {formatPKR(invoice.amountDue)}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Payment Amount (₨ PKR) *
              </label>
              <button
                type="button"
                onClick={() => setAmount(invoice.amountDue)}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Pay Full Balance ({formatPKR(invoice.amountDue)})
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                ₨
              </div>
              <input
                type="number"
                step="1"
                min="1"
                max={invoice.amountDue * 1.5}
                required
                value={amount || ''}
                onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-3 py-2 text-sm font-semibold font-mono-nums border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="cash">Cash (Counter POS)</option>
                <option value="bank_transfer">Raast / Online IBFT</option>
                <option value="credit_card">Debit / Credit Card</option>
                <option value="check">Bank Cheque</option>
                <option value="stripe">PayPro / JazzCash / EasyPaisa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transaction Ref / Raast ID / Cheque # *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. RAAST-882104 or CASH-POS"
              value={reference}
              onChange={e => setReference(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Internal Cashier Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="Received at counter or verified in bank statement"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Automatic Status Engine Prediction Box */}
          <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-900">
            <Zap className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-indigo-950">Automated Status Engine: </span>
              {willBeFullyPaid ? (
                <span>
                  Recording {formatPKR(amount)} will settle 100% of the balance. The system will automatically flip the status to <strong className="text-emerald-700 font-bold uppercase">PAID (ادا شدہ)</strong> and generate an immutable audit receipt.
                </span>
              ) : (
                <span>
                  Recording {formatPKR(amount)} leaves a remaining balance of <strong>{formatPKR(remainingAfterPayment)}</strong>. The invoice will update to{' '}
                  <strong className="text-amber-700 font-bold uppercase">PARTIALLY PAID</strong>.
                </span>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
            >
              Confirm &amp; Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
