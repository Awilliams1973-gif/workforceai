import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PLANS, startCheckout, type PlanId } from '@/lib/stripe';
import { Check } from 'lucide-react';

type Subscription = {
  plan_name: string;
  status: string;
  current_period_end: string | null;
};

export default function BillingPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error: loadError } = await supabase
        .from('subscriptions')
        .select('plan_name,status,current_period_end')
        .in('status', ['active', 'trialing', 'past_due'])
        .order('updated_at', { ascending: false })
        .limit(1);
      if (loadError) setError('Could not load your subscription status.');
      setSub((data?.[0] as Subscription | undefined) ?? null);
      setLoading(false);
    })();
  }, []);

  const subscribe = async (planId: PlanId) => {
    setError(null);
    setPending(planId);
    try {
      await startCheckout(planId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout.');
      setPending(null);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading billing…</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Plans &amp; Billing</h1>
        <p className="mt-1 text-sm text-slate-500">Cancel anytime. No long-term contracts.</p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {sub && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          Current plan: <strong className="capitalize">{sub.plan_name}</strong> ({sub.status.replace('_', ' ')})
          {sub.current_period_end && <> · renews {new Date(sub.current_period_end).toLocaleDateString()}</>}
          {sub.status === 'past_due' && <> · payment failed, please contact support to update your card.</>}
          <p className="mt-1 text-xs text-teal-800">To change or cancel your plan, contact support.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {PLANS.map((plan) => {
          const isCurrent = sub?.plan_name === plan.id;
          return (
            <div key={plan.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">{plan.name}</h2>
              <p className="mt-1 text-3xl font-bold text-slate-900">
                ${plan.price}
                <span className="text-sm font-normal text-slate-500">/month</span>
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-600">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-600" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => subscribe(plan.id)}
                disabled={isCurrent || sub !== null || pending !== null}
                className="mt-6 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCurrent ? 'Current plan' : pending === plan.id ? 'Redirecting…' : `Subscribe to ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
