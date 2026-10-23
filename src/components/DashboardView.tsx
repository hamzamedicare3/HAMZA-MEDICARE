import React, { useMemo, useState } from 'react';
import {
  CheckCircle,
  FilePlus,
  FileText,
  Package,
  Receipt,
  Search,
  UserPlus,
  Users,
} from 'lucide-react';
import { useBilling } from '../context/BillingContext';
import { Invoice } from '../types';
import { formatPKR } from '../utils/currency';
import { hasPermission } from '../utils/rbac';
import { ThermalReceiptModal } from './ThermalReceiptModal';

interface DashboardViewProps {
  onNavigateTab: (tab: string) => void;
  onOpenCreateInvoice: () => void;
  onViewInvoice: (invoice: Invoice) => void;
  onPayInvoice: (invoice: Invoice) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenCreateInvoice,
  onViewInvoice,
}) => {
  const { invoices, currentUser } = useBilling();
  const [searchTerm, setSearchTerm] = useState('');
  const [thermalInvoice, setThermalInvoice] = useState<Invoice | null>(null);

  // Financial calculations
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amountPaid || inv.total || 0), 0);
  const paidCount = invoices.filter(inv => inv.status === 'paid' || inv.amountDue === 0).length;

  // Filter invoices by search term (search in ID, clientName, or item descriptions)
  const filteredInvoices = useMemo(() => {
    if (!searchTerm.trim()) return invoices;
    const q = searchTerm.toLowerCase();
    return invoices.filter(inv => {
      const matchId = inv.id.toLowerCase().includes(q);
      const matchClient = inv.clientName.toLowerCase().includes(q);
      const matchItems = inv.items?.some(it => it.description.toLowerCase().includes(q));
      return matchId || matchClient || matchItems;
    });
  }, [invoices, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Welcome, <strong className="text-slate-800">{currentUser?.fullName || 'Fahad Khan'}</strong> · Click on any invoice below to open its items and receipt.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasPermission(currentUser, 'canCreateInvoice') && (
            <button
              type="button"
              onClick={onOpenCreateInvoice}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer"
            >
              <FilePlus className="w-4 h-4" />
              <span>Create Invoice</span>
            </button>
          )}

          {currentUser?.role === 'admin' && (
            <button
              type="button"
              onClick={() => onNavigateTab('users')}
              className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-medium transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Users</span>
            </button>
          )}
        </div>
      </div>

      {/* Simple Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Revenue Collected */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue (PKR)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
              ₨
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono-nums">
            {formatPKR(totalRevenue)}
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-1">
            ✓ All created invoices paid in full (₨ 0 Due)
          </p>
        </div>

        {/* Card 2: Total Invoices */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Invoices</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono-nums">
            {invoices.length}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {paidCount} paid &amp; ready for print
          </p>
        </div>

        {/* Card 3: Quick Action */}
        <div
          onClick={onOpenCreateInvoice}
          className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-xs cursor-pointer hover:opacity-95 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-100">Quick Bill</span>
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
              <FilePlus className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg font-bold">New Invoice</div>
            <p className="text-xs text-indigo-100 mt-0.5">
              Add items, customer name &amp; print receipt
            </p>
          </div>
        </div>
      </div>

      {/* Main Invoices Section - Simple, Clickable, Shows Already Added Items */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Invoices &amp; Added Items</span>
            </h2>
            <p className="text-xs text-slate-500">
              Click any invoice below to immediately view the added items and print receipts.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search invoice, customer or item..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Invoice List */}
        {invoices.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <FilePlus className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Invoices Created Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              All previous data has been cleared. Click below to create your first invoice in Pakistani Rupees (PKR).
            </p>
            <button
              type="button"
              onClick={onOpenCreateInvoice}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <FilePlus className="w-4 h-4" />
              <span>Create First Invoice</span>
            </button>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No invoices found matching "{searchTerm}".
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredInvoices.map(inv => (
              <div
                key={inv.id}
                onClick={() => onViewInvoice(inv)}
                className="p-4 sm:px-6 hover:bg-indigo-50/40 transition-colors cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Invoice info and Added Items list */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono font-bold text-sm text-indigo-700 group-hover:underline">
                      {inv.id}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="font-bold text-sm text-slate-900">
                      {inv.clientName}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {inv.issueDate}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      <span>PAID (₨ 0 Due)</span>
                    </span>
                  </div>

                  {/* Added Items preview */}
                  <div className="mt-2.5 flex items-start gap-2">
                    <Package className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div className="flex flex-wrap items-center gap-1.5">
                      {inv.items && inv.items.length > 0 ? (
                        inv.items.map((it, idx) => (
                          <span
                            key={it.id || idx}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-medium border border-slate-200/80"
                          >
                            <span>{it.description || 'Item'}</span>
                            <span className="text-slate-500">×{it.quantity}</span>
                            <span className="font-mono text-slate-600">({formatPKR(it.total)})</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">No items listed</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Total Amount and Action buttons */}
                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Amount</div>
                    <div className="text-base font-bold text-slate-900 font-mono-nums">
                      {formatPKR(inv.total)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setThermalInvoice(inv);
                      }}
                      className="px-2.5 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      title="Print 80mm POS Thermal Receipt"
                    >
                      <Receipt className="w-3.5 h-3.5 text-amber-700" />
                      <span className="hidden sm:inline">Receipt</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onViewInvoice(inv)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer transition-colors shadow-2xs"
                    >
                      View Items
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* POS Thermal Receipt Modal */}
      {thermalInvoice && (
        <ThermalReceiptModal
          invoice={thermalInvoice}
          onClose={() => setThermalInvoice(null)}
        />
      )}
    </div>
  );
};
