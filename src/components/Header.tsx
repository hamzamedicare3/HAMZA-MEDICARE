import React, { useState } from 'react';
import {
  Bell,
  ChevronDown,
  LogOut,
  RefreshCw,
  Shield,
  User as UserIcon,
  CheckCircle,
} from 'lucide-react';
import { useBilling } from '../context/BillingContext';
import { ROLE_LABELS } from '../utils/rbac';

interface HeaderProps {
  currentTab: string;
  onOpenCreateInvoice?: () => void;
  onOpenCreateUser?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onOpenCreateInvoice, onOpenCreateUser }) => {
  const { currentUser, users, switchUser, logout, runAutoStatusCheck, lastAutoAuditTime, invoices } = useBilling();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const overdueInvoices = invoices.filter(i => i.status === 'overdue' && i.amountDue > 0);

  const handleManualAutoCheck = () => {
    setCheckingStatus(true);
    setFeedbackMsg(null);
    setTimeout(() => {
      const res = runAutoStatusCheck();
      setFeedbackMsg(res.message);
      setCheckingStatus(false);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }, 400);
  };

  const currentRoleInfo = currentUser ? ROLE_LABELS[currentUser.role] : null;

  return (
    <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between gap-8 shrink-0 select-none">
      {/* Zone 1: Brand title & Breadcrumb */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-lg tracking-tight whitespace-nowrap shrink-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Shield className="w-4 h-4" />
          </div>
          <span>AuraBill</span>
        </div>

        <span className="text-slate-300 font-light hidden sm:inline">/</span>

        <span className="text-sm font-medium text-slate-600 capitalize truncate hidden sm:inline">
          {currentTab.replace('-', ' ')}
        </span>
      </div>

      {/* Zone 2: Automated Tracking Status Indicator */}
      <div className="hidden lg:flex items-center gap-3 text-xs text-slate-500">
        <button
          type="button"
          onClick={handleManualAutoCheck}
          disabled={checkingStatus}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          title="Run automatic payment status evaluation against today's date"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${checkingStatus ? 'animate-spin text-indigo-600' : ''}`} />
          <span>Auto-Tracker: Active</span>
          <span className="font-mono text-slate-400">({lastAutoAuditTime})</span>
        </button>

        {overdueInvoices.length > 0 && (
          <span className="text-rose-600 font-medium flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60">
            <span>{overdueInvoices.length} Overdue</span>
          </span>
        )}

        {feedbackMsg && (
          <span className="text-emerald-700 text-xs font-medium animate-fadeIn">
            {feedbackMsg}
          </span>
        )}
      </div>

      {/* Zone 3: Active User & Role Controls */}
      <div className="flex items-center gap-3 shrink-0">
        {currentUser && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-medium uppercase">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-800 leading-tight">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                  {currentRoleInfo?.title || currentUser.role}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-medium text-slate-400">Signed in as</p>
                  <p className="text-sm font-semibold text-slate-900">{currentUser.fullName}</p>
                  <p className="text-xs text-slate-500 font-mono">@{currentUser.username}</p>
                  <div className="mt-2">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-md ${currentRoleInfo?.badge}`}>
                      {currentRoleInfo?.title}
                    </span>
                  </div>
                </div>

                {/* Switch Role Quick Tester */}
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Switch Active Role
                  </p>
                  <div className="space-y-1">
                    {users.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          switchUser(u.id);
                          setUserDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors ${
                          u.id === currentUser.id
                            ? 'bg-indigo-50 text-indigo-700 font-semibold'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="capitalize">{u.fullName}</span>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">({u.role})</span>
                        </div>
                        {u.id === currentUser.id && <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
