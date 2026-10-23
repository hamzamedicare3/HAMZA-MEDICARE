import React, { useState } from 'react';
import {
  Building2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useBilling } from '../context/BillingContext';
import { Client } from '../types';
import { formatPKR } from '../utils/currency';
import { hasPermission } from '../utils/rbac';

export const ClientsView: React.FC = () => {
  const { clients, invoices, createClient, updateClient, deleteClient, currentUser } = useBilling();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    currency: 'USD',
    notes: '',
  });

  const canManageClients = hasPermission(currentUser, 'canManageClients');

  const filteredClients = clients.filter(c => {
    const q = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      updateClient(editingClient.id, formData);
      setNotice(`Client "${formData.name}" updated.`);
    } else {
      createClient(formData);
      setNotice(`Client "${formData.name}" registered.`);
    }
    setIsModalOpen(false);
    setEditingClient(null);
    setFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      address: '',
      taxId: '',
      currency: 'USD',
      notes: '',
    });
    setTimeout(() => setNotice(null), 3000);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      address: client.address,
      taxId: client.taxId || '',
      currency: client.currency || 'USD',
      notes: client.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (client: Client) => {
    if (window.confirm(`Delete client record for ${client.name}?`)) {
      const ok = deleteClient(client.id);
      if (!ok) {
        setNotice(`Cannot delete ${client.name}: active invoices exist for this client.`);
      } else {
        setNotice(`Client ${client.name} deleted.`);
      }
      setTimeout(() => setNotice(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Clients &amp; Accounts Directory
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage commercial accounts, billing contacts, and outstanding balances.
          </p>
        </div>

        {canManageClients && (
          <button
            type="button"
            onClick={() => {
              setEditingClient(null);
              setFormData({
                name: '',
                company: '',
                email: '',
                phone: '',
                address: '',
                taxId: '',
                currency: 'USD',
                notes: '',
              });
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Client</span>
          </button>
        )}
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-center justify-between">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="font-bold text-slate-400">
            ×
          </button>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search clients by name, company, or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {filteredClients.length} clients registered
        </span>
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">No Clients Registered Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Start fresh by registering your customer or wholesale accounts for fast 1-click billing.
          </p>
          {canManageClients && (
            <button
              type="button"
              onClick={() => {
                setEditingClient(null);
                setFormData({
                  name: '',
                  company: '',
                  email: '',
                  phone: '',
                  address: '',
                  taxId: '',
                  currency: 'PKR',
                  notes: '',
                });
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register First Client</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClients.map(client => {
            const clientInvoices = invoices.filter(i => i.clientId === client.id);
            const totalBilled = clientInvoices.reduce((sum, i) => sum + i.total, 0);
            const totalPaid = clientInvoices.reduce((sum, i) => sum + i.amountPaid, 0);
            const balance = clientInvoices.reduce((sum, i) => (i.status !== 'cancelled' ? sum + i.amountDue : sum), 0);

          return (
            <div
              key={client.id}
              className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
                      {client.company.charAt(0) || client.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{client.company}</h3>
                      <p className="text-xs text-slate-500">{client.name}</p>
                    </div>
                  </div>

                  {canManageClients && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(client)}
                        className="px-2 py-1 text-xs rounded border border-slate-200 text-slate-600 hover:bg-slate-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(client)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Delete client"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{client.address}</span>
                  </div>
                  {client.taxId && (
                    <div className="text-[11px] font-mono text-slate-400 pt-1">
                      Tax ID: {client.taxId}
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Summary Strip for Client */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Invoices</div>
                  <div className="font-semibold text-slate-800 font-mono-nums">
                    {clientInvoices.length}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Paid Total</div>
                  <div className="font-semibold text-emerald-600 font-mono-nums">
                    {formatPKR(totalPaid)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Balance Due</div>
                  <div className={`font-semibold font-mono-nums ${balance > 0 ? 'text-rose-600 font-bold' : 'text-slate-800'}`}>
                    {formatPKR(balance)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingClient ? 'Edit Client Record' : 'Register New Client'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company / Organization *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Corporation"
                    value={formData.company}
                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Primary Contact Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Billing Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="billing@acme.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 019-2831"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Billing Address *</label>
                <input
                  type="text"
                  required
                  placeholder="Street, Suite, City, State, ZIP, Country"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tax / VAT ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. US-EIN-12-3456789"
                  value={formData.taxId}
                  onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  {editingClient ? 'Save Changes' : 'Register Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
