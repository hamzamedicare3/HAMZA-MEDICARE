import React, { useState } from 'react';
import {
  AlertTriangle,
  Building,
  CheckCircle,
  CreditCard,
  Download,
  Landmark,
  RefreshCw,
  Save,
  ShieldAlert,
} from 'lucide-react';
import { useBilling } from '../context/BillingContext';
import { hasPermission } from '../utils/rbac';

export const SettingsView: React.FC = () => {
  const { company, updateCompanyProfile, resetToDefaults, exportDataJson, currentUser } = useBilling();

  const [form, setForm] = useState({ ...company });
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    updateCompanyProfile(form);
    setSavedNotice('Business configuration successfully updated.');
    setTimeout(() => setSavedNotice(null), 4000);
  };

  const handleDownloadBackup = () => {
    const json = exportDataJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aurabill-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (window.confirm('WARNING: Resetting will restore default users, invoices, and payment records. Proceed?')) {
      resetToDefaults();
      setSavedNotice('System reset to clean default demonstration data.');
      setTimeout(() => setSavedNotice(null), 4000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Organization &amp; Billing Settings
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Configure legal entity details and official business profile.
        </p>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{savedNotice}</span>
          </div>
          <button type="button" onClick={() => setSavedNotice(null)} className="font-bold text-emerald-500">
            ×
          </button>
        </div>
      )}

      {!isAdmin && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            You are viewing settings in read-only mode. Only users with the <strong className="font-bold">Administrator</strong> role can modify company configurations.
          </span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
            <Building className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Company Legal Entity Information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Legal Name *</label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tax / VAT Registration ID *</label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={form.taxId}
                onChange={e => setForm({ ...form, taxId: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Billing Support Email *</label>
              <input
                type="email"
                required
                disabled={!isAdmin}
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Telephone Contact</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg disabled:bg-slate-50"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Official Physical Address *</label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg disabled:bg-slate-50"
              />
            </div>
          </div>

          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Save Organization Settings</span>
              </button>
            </div>
          )}
        </div>
      </form>

      {/* System Backup & Factory Reset */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Database Backup &amp; System Maintenance
        </h3>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <div className="font-semibold text-slate-900">Export Ledger &amp; Users Backup (JSON)</div>
            <p className="text-slate-500 text-[11px]">Download all invoices, clients, catalog items, and audit logs to a JSON file.</p>
          </div>
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Download Backup</span>
          </button>
        </div>

        {isAdmin && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs">
            <div>
              <div className="font-semibold text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Restore Clean Demo Dataset</span>
              </div>
              <p className="text-rose-700 text-[11px]">Re-initializes pre-seeded users (Admin, Accountant, Sales, Viewer) and demo invoices.</p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold shrink-0 shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Restore Demo Data</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
