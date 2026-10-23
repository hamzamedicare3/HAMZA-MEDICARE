import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  MoreVertical,
  Plus,
  Printer,
  Receipt,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  X,
} from 'lucide-react';
import { useBilling } from '../context/BillingContext';
import { User, UserRole } from '../types';
import { ROLE_LABELS, ROLE_PERMISSIONS, hasPermission } from '../utils/rbac';

export const UserManagementView: React.FC = () => {
  const { currentUser, users, createUser, updateUser, deleteUser, toggleUserStatus, resetUserPassword } = useBilling();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states for Create User
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    role: 'operator' as UserRole, // Defaults to Billing Operator (add invoices, no edit)
    department: 'POS & Counter Billing',
    status: 'active' as 'active' | 'suspended',
  });
  const [showPassword, setShowPassword] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Administrator Access Required
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
            Only users with the <strong className="text-slate-900">Administrator</strong> role have permissions to create, view, or manage user accounts and security roles.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-amber-200 text-xs font-mono text-slate-700">
            <span>Your Current Role:</span>
            <span className="font-bold text-amber-700 uppercase">{currentUser?.role}</span>
          </div>
        </div>
      </div>
    );
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    const res = createUser({
      fullName: formData.fullName,
      username: formData.username,
      email: formData.email,
      passwordHash: formData.password,
      role: formData.role,
      department: formData.department,
      status: formData.status,
    });

    if (res.success) {
      setNotification({
        type: 'success',
        message: `User "${formData.username}" (${formData.fullName}) has been successfully created with ${formData.role.toUpperCase()} privileges!`,
      });
      setIsCreateOpen(false);
      setFormData({
        fullName: '',
        username: '',
        email: '',
        password: '',
        role: 'operator',
        department: 'POS & Counter Billing',
        status: 'active',
      });
    } else {
      setNotification({
        type: 'error',
        message: res.message || 'Failed to create user.',
      });
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    updateUser(editingUser.id, {
      fullName: editingUser.fullName,
      email: editingUser.email,
      department: editingUser.department,
      role: editingUser.role,
    });

    setNotification({
      type: 'success',
      message: `User account "${editingUser.username}" was updated.`,
    });
    setEditingUser(null);
  };

  const handlePasswordResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordResetUser || !newPasswordValue.trim()) return;

    resetUserPassword(passwordResetUser.id, newPasswordValue.trim());
    setNotification({
      type: 'success',
      message: `Password for "${passwordResetUser.username}" was updated.`,
    });
    setPasswordResetUser(null);
    setNewPasswordValue('');
  };

  const handleDelete = (user: User) => {
    if (user.id === currentUser?.id) {
      setNotification({
        type: 'error',
        message: 'Cannot delete your own active administrator account.',
      });
      return;
    }

    if (window.confirm(`Are you sure you want to permanently delete user account "${user.username}"?`)) {
      const res = deleteUser(user.id);
      if (res.success) {
        setNotification({
          type: 'success',
          message: `User "${user.username}" was deleted.`,
        });
      } else {
        setNotification({
          type: 'error',
          message: res.message || 'Failed to delete user.',
        });
      }
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password: result }));
    setShowPassword(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            User Management &amp; Role Access Control
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Admin console: Create new users (e.g. operators who can add new invoices but cannot edit previous ones).
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormData({
              fullName: '',
              username: '',
              email: '',
              password: '',
              role: 'operator',
              department: 'POS & Counter Billing',
              status: 'active',
            });
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors shadow-sm shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create New User</span>
        </button>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Registered System Users ({users.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {users.filter(u => u.status === 'active').length} active · {users.filter(u => u.status === 'suspended').length} suspended
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">User &amp; Username</th>
                <th className="px-6 py-3">Security Role &amp; Policy</th>
                <th className="px-6 py-3">Department &amp; Email</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Last Login</th>
                <th className="px-6 py-3 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => {
                const roleInfo = ROLE_LABELS[u.role];
                const isCurrent = u.id === currentUser?.id;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold uppercase shrink-0">
                          {u.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <span>{u.fullName}</span>
                            {isCurrent && (
                              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-mono">
                                (You)
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 font-mono">
                            @{u.username}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-3.5">
                      <div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${roleInfo?.badge}`}>
                          {roleInfo?.title || u.role}
                        </span>
                        {u.role === 'operator' && (
                          <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                            🔒 Can add new, cannot edit previous
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-3.5">
                      <div className="text-xs text-slate-700">{u.department}</div>
                      <div className="text-xs text-slate-400">{u.email}</div>
                    </td>

                    <td className="px-6 py-3.5">
                      {u.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                          <span>Suspended</span>
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-3.5 text-xs text-slate-500 font-mono">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}
                    </td>

                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingUser(u)}
                          className="px-2.5 py-1 text-xs rounded border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPasswordResetUser(u);
                            setNewPasswordValue('');
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100"
                          title="Reset Password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => toggleUserStatus(u.id)}
                            className={`p-1.5 rounded hover:bg-slate-100 ${
                              u.status === 'active' ? 'text-amber-600' : 'text-emerald-600'
                            }`}
                            title={u.status === 'active' ? 'Suspend User' : 'Activate User'}
                          >
                            {u.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        )}

                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleDelete(u)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Permission Matrix Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-semibold text-slate-900">
            Role-Based Access Control (RBAC) Permissions Matrix
          </h3>
          <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
            Tamper-Proof Ledger Rules
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Defines exact capabilities. Note how <strong>Billing Operator</strong> can add new invoices and print thermal receipts, but is restricted from editing previously saved invoices.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="px-4 py-2.5">System Capability</th>
                <th className="px-4 py-2.5 text-center">Administrator</th>
                <th className="px-4 py-2.5 text-center font-bold text-amber-800 bg-amber-50/50">
                  Billing Operator
                </th>
                <th className="px-4 py-2.5 text-center">Senior Accountant</th>
                <th className="px-4 py-2.5 text-center">Auditor / Viewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-4 py-2.5 font-medium text-slate-800">
                  Provision &amp; Create Other Users
                </td>
                <td className="px-4 py-2.5 text-center text-emerald-600 font-bold">✓ Full Access</td>
                <td className="px-4 py-2.5 text-center text-rose-600 font-medium bg-amber-50/30">❌ No Access</td>
                <td className="px-4 py-2.5 text-center text-slate-300">—</td>
                <td className="px-4 py-2.5 text-center text-slate-300">—</td>
              </tr>
              <tr className="bg-amber-50/20">
                <td className="px-4 py-2.5 font-bold text-slate-900">
                  Create New Invoices
                </td>
                <td className="px-4 py-2.5 text-center text-emerald-600 font-bold">✓ Allowed</td>
                <td className="px-4 py-2.5 text-center text-emerald-700 font-bold bg-amber-50/50">
                  ✓ Allowed (Add New)
                </td>
                <td className="px-4 py-2.5 text-center text-emerald-600 font-bold">✓ Allowed</td>
                <td className="px-4 py-2.5 text-center text-slate-300">— (Read Only)</td>
              </tr>
              <tr className="bg-amber-100/30">
                <td className="px-4 py-2.5 font-bold text-rose-800">
                  Edit Existing / Previous Invoices
                </td>
                <td className="px-4 py-2.5 text-center text-emerald-600 font-bold">✓ Allowed (Admin Only)</td>
                <td className="px-4 py-2.5 text-center font-bold text-rose-700 bg-amber-100/60">
                  ❌ BLOCKED (Cannot Edit)
                </td>
                <td className="px-4 py-2.5 text-center text-emerald-600 font-bold">✓ Allowed</td>
                <td className="px-4 py-2.5 text-center text-slate-300">— (Read Only)</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium text-slate-800">
                  Print Thermal Receipts (80mm/58mm POS)
                </td>
                <td className="px-4 py-2.5 text-center text-emerald-600 font-bold">✓ Allowed</td>
                <td className="px-4 py-2.5 text-center text-emerald-700 font-bold bg-amber-50/30">
                  ✓ Allowed (POS Cashier)
                </td>
                <td className="px-4 py-2.5 text-center text-emerald-600 font-bold">✓ Allowed</td>
                <td className="px-4 py-2.5 text-center text-emerald-600 font-bold">✓ Allowed</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium text-slate-800">
                  Record Payments &amp; Settle Cash
                </td>
                <td className="px-4 py-2.5 text-center text-emerald-600 font-bold">✓ Allowed</td>
                <td className="px-4 py-2.5 text-center text-emerald-700 font-bold bg-amber-50/30">
                  ✓ Allowed (Counter POS)
                </td>
                <td className="px-4 py-2.5 text-center text-emerald-600 font-bold">✓ Allowed</td>
                <td className="px-4 py-2.5 text-center text-slate-300">—</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium text-slate-800">
                  Delete Records (Permanent Purge)
                </td>
                <td className="px-4 py-2.5 text-center text-emerald-600 font-bold">✓ Allowed (Admin Only)</td>
                <td className="px-4 py-2.5 text-center text-rose-600 font-medium bg-amber-50/30">❌ Blocked</td>
                <td className="px-4 py-2.5 text-center text-slate-300">—</td>
                <td className="px-4 py-2.5 text-center text-slate-300">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Admin: Create New User Account
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Asad Rauf"
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username (Login ID) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. asad_pos"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Used for password sign in</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="asad@aurabill.pk"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="POS Counter Billing, Accounts"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Login Password *
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Generate Random
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 4 characters"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-3 pr-10 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Access Security Role *
                </label>
                <div className="space-y-2">
                  {(['operator', 'admin', 'accountant', 'viewer'] as UserRole[]).map(roleKey => {
                    const label = ROLE_LABELS[roleKey];
                    const isSelected = formData.role === roleKey;
                    const isOperatorRole = roleKey === 'operator';

                    return (
                      <button
                        key={roleKey}
                        type="button"
                        onClick={() => setFormData({ ...formData, role: roleKey })}
                        className={`w-full p-2.5 rounded-lg border text-left transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{label.title}</span>
                            {isOperatorRole && (
                              <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded border border-amber-300">
                                Recommended for Staff
                              </span>
                            )}
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                          {label.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                >
                  Save &amp; Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Edit User: @{editingUser.username}
              </h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editingUser.fullName}
                  onChange={e => setEditingUser({ ...editingUser, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={editingUser.email}
                  onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={editingUser.department}
                  onChange={e => setEditingUser({ ...editingUser, department: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Role
                </label>
                <select
                  value={editingUser.role}
                  onChange={e => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                >
                  <option value="operator">Billing Operator (Can add new, cannot edit previous)</option>
                  <option value="admin">Administrator (Full Access)</option>
                  <option value="accountant">Senior Accountant (Can edit)</option>
                  <option value="viewer">Auditor &amp; Viewer (Read-only)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {passwordResetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <KeyRound className="w-4 h-4 text-indigo-600" />
                <span>Reset User Password</span>
              </div>
              <button
                type="button"
                onClick={() => setPasswordResetUser(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordResetSubmit} className="mt-4 space-y-4">
              <p className="text-xs text-slate-500">
                Setting new credentials for <strong className="text-slate-800">@{passwordResetUser.username}</strong> ({passwordResetUser.fullName}).
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  New Password *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter new password"
                  value={newPasswordValue}
                  onChange={e => setNewPasswordValue(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPasswordResetUser(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  Set New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
