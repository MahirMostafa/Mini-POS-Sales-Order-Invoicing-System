import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Store, 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  UserCheck, 
  Calculator, 
  Loader2,
  CheckCircle2
} from 'lucide-react';

export default function LoginPage() {
  const { login, quickLogin, demoUsers } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await login(email, password);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Logo */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-500/20">
            <Store className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-black text-slate-900 tracking-tight">
          Mini POS & Sales Invoicing
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Sign in to access your role-based terminal & dashboard
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Login Card */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl sm:px-10 border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-md text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
            </button>
          </form>

          {/* Quick 1-Click Demo Login Selector */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
              ⚡ Instant 1-Click Demo Logins
            </span>

            <div className="space-y-2">
              {demoUsers.map((u) => {
                const uRole = u.roles?.[0]?.name || 'User';
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => quickLogin(u.id)}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-500/50 hover:bg-indigo-50/40 transition-all text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        uRole === 'Admin' ? 'bg-amber-100 text-amber-800' :
                        uRole === 'Accountant' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-indigo-100 text-indigo-800'
                      }`}>
                        {uRole === 'Admin' ? <ShieldCheck className="w-4 h-4" /> :
                         uRole === 'Accountant' ? <Calculator className="w-4 h-4" /> :
                         <UserCheck className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {u.name}
                        </div>
                        <div className="text-[10px] text-slate-400">{u.email}</div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      uRole === 'Admin' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      uRole === 'Accountant' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}>
                      {uRole}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
