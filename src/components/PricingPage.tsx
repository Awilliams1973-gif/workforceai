import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { plans } from '@/lib/demo-data';
import { startCheckout } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, CreditCard, Download, Loader2, Zap } from 'lucide-react';

export default function PricingPage() {
  const { setView, user } = useAppStore();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState('free');

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from('subscriptions')
        .select('plan_name,status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data && data.status === 'active') {
        setCurrentPlan(data.plan_name);
      }
    })();
  }, [user]);

  async function handleSubscribe(planId: string) {
    setError(null);
    setLoadingPlan(planId);
    try {
      await startCheckout(planId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoadingPlan(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Plans & Billing</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your subscription, view invoices, and update payment.</p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Current plan */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Current plan</p>
              <p className="text-lg font-bold text-slate-900 capitalize">
                {currentPlan === 'free' ? 'Free' : currentPlan} —{' '}
                {currentPlan === 'free' ? '$0' : `$${plans.find((p) => p.id === currentPlan)?.price ?? 0}`}/month
              </p>
            </div>
          </div>
          <span className="badge bg-green-100 text-green-700">
            <CheckCircle2 className="h-3 w-3" />
            Active
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <UsageBar label="Conversations" used={847} total={2000} />
          <UsageBar label="AI employees" used={5} total={5} />
          <UsageBar label="Knowledge items" used={9} total={100} />
        </div>
      </div>

      {/* Plans */}
      <div>
        <h2 className="mb-4 text-base font-semibold text-slate-900">Available plans</h2>
        <div className="grid gap-4 lg:grid-cols-4">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const isFree = plan.price === 0;
            return (
              <div key={plan.id} className={`card relative p-5 ${isCurrent ? 'ring-2 ring-teal-600' : ''}`}>
                {isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold text-white">
                    Current
                  </span>
                )}
                <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                <p className="text-xs text-slate-500">{plan.tagline}</p>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold text-slate-900">${plan.price}</span>
                  <span className="text-sm text-slate-500">/mo</span>
                </div>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-teal-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  disabled={isCurrent || loadingPlan !== null}
                  onClick={() => (isFree ? setView('home') : handleSubscribe(plan.id))}
                  className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                    isCurrent
                      ? 'cursor-default bg-slate-100 text-slate-400'
                      : plan.highlight
                      ? 'bg-teal-600 text-white hover:bg-teal-700'
                      : 'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50'
                  } ${loadingPlan === plan.id ? 'opacity-60' : ''}`}
                >
                  {loadingPlan === plan.id && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isCurrent ? 'Current plan' : isFree ? 'Your current plan' : `Switch to ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing history */}
      <div className="card">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Billing history</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            { date: 'Aug 1, 2026', amount: '$149.00', plan: 'Growth', status: 'Paid' },
            { date: 'Jul 1, 2026', amount: '$149.00', plan: 'Growth', status: 'Paid' },
            { date: 'Jun 1, 2026', amount: '$49.00', plan: 'Starter', status: 'Paid' },
          ].map((inv, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{inv.date}</p>
                  <p className="text-xs text-slate-500">{inv.plan} plan</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="badge bg-green-100 text-green-700">{inv.status}</span>
                <span className="text-sm font-semibold text-slate-900">{inv.amount}</span>
                <button className="btn-ghost text-xs">
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <button onClick={() => setView('home')} className="text-sm text-slate-500 hover:text-slate-700">
          Cancel subscription anytime from your account settings.
        </button>
      </div>
    </div>
  );
}

function UsageBar({ label, used, total }: { label: string; used: number; total: number }) {
  const pct = Math.min(100, (used / total) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className="font-medium text-slate-700">{used} / {total}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
