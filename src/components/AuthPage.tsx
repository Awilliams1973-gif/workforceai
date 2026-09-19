import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { Headset, ArrowLeft, Sparkles, AlertCircle, Mail, CheckCircle2 } from 'lucide-react';

export default function AuthPage() {
  const { setView } = useAppStore();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    setError(null);
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (signUpError) throw signUpError;
        if (data.user) {
          setView('dashboard');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        setView('dashboard');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setError(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/dashboard`,
      });
      if (resetError) throw resetError;
      setResetSent(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-teal-50 via-white to-white">
      <header className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
        <button onClick={() => setView('home')} className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
            <Headset className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Workforce<span className="text-teal-600">AI</span>
          </span>
        </button>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700 ring-1 ring-inset ring-teal-200">
              <Sparkles className="h-3.5 w-3.5" />
              {mode === 'signup' ? 'Create your account' : 'Welcome back'}
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
              {mode === 'signup' ? 'Start your free trial' : 'Sign in to your dashboard'}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {mode === 'signup'
                ? 'No credit card required. Get started in under 2 minutes.'
                : 'Access your AI employees and dashboard.'}
            </p>
          </div>

          <div className="card p-6 sm:p-8">
            {resetMode ? (
              <>
                {resetSent ? (
                  <div className="space-y-4 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Check your email</h2>
                      <p className="mt-1 text-sm text-slate-600">
                        We sent a password reset link to <span className="font-medium text-slate-900">{email}</span>. Click the link in the email to set a new password.
                      </p>
                    </div>
                    <button
                      onClick={() => { setResetMode(false); setResetSent(false); }}
                      className="btn-primary w-full"
                    >
                      Back to sign in
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleReset} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => { setResetMode(false); setError(null); }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <h2 className="text-base font-semibold text-slate-900">Reset your password</h2>
                    </div>
                    <p className="text-sm text-slate-600">Enter your email and we'll send you a link to set a new password.</p>
                    <div>
                      <label className="label">Email</label>
                      <input
                        className="input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@smithplumbing.com"
                        required
                      />
                    </div>
                    {error && (
                      <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="btn-primary w-full text-base disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {resetLoading ? 'Sending...' : 'Send reset link'}
                    </button>
                  </form>
                )}
              </>
            ) : (
            <>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="label">Full name</label>
                  <input
                    className="input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Smith"
                    required
                  />
                </div>
              )}
              <div>
                <label className="label">Email</label>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@smithplumbing.com"
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="label">Password</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => { setResetMode(true); setError(null); }}
                      className="text-xs font-medium text-teal-600 hover:text-teal-700"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  minLength={6}
                  required
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-base disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? 'Please wait...'
                  : mode === 'signup'
                  ? 'Create account'
                  : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-600">
              {mode === 'signup' ? (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => setMode('signin')}
                    className="font-semibold text-teal-600 hover:text-teal-700"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <button
                    onClick={() => setMode('signup')}
                    className="font-semibold text-teal-600 hover:text-teal-700"
                  >
                    Sign up free
                  </button>
                </>
              )}
            </div>
            </>
            )}
          </div>

          <button
            onClick={() => setView('home')}
            className="mx-auto mt-6 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to website
          </button>
        </div>
      </div>
    </div>
  );
}
