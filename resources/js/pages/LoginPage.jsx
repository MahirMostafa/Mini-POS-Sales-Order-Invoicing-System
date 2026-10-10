import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  Store,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Calculator,
  Loader2,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  KeyRound,
  AlertTriangle,
  Clock
} from 'lucide-react';
import Footer from '../components/Footer';

export default function LoginPage() {
  const { login, quickLogin, demoUsers } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Captcha & Rate Limit states
  const [captchaData, setCaptchaData] = useState({ captcha_key: '', question: '', svg: '' });
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(null);

  const fetchCaptcha = async () => {
    setCaptchaLoading(true);
    try {
      const res = await api.get('/auth/captcha');
      if (res.data.success) {
        setCaptchaData(res.data);
        setCaptchaAnswer('');
      }
    } catch (err) {
      console.error('Failed to load captcha', err);
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  // Rate Limiting Live Countdown Timer
  useEffect(() => {
    let timer;
    if (rateLimitSeconds > 0) {
      timer = setInterval(() => {
        setRateLimitSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setErrorMessage('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [rateLimitSeconds]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rateLimitSeconds > 0) return;

    if (!captchaAnswer.trim()) {
      setErrorMessage('Please enter the security verification answer.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    const result = await login(email, password, captchaData.captcha_key, captchaAnswer);
    setLoading(false);

    if (!result.success) {
      setErrorMessage(result.message);
      if (result.rateLimited) {
        setRateLimitSeconds(result.retryAfter || 60);
      }
      if (result.attemptsLeft !== undefined) {
        setAttemptsLeft(result.attemptsLeft);
      }
      // Regenerate captcha on each attempt
      fetchCaptcha();
    }
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
          Sign in to access your account
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Login Card */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl sm:px-10 border border-slate-200">

          {/* Rate Limit Alert Banner */}
          {rateLimitSeconds > 0 && (
            <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 animate-in fade-in duration-200">
              <Clock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <div className="font-bold text-rose-900">Security Rate Limit Active</div>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Too many failed attempts. Login is paused for security.
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-200/60 font-mono font-black text-rose-900 text-xs">
                  <span>Retry in {rateLimitSeconds}s</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && rateLimitSeconds === 0 && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  disabled={rateLimitSeconds > 0}
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
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
                  disabled={rateLimitSeconds > 0}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Visual Security CAPTCHA Challenge */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Security CAPTCHA</span>
                </label>
                <button
                  type="button"
                  onClick={fetchCaptcha}
                  disabled={captchaLoading || rateLimitSeconds > 0}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors disabled:opacity-50"
                  title="Generate new challenge"
                >
                  <RefreshCw className={`w-3 h-3 ${captchaLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Challenge</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Visual SVG Challenge Preview */}
                <div className="h-10 border border-slate-200 bg-slate-50/70 rounded-xl flex items-center justify-center overflow-hidden p-1 shadow-2xs">
                  {captchaLoading ? (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) : captchaData.svg ? (
                    <div
                      className="w-full h-full flex items-center justify-center cursor-pointer"
                      onClick={fetchCaptcha}
                      title="Click to refresh challenge"
                      dangerouslySetInnerHTML={{ __html: captchaData.svg }}
                    />
                  ) : (
                    <span className="text-xs font-mono font-bold text-indigo-600">{captchaData.question || '...'}</span>
                  )}
                </div>

                {/* Answer Input */}
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    disabled={rateLimitSeconds > 0}
                    placeholder="Enter answer"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 h-10 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 placeholder:font-sans placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Solve the math problem to prove you are human.</p>
            </div>

            <button
              type="submit"
              disabled={loading || rateLimitSeconds > 0}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-md text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : rateLimitSeconds > 0 ? (
                `Rate Limited (${rateLimitSeconds}s)`
              ) : (
                'Sign In'
              )}
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
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-500/50 hover:bg-indigo-50/40 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${uRole === 'Admin' ? 'bg-amber-100 text-amber-800' :
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

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${uRole === 'Admin' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
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

      {/* Login Footer */}
      <Footer className="mt-8 border-t-0 bg-transparent" />
    </div>
  );
}
