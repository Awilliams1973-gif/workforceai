import { useState, useEffect } from 'react';
import { supabase, supabaseConfigured, SUPABASE_CONFIG_MESSAGE } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { Headset, ArrowLeft, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

type AuthPageProps = {
  passwordRecovery?: boolean;
  onPasswordRecoveryComplete?: () => void;
};

const MIN_PASSWORD_LENGTH = 10;
const PASSWORD_HINT = `At least ${MIN_PASSWORD_LENGTH} characters, with letters and numbers`;

function passwordPolicyError(value: string): string | null {
  if (value.length < MIN_PASSWORD_LENGTH || !/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters and include letters and numbers.`;
  }
  return null;
}

export default function AuthPage({
  passwordRecovery = false,
  onPasswordRecoveryComplete,
}: AuthPageProps) {
  const { setView, setUser, setIsAdmin } = useAppStore();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  useEffect(() => {
    setError(null);
  }, [mode]);

  if (!supabaseConfigured) {
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
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Sign-in setup required</h1>
            <p className="mt-3 text-slate-600">{SUPABASE_CONFIG_MESSAGE}</p>
            <p className="mt-3 text-sm text-slate-500">
              Add these values to your local environment and reload the app to enable account creation and dashboard access.
            </p>
            <button
              type="button"
              onClick={() => setView('home')}
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-teal-700"
            >
              Return home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const normalizeAuthError = (err: unknown, context: 'signin' | 'email' = 'signin') => {
    const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';

    if (/rate limit|too many requests|429/i.test(msg)) {
      return context === 'email'
        ? 'Too many emails have been requested. Please wait a while before requesting another link.'
        : 'Too many sign-in attempts. Please wait a few minutes and try again.';
    }

    return msg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const policyError = passwordPolicyError(password);
        if (policyError) {
          setError(policyError);
          setLoading(false);
          return;
        }
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, business_name: businessName } },
        });
        if (signUpError) throw signUpError;
        if (data.user && data.session) {
          setUser(data.user);
          setIsAdmin(false);
          setView('dashboard');
        } else if (data.user) {
          setError('Check your email to confirm your account before signing in.');
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        if (data.user) {
          setUser(data.user);
          setIsAdmin(false);
        }
        setView('dashboard');
      }
    } catch (err) {
      setError(normalizeAuthError(err));
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
      setError(normalizeAuthError(err, 'email'));
    } finally {
      setResetLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }
    const policyError = passwordPolicyError(newPassword);
    if (policyError) {
      setError(policyError);
      return;
    }

    setResetLoading(true);
    setError(null);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      onPasswordRecoveryComplete?.();
      setView('dashboard');
    } catch (err) {
      setError(normalizeAuthError(err));
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
              {passwordRecovery ? 'Choose a new password' : mode === 'signup' ? 'Create your account' : 'Welcome back'}
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
              {passwordRecovery
                ? 'Set a new password'
                : mode === 'signup'
                ? 'Start your free trial'
                : 'Sign in to your dashboard'}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {passwordRecovery
                ? 'Choose a new password for your account.'
                : mode === 'signup'
                ? 'No credit card required. Get started in under 2 minutes.'
                : 'Access your AI employees and dashboard.'}
            </p>
          </div>

          <div className="card p-6 sm:p-8">
            {passwordRecovery ? (
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label htmlFor="new-password" className="label">New password</label>
                  <input
                    id="new-password"
                    className="input"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={PASSWORD_HINT}
                    minLength={MIN_PASSWORD_LENGTH}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="confirm-new-password" className="label">Confirm new password</label>
                  <input
                    id="confirm-new-password"
                    className="input"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Enter your new password again"
                    minLength={6}
                    autoComplete="new-password"
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
                  {resetLoading ? 'Updating...' : 'Update password'}
                </button>
              </form>
            ) : resetMode ? (
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
                      <label htmlFor="reset-email" className="label">Email</label>
                      <input
                        id="reset-email"
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
                <>
                  <div>
                    <label htmlFor="signup-full-name" className="label">Full name</label>
                    <input
                      id="signup-full-name"
                      className="input"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Smith"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="signup-business-name" className="label">Business name</label>
                    <input
                      id="signup-business-name"
                      className="input"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Smith Plumbing Co."
                      required
                    />
                  </div>
                </>
              )}
              <div>
                <label htmlFor="auth-email" className="label">Email</label>
                <input
                  id="auth-email"
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
                  <label htmlFor="auth-password" className="label">Password</label>
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
                  id="auth-password"
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? PASSWORD_HINT : 'Your password'}
                  minLength={mode === 'signup' ? MIN_PASSWORD_LENGTH : undefined}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
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
