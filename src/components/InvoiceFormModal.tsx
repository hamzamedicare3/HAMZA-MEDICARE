import React, { useState } from 'react';
import {
  Calendar,
  Check,
  FilePlus,
  Package,
  Plus,
  Receipt,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useBilling } from '../context/BillingContext';
import { CatalogItem, Client, Invoice, LineItem } from '../types';
import { formatPKR } from '../utils/currency';
import { getTodayString } from '../utils/paymentAutomation';

interface InvoiceFormModalProps {
  existingInvoice?: Invoice | null;
  onClose: () => void;
  onSaved?: (invoice: Invoice) => void;
}

export const InvoiceFormModal: React.FC<InvoiceFormModalProps> = ({
  existingInvoice,
  onClose,
  onSaved,
}) => {
  const { clients, catalog, company, createInvoice, updateInvoice, createClient, currentUser } = useBilling();

  const isEditing = Boolean(existingInvoice);

  // Form State
  const [invoiceId, setInvoiceId] = useState(existingInvoice?.id || '');
  const [title, setTitle] = useState(existingInvoice?.title || 'Sales Invoice');
  const [billedToName, setBilledToName] = useState(existingInvoice?.clientName || '');

  const [issueDate, setIssueDate] = useState(existingInvoice?.issueDate || getTodayString());
  const [paymentTerms, setPaymentTerms] = useState(existingInvoice?.paymentTerms || 'net_30');
  const [dueDate, setDueDate] = useState(() => {
    if (existingInvoice?.dueDate) return existingInvoice.dueDate;
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  const [items, setItems] = useState<LineItem[]>(() => {
    if (existingInvoice?.items && existingInvoice.items.length > 0) {
      return existingInvoice.items;
    }
    return [
      {
        id: 'li_' + Date.now(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxPercent: 0,
        discountPercent: 0,
        total: 0,
      },
    ];
  });

  const [shippingFee, setShippingFee] = useState(existingInvoice?.shippingFee || 0);
  const [notes, setNotes] = useState(existingInvoice?.notes || '');
  const [terms, setTerms] = useState(existingInvoice?.terms || 'Payment due per agreed commercial terms.');
  const [initialStatus, setInitialStatus] = useState<'paid' | 'sent' | 'draft'>(() => {
    if (existingInvoice?.status === 'draft' || existingInvoice?.status === 'sent') {
      return existingInvoice.status;
    }
    return 'paid';
  });
  const [error, setError] = useState<string | null>(null);

  // Adjust due date when payment terms or issue date changes
  const handleTermsChange = (newTerms: string) => {
    setPaymentTerms(newTerms as any);
    const d = new Date(issueDate + 'T00:00:00');
    if (newTerms === 'due_on_receipt') {
      // same date
    } else if (newTerms === 'net_15') {
      d.setDate(d.getDate() + 15);
    } else if (newTerms === 'net_30') {
      d.setDate(d.getDate() + 30);
    } else if (newTerms === 'net_45') {
      d.setDate(d.getDate() + 45);
    } else if (newTerms === 'net_60') {
      d.setDate(d.getDate() + 60);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setDueDate(`${year}-${month}-${day}`);
  };

  // Line item manipulation
  const handleItemChange = (index: number, field: keyof LineItem, val: any) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: val };

      const raw = (item.quantity || 0) * (item.unitPrice || 0);
      const discount = raw * ((item.discountPercent || 0) / 100);
      const discounted = raw - discount;
      const tax = discounted * ((item.taxPercent || 0) / 100);
      item.total = Math.round((discounted + tax) * 100) / 100;

      updated[index] = item;
      return updated;
    });
  };

  const addItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: 'li_' + Date.now(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxPercent: 0,
        discountPercent: 0,
        total: 0,
      },
    ]);
  };

  const addCatalogItem = (catalogItem: CatalogItem) => {
    setItems(prev => [
      ...prev,
      {
        id: 'li_' + Date.now(),
        description: catalogItem.name,
        quantity: 1,
        unitPrice: catalogItem.defaultPrice,
        taxPercent: catalogItem.defaultTaxPercent,
        discountPercent: 0,
        total: Math.round(catalogItem.defaultPrice * (1 + catalogItem.defaultTaxPercent / 100) * 100) / 100,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate live totals
  const subtotal = Math.round(items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) * 100) / 100;
  const discountTotal = Math.round(
    items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.discountPercent / 100)), 0) * 100
  ) / 100;
  const taxTotal = Math.round(
    items.reduce((sum, item) => {
      const discounted = (item.quantity * item.unitPrice) * (1 - item.discountPercent / 100);
      return sum + (discounted * (item.taxPercent / 100));
    }, 0) * 100
  ) / 100;
  const grandTotal = Math.max(0, Math.round((subtotal - discountTotal + taxTotal + Number(shippingFee || 0)) * 100) / 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validItems = items.filter(it => it.description.trim().length > 0 || it.unitPrice > 0);
    if (validItems.length === 0) {
      setError('Please add at least one line item with a description and unit price.');
      return;
    }

    if (!billedToName.trim()) {
      setError('Please enter the name of the person or party you are billing to.');
      return;
    }

    const finalClientName = billedToName.trim();
    const finalClientId = existingInvoice?.clientId || 'client_' + Date.now();

    try {
      if (isEditing && existingInvoice) {
        updateInvoice(existingInvoice.id, {
          title,
          clientId: finalClientId,
          clientName: finalClientName,
          clientEmail: '',
          clientAddress: '',
          clientTaxId: '',
          issueDate,
          dueDate,
          paymentTerms,
          items: validItems,
          shippingFee: Number(shippingFee),
          notes,
          terms,
        });
        if (onSaved) onSaved(existingInvoice);
      } else {
        const newInv = createInvoice({
          id: invoiceId.trim() || undefined,
          title,
          clientId: finalClientId,
          clientName: finalClientName,
          clientEmail: '',
          clientAddress: '',
          clientTaxId: '',
          issueDate,
          dueDate,
          paymentTerms,
          items: validItems,
          shippingFee: Number(shippingFee),
          status: initialStatus,
          notes,
          terms,
          currency: 'PKR',
        });
        if (onSaved) onSaved(newInv);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save invoice.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-8 p-6 sm:p-8 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              ₨
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? `Edit Invoice ${existingInvoice?.id}` : 'Create New Invoice (PKR)'}
              </h2>
              <p className="text-xs text-slate-500">
                Generate commercial invoice &amp; printable thermal receipt in Pakistani Rupees.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Row 1: Invoice ID & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                placeholder="Auto-generated (e.g. INV-2026-001)"
                value={invoiceId}
                onChange={e => setInvoiceId(e.target.value)}
                disabled={isEditing}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice Subject / Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sales Invoice / Customer Bill"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Row 2: Client Selector / Inputs */}
          {/* Row 2: Billed To (Name Only) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>Billed To (Name) *</span>
            </label>
            <input
              type="text"
              required
              placeholder="Enter name of person or company you are billing to (e.g. Asim Traders / Walk-in Customer)"
              value={billedToName}
              onChange={e => setBilledToName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-medium border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 text-slate-900 shadow-2xs"
              autoFocus
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              Recipient name who is being billed. Appears directly on the invoice and thermal receipt.
            </p>
          </div>

          {/* Row 3: Dates & Payment Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Issue Date *
              </label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={e => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Terms *
              </label>
              <select
                value={paymentTerms}
                onChange={e => handleTermsChange(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="net_30">Net 30 Days</option>
                <option value="net_15">Net 15 Days</option>
                <option value="net_45">Net 45 Days</option>
                <option value="net_60">Net 60 Days</option>
                <option value="due_on_receipt">Due on Receipt (Cash POS)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Calculated Due Date *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-semibold"
              />
            </div>
          </div>

          {/* Row 4: Line Items Table */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Invoice Line Items ({items.length})
              </span>

              {catalog.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400">Add from Catalog:</span>
                  {catalog.slice(0, 3).map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => addCatalogItem(cat)}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors font-medium"
                      title={`Add ${cat.name} (${formatPKR(cat.defaultPrice)})`}
                    >
                      + {cat.name.split(' ')[0]} ({formatPKR(cat.defaultPrice)})
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">Item Description</th>
                    <th className="px-3 py-2 w-20">Qty</th>
                    <th className="px-3 py-2 w-32">Unit Price (₨)</th>
                    <th className="px-3 py-2 w-20">GST %</th>
                    <th className="px-3 py-2 w-20">Disc %</th>
                    <th className="px-3 py-2 w-32 text-right">Total (PKR)</th>
                    <th className="px-2 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="p-2">
                        <input
                          type="text"
                          required
                          value={item.description}
                          onChange={e => handleItemChange(idx, 'description', e.target.value)}
                          placeholder="Description of product or service"
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          required
                          value={item.quantity}
                          onChange={e => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-xs font-mono-nums border border-slate-200 rounded"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          step="10"
                          required
                          value={item.unitPrice}
                          onChange={e => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-xs font-mono-nums border border-slate-200 rounded"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.taxPercent}
                          onChange={e => handleItemChange(idx, 'taxPercent', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-xs font-mono-nums border border-slate-200 rounded"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discountPercent}
                          onChange={e => handleItemChange(idx, 'discountPercent', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-xs font-mono-nums border border-slate-200 rounded"
                        />
                      </td>
                      <td className="p-2 text-right font-mono-nums font-semibold text-slate-800">
                        {formatPKR(item.total)}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          disabled={items.length <= 1}
                          className="text-slate-400 hover:text-rose-600 disabled:opacity-30 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="p-2 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>
            </div>
          </div>

          {/* Row 5: Notes & Financial Calculation Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Notes / Terms
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Optional notes or terms for the customer"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />

              {!isEditing && (
                <div className="mt-3 p-3 rounded-lg bg-emerald-50/70 border border-emerald-200">
                  <label className="block text-xs font-bold text-emerald-900 mb-1.5">
                    Payment Status on Creation
                  </label>
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-emerald-800">
                      <input
                        type="radio"
                        name="initStatus"
                        checked={initialStatus === 'paid'}
                        onChange={() => setInitialStatus('paid')}
                      />
                      <span>✓ Paid in Full (₨ 0 Due Balance)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
                      <input
                        type="radio"
                        name="initStatus"
                        checked={initialStatus === 'sent'}
                        onChange={() => setInitialStatus('sent')}
                      />
                      <span>Sent (Unpaid / Due later)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
                      <input
                        type="radio"
                        name="initStatus"
                        checked={initialStatus === 'draft'}
                        onChange={() => setInitialStatus('draft')}
                      />
                      <span>Draft</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    When created as Paid in Full, the invoice balance due is set to ₨ 0 and is immediately ready for printing.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono-nums">{formatPKR(subtotal)}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Total Discounts:</span>
                  <span className="font-mono-nums">-{formatPKR(discountTotal)}</span>
                </div>
              )}
              {taxTotal > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Total GST / Tax:</span>
                  <span className="font-mono-nums">{formatPKR(taxTotal)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-600 pt-1">
                <span>Shipping / TCS Delivery (₨):</span>
                <div className="w-28">
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={shippingFee}
                    onChange={e => setShippingFee(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-0.5 text-right font-mono-nums text-xs border border-slate-200 rounded bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 border-t-2 border-slate-900 flex justify-between font-bold text-sm text-slate-900">
                <span>Total Amount (PKR):</span>
                <span className="font-mono-nums text-base text-indigo-700">{formatPKR(grandTotal)}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
            >
              {isEditing ? 'Save Changes' : 'Generate Invoice & Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
