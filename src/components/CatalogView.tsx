import React, { useState } from 'react';
import {
  DollarSign,
  Package,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useBilling } from '../context/BillingContext';
import { CatalogItem } from '../types';
import { formatPKR } from '../utils/currency';
import { hasPermission } from '../utils/rbac';

export const CatalogView: React.FC = () => {
  const { catalog, createCatalogItem, updateCatalogItem, deleteCatalogItem, currentUser } = useBilling();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    defaultPrice: 100,
    defaultTaxPercent: 0,
    unit: 'hour',
    category: 'Engineering',
  });

  const canManageCatalog = hasPermission(currentUser, 'canManageCatalog');

  const filteredItems = catalog.filter(item => {
    const q = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateCatalogItem(editingItem.id, formData);
    } else {
      createCatalogItem(formData);
    }
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      defaultPrice: 100,
      defaultTaxPercent: 0,
      unit: 'hour',
      category: 'Engineering',
    });
  };

  const handleEdit = (item: CatalogItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      defaultPrice: item.defaultPrice,
      defaultTaxPercent: item.defaultTaxPercent,
      unit: item.unit,
      category: item.category,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Products &amp; Services Catalog
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Standard billable line items, recurring retainers, and predefined unit pricing.
          </p>
        </div>

        {canManageCatalog && (
          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setFormData({
                name: '',
                description: '',
                defaultPrice: 150,
                defaultTaxPercent: 0,
                unit: 'hour',
                category: 'Engineering',
              });
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Catalog Item</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search catalog products or services..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {filteredItems.length} catalog offerings
        </span>
      </div>

      {/* Catalog Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">Catalog Is Clean &amp; Empty</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Add standard inventory items, POS thermal products, or billable hourly services.
          </p>
          {canManageCatalog && (
            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setFormData({
                  name: '',
                  description: '',
                  defaultPrice: 500,
                  defaultTaxPercent: 0,
                  unit: 'unit',
                  category: 'Retail & POS',
                });
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Catalog Item</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {item.category}
                  </span>
                  {canManageCatalog && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="text-xs text-slate-500 hover:text-slate-800 px-1.5 py-0.5 rounded border border-slate-200"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCatalogItem(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-sm mb-1">{item.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                  {item.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Rate:</span>{' '}
                  <span className="font-bold text-slate-900 font-mono-nums text-sm">
                    {formatPKR(item.defaultPrice)}
                  </span>
                  <span className="text-slate-500 font-mono"> / {item.unit}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Tax: {item.defaultTaxPercent}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? 'Edit Catalog Service' : 'Add Catalog Service'}
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
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Item / Service Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Database Architecture"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Summary of deliverables included in this billable service"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default Price ($) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.defaultPrice}
                    onChange={e => setFormData({ ...formData, defaultPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs font-mono-nums border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Billing Unit *</label>
                  <select
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="hour">per hour</option>
                    <option value="project">per project</option>
                    <option value="month">per month (retainer)</option>
                    <option value="unit">per unit</option>
                    <option value="license">per license</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default Tax %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.defaultTaxPercent}
                    onChange={e => setFormData({ ...formData, defaultTaxPercent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs font-mono-nums border border-slate-300 rounded-lg"
                  />
                </div>
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
                  {editingItem ? 'Save Item' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
