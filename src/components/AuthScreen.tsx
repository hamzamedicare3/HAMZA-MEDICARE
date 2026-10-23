import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Shield, User as UserIcon, CheckCircle2, ArrowRight, Printer } from 'lucide-react';
import { useBilling } from '../context/BillingContext';
import { ROLE_LABELS } from '../utils/rbac';

export const AuthScreen: React.FC = () => {
  const { login, users } = useBilling();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = login(username, password);
      if (!res.success) {
        setError(res.message || 'Login failed. Please verify your credentials.');
      }
      setLoading(false);
    }, 250);
  };

  const handleQuickLogin = (uname: string, pass: string) => {
    setUsername(uname);
    setPassword(pass);
    setError(null);
    setLoading(true);
    setTimeout(() => {
      login(uname, pass);
      setLoading(false);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white shadow-lg mb-4">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          AuraBill POS &amp; Billing Software
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Pakistani Rupee (PKR · ₨) · Thermal POS Printing · Role Access
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-800 border border-slate-700/80 rounded-2xl py-8 px-6 sm:px-10 shadow-xl">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 rounded-lg bg-red-950/60 border border-red-800/80 text-red-200 text-xs leading-relaxed">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Username (Login ID)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={e => {
                    setUsername(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter your assigned username"
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter your password"
                  className="block w-full pl-9 pr-10 py-2.5 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors shadow-md disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In with Username &amp; Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Test Accounts for instant evaluation */}
          <div className="mt-8 pt-6 border-t border-slate-700/80">
            <p className="text-xs font-medium text-slate-400 mb-3 flex items-center justify-between">
              <span>Quick Role Switch (Click to login):</span>
              <span className="text-[10px] font-mono text-emerald-400">Currency: PKR (₨)</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
              {users.map(u => {
                const isOp = u.role === 'operator';
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickLogin(u.username, u.passwordHash)}
                    className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
                      isOp
                        ? 'bg-amber-950/40 border-amber-800 hover:bg-amber-900/50'
                        : 'border-slate-700/60 bg-slate-900/50 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs font-semibold text-white truncate max-w-[120px]">{u.fullName}</span>
                      <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded ${
                        isOp ? 'bg-amber-900 text-amber-200 border border-amber-700 font-bold' : 'bg-slate-800 text-indigo-300'
                      }`}>
                        {u.role === 'operator' ? 'No-Edit Staff' : u.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      user: <span className="text-slate-200 font-medium">{u.username}</span> / pass: <span className="text-slate-200 font-medium">{u.passwordHash}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-slate-900/80 border border-slate-700/60 text-[11px] text-slate-400 space-y-1">
              <p>
                <strong className="text-indigo-400 font-medium">Administrator:</strong> Log in as <code className="text-slate-200">admin</code> (Fahad Khan) to create new users, manage billing, and issue invoices.
              </p>
              <p>
                <strong className="text-amber-400 font-medium">Add Operators:</strong> Fahad Khan can add new operator accounts in <strong className="text-slate-200">User Management</strong>. Operators can create new invoices &amp; print thermal receipts, but are blocked from editing existing invoices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
