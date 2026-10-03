import { CheckCircle2, Zap } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: '$49',
    period: '/month',
    description: 'Perfect for small businesses',
    features: [
      'Up to 100 leads/month',
      'Basic AI Receptionist',
      'Email support',
      '1 user account',
    ],
  },
  {
    name: 'Professional',
    price: '$149',
    period: '/month',
    description: 'For growing businesses',
    features: [
      'Unlimited leads',
      'Advanced AI employees',
      'Priority support',
      'Up to 5 user accounts',
      'Custom integrations',
    ],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'pricing',
    description: 'For large organizations',
    features: [
      'Everything in Professional',
      'Dedicated support',
      'Custom development',
      'Unlimited user accounts',
      'SLA guarantee',
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Simple, transparent pricing</h1>
        <p className="mt-2 text-lg text-slate-600">Choose the plan that fits your business. Upgrade or downgrade anytime.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-xl border-2 p-6 ${
              plan.highlighted
                ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-100'
                : 'border-slate-200 bg-white'
            }`}
          >
            {plan.highlighted && (
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-teal-600 px-3 py-1 text-sm font-semibold text-white">
                <Zap className="h-3.5 w-3.5" />
                Most popular
              </div>
            )}

            <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
            <p className="mt-1 text-sm text-slate-600">{plan.description}</p>

            <div className="mt-4">
              <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
              <span className="text-sm text-slate-600">{plan.period}</span>
            </div>

            <button
              className={`mt-6 w-full rounded-lg px-4 py-2 font-semibold transition-colors ${
                plan.highlighted
                  ? 'bg-teal-600 text-white hover:bg-teal-700'
                  : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
              }`}
            >
              Get started
            </button>

            <div className="mt-6 space-y-3 border-t border-slate-200 pt-6">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-teal-600" />
                  <span className="text-sm text-slate-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-blue-50 p-6 text-center">
        <h3 className="text-lg font-semibold text-blue-900">Need a custom plan?</h3>
        <p className="mt-1 text-blue-700">Contact our sales team for enterprise solutions and custom pricing.</p>
        <button className="mt-4 rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700">
          Contact sales
        </button>
      </div>
    </div>
  );
}
