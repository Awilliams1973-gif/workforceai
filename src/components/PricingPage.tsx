import { CheckCircle2, Zap } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: '$99',
    description: 'Perfect for small businesses',
    features: ['Up to 100 leads/month', 'Basic AI Receptionist', 'Email support'],
  },
  {
    name: 'Professional',
    price: '$299',
    description: 'For growing businesses',
    features: ['Unlimited leads', 'Full AI Suite', 'Phone support', 'Custom integrations'],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large teams',
    features: ['Everything in Pro', 'Dedicated support', 'SLA guarantee', 'Custom features'],
  },
];

export default function PricingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Plans & Billing</h1>
        <p className="mt-1 text-sm text-slate-500">Choose the perfect plan for your business. Pricing coming soon with Stripe integration.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-xl border p-6 transition-all ${
              plan.popular
                ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-200'
                : 'border-slate-200 bg-white'
            }`}
          >
            {plan.popular && (
              <div className="mb-3 inline-block rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold text-white">
                Most Popular
              </div>
            )}
            <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
            <div className="mt-4">
              <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
              {plan.price !== 'Custom' && <span className="text-sm text-slate-500">/month</span>}
            </div>
            <button
              disabled
              className="btn-primary mt-6 w-full opacity-50 cursor-not-allowed"
            >
              Coming Soon
            </button>
            <ul className="mt-6 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-teal-600" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-gradient-to-r from-teal-50 to-blue-50 p-6 ring-1 ring-inset ring-teal-200">
        <div className="flex gap-3">
          <Zap className="h-5 w-5 text-teal-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-slate-900">Custom pricing available</h3>
            <p className="mt-1 text-sm text-slate-600">Contact our sales team for enterprise plans with custom features and pricing.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
