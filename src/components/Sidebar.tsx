import React from 'react';
import {
  FileText,
  History,
  LayoutDashboard,
  Package,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Users,
  AlertCircle,
} from 'lucide-react';
import { useBilling } from '../context/BillingContext';
import { hasPermission, ROLE_LABELS } from '../utils/rbac';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { currentUser, invoices } = useBilling();

  const overdueCount = invoices.filter(i => i.status === 'overdue' && i.amountDue > 0).length;
  const isAdmin = currentUser?.role === 'admin';

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'invoices',
      label: 'Invoices',
      icon: FileText,
      badge: overdueCount > 0 ? `${overdueCount} overdue` : null,
      badgeColor: 'bg-rose-100 text-rose-700',
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: Users,
      badge: null,
    },
    {
      id: 'catalog',
      label: 'Item Catalog',
      icon: Package,
      badge: null,
    },
    {
      id: 'users',
      label: 'User Management',
      icon: ShieldCheck,
      badge: 'Admin',
      badgeColor: 'bg-indigo-100 text-indigo-700',
      adminOnly: true,
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      icon: History,
      badge: null,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
      <div className="p-4">
        {/* Navigation Section */}
        <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </div>

        <nav className="space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            const isForbidden = item.adminOnly && !isAdmin;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (isForbidden) return;
                  onSelectTab(item.id);
                }}
                disabled={isForbidden}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : isForbidden
                    ? 'text-slate-500 opacity-40 cursor-not-allowed hover:bg-transparent'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="whitespace-nowrap">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                      isActive ? 'bg-indigo-700 text-white' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Role & Permissions Briefing Card */}
      <div className="p-4 border-t border-slate-800">
        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-slate-400">Current Role</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
              {currentUser?.role}
            </span>
          </div>

          <div className="text-white font-semibold truncate mb-1">
            {currentUser?.fullName}
          </div>

          <div className="text-[11px] text-slate-400 leading-snug">
            {currentUser?.role === 'admin' && '✓ Full Admin: Can create/manage users, edit invoices, and alter settings.'}
            {currentUser?.role === 'accountant' && '✓ Finance: Can create invoices, record payments & view financial reports.'}
            {currentUser?.role === 'staff' && '✓ Sales Staff: Can prepare and dispatch draft invoices to clients.'}
            {currentUser?.role === 'viewer' && '✓ Auditor: Read-only access to invoices and financial ledger.'}
          </div>
        </div>
      </div>
    </aside>
  );
};
