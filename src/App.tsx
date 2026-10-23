/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { AuditLogView } from './components/AuditLogView';
import { CatalogView } from './components/CatalogView';
import { ClientsView } from './components/ClientsView';
import { DashboardView } from './components/DashboardView';
import { Header } from './components/Header';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { InvoiceFormModal } from './components/InvoiceFormModal';
import { InvoicesView } from './components/InvoicesView';
import { PaymentModal } from './components/PaymentModal';
import { SettingsView } from './components/SettingsView';
import { Sidebar } from './components/Sidebar';
import { UserManagementView } from './components/UserManagementView';
import { BillingProvider, useBilling } from './context/BillingContext';
import { Invoice } from './types';

function MainLayout() {
  const { currentUser } = useBilling();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Modals state
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);

  if (!currentUser) {
    return <AuthScreen />;
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={tab => setCurrentTab(tab)}
      />

      {/* Main Content Viewport */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          onOpenCreateInvoice={() => setIsCreateInvoiceOpen(true)}
          onOpenCreateUser={() => setCurrentTab('users')}
        />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              <DashboardView
                onNavigateTab={tab => setCurrentTab(tab)}
                onOpenCreateInvoice={() => setIsCreateInvoiceOpen(true)}
                onViewInvoice={inv => setViewingInvoice(inv)}
                onPayInvoice={inv => setPayingInvoice(inv)}
              />
            )}

            {currentTab === 'invoices' && (
              <InvoicesView
                onOpenCreateInvoice={() => setIsCreateInvoiceOpen(true)}
                onViewInvoice={inv => setViewingInvoice(inv)}
                onEditInvoice={inv => setEditingInvoice(inv)}
                onPayInvoice={inv => setPayingInvoice(inv)}
              />
            )}

            {currentTab === 'clients' && <ClientsView />}

            {currentTab === 'catalog' && <CatalogView />}

            {currentTab === 'users' && <UserManagementView />}

            {currentTab === 'audit' && <AuditLogView />}

            {currentTab === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>

      {/* CREATE INVOICE MODAL */}
      {isCreateInvoiceOpen && (
        <InvoiceFormModal
          onClose={() => setIsCreateInvoiceOpen(false)}
          onSaved={newInv => setViewingInvoice(newInv)}
        />
      )}

      {/* EDIT INVOICE MODAL */}
      {editingInvoice && (
        <InvoiceFormModal
          existingInvoice={editingInvoice}
          onClose={() => setEditingInvoice(null)}
          onSaved={updatedInv => setViewingInvoice(updatedInv)}
        />
      )}

      {/* VIEW & PRINT INVOICE MODAL */}
      {viewingInvoice && (
        <InvoiceDetailModal
          invoice={viewingInvoice}
          onClose={() => setViewingInvoice(null)}
          onEdit={inv => {
            setViewingInvoice(null);
            setEditingInvoice(inv);
          }}
        />
      )}

      {/* DIRECT RECORD PAYMENT MODAL */}
      {payingInvoice && (
        <PaymentModal
          invoice={payingInvoice}
          onClose={() => setPayingInvoice(null)}
          onSuccess={() => {
            // refresh viewing if open
            if (viewingInvoice?.id === payingInvoice.id) {
              setViewingInvoice(null);
            }
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <BillingProvider>
      <MainLayout />
    </BillingProvider>
  );
}
