import React, { useState } from 'react';
import {
  Activity,
  Calendar,
  Filter,
  History,
  Search,
  Shield,
  User as UserIcon,
  Zap,
} from 'lucide-react';
import { useBilling } from '../context/BillingContext';

export const AuditLogView: React.FC = () => {
  const { auditLogs } = useBilling();
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filteredLogs = auditLogs.filter(log => {
    if (filterType !== 'all') {
      if (filterType === 'payment' && log.entityType !== 'payment') return false;
      if (filterType === 'user' && log.entityType !== 'user') return false;
      if (filterType === 'invoice' && log.entityType !== 'invoice') return false;
      if (filterType === 'auto' && !log.action.includes('AUTO')) return false;
    }
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.username.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.entityId.toLowerCase().includes(q)
    );
  });

  const getActionBadge = (action: string) => {
    if (action.includes('AUTO')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Zap className="w-3 h-3" />
          <span>{action}</span>
        </span>
      );
    }
    if (action.includes('PAYMENT')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {action}
        </span>
      );
    }
    if (action.includes('USER')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
          {action}
        </span>
      );
    }
    if (action.includes('DELETE') || action.includes('CANCEL')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
          {action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Immutable System Audit Trail
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Cryptographically aligned chronological event log of user logins, admin user creations, payment reconciliation &amp; automatic status updates.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Events' },
            { id: 'auto', label: 'Auto-Status Engine' },
            { id: 'payment', label: 'Payments' },
            { id: 'user', label: 'User Admin' },
            { id: 'invoice', label: 'Invoices' },
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                filterType === f.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit trail..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Actor / Username</th>
                <th className="px-5 py-3">Action Type</th>
                <th className="px-5 py-3">Target Entity</th>
                <th className="px-5 py-3">Audit Details &amp; Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 whitespace-nowrap font-mono text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="font-semibold text-slate-800">@{log.username}</span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap font-mono text-slate-600">
                      {log.entityId}
                    </td>
                    <td className="px-5 py-3 text-slate-700 leading-snug">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
