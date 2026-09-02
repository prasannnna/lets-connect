import React, { useState } from 'react';
import { X, Lock, Mail, UserCheck, Shield, Sparkles, Loader2, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { StudentRole } from '../shared/types.js';

export function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    setAuthModalMode,
    login,
    register,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<StudentRole>('Junior');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (authModalMode === 'login') {
        await login({ email: email.trim(), password });
      } else {
        await register({ email: email.trim(), password, role });
      }
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Check your university credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string, demoRole: string) => {
    setEmail(demoEmail);
    setPassword('Aditya@2025');
    setErrorMsg(null);
    setLoading(true);
    try {
      await login({ email: demoEmail, password: 'Aditya@2025' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="modal-auth-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div
        id="modal-auth-card"
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800"
      >
        {/* Header Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50">
          <button
            id="tab-auth-login"
            type="button"
            onClick={() => {
              setAuthModalMode('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-4 text-sm font-semibold text-center border-b-2 transition-colors ${
              authModalMode === 'login'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            id="tab-auth-register"
            type="button"
            onClick={() => {
              setAuthModalMode('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-4 text-sm font-semibold text-center border-b-2 transition-colors ${
              authModalMode === 'register'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Account
          </button>
          <button
            id="btn-close-auth-modal"
            type="button"
            onClick={closeAuthModal}
            className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">
              {authModalMode === 'login' ? 'Welcome back to Let’s Connect' : 'Join Aditya Student Mentorship'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {authModalMode === 'login'
                ? 'Sign in with your verified university email to access anonymous discussions.'
                : 'Your email authenticates your account, but you will interact via a generated pseudonym.'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 text-xs rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                University Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="input-auth-email"
                  type="email"
                  required
                  placeholder="rollno@aditya.ac.in or name@aec.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Supported: <span className="font-mono text-indigo-600">@aditya.ac.in</span> or{' '}
                <span className="font-mono text-indigo-600">@aec.edu.in</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="input-auth-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {authModalMode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Academic Level / Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Junior', 'Senior', 'Alumni', 'Moderator'] as StudentRole[]).map((r) => (
                    <button
                      key={r}
                      id={`btn-role-select-${r.toLowerCase()}`}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`px-3 py-2 text-xs font-medium rounded-xl border text-left flex items-center justify-between transition-all ${
                        role === r
                          ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 font-semibold'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{r}</span>
                      {role === r && <UserCheck className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              id="btn-auth-submit"
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {authModalMode === 'login' ? 'Sign In to Connect' : 'Register & Generate Pseudonym'}
            </button>
          </form>

          {/* Quick Demo Test Switcher */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Quick Demo Account</span>
            </div>
            <button
              type="button"
              id="btn-demo-moderator"
              onClick={() => handleQuickDemo('moderator@aditya.ac.in', 'Moderator')}
              className="w-full p-2.5 text-left rounded-xl bg-purple-50/80 hover:bg-purple-100/90 text-purple-900 border border-purple-200/80 transition-all flex items-center justify-between group shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>ApexModerator</span>
                    <span className="text-[10px] font-semibold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded">
                      Moderator
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">moderator@aditya.ac.in</div>
                </div>
              </div>
              <span className="text-xs font-semibold text-purple-700 bg-white group-hover:bg-purple-600 group-hover:text-white px-2.5 py-1 rounded-lg border border-purple-200 transition-all">
                Quick Sign In
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
