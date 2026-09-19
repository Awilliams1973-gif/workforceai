import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import {
  Sparkles,
  TrendingUp,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  ArrowRight,
  DollarSign,
} from 'lucide-react';

const industries = [
  'Plumbing',
  'HVAC',
  'Electrical',
  'Roofing',
  'General Contracting',
  'Property Management',
  'Landscaping',
  'Pest Control',
  'Cleaning Services',
  'Other',
];

export default function AuditPage() {
  const { setView } = useAppStore();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    businessName: '',
    email: '',
    phone: '',
    website: '',
    industry: '',
    monthlyInquiries: '',
    unansweredInquiries: '',
    averageCustomerValue: '',
  });

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const canProceed = () => {
    if (step === 1) return form.name && form.businessName && form.email && form.industry;
    if (step === 2) return form.monthlyInquiries && form.unansweredInquiries && form.averageCustomerValue;
    return false;
  };

  const estimatedOpportunity = (() => {
    const monthly = parseInt(form.unansweredInquiries) || 0;
    const value = parseFloat(form.averageCustomerValue) || 0;
    const monthlyOpp = monthly * value * 0.4;
    return Math.round(monthlyOpp * 12);
  })();

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const { error: insertError } = await supabase.from('business_audit_submissions').insert({
        name: form.name,
        business_name: form.businessName,
        email: form.email,
        phone: form.phone || null,
        website: form.website || null,
        industry: form.industry,
        monthly_inquiries: parseInt(form.monthlyInquiries) || 0,
        unanswered_inquiries: parseInt(form.unansweredInquiries) || 0,
        average_customer_value: parseFloat(form.averageCustomerValue) || 0,
        estimated_opportunity: estimatedOpportunity,
      });

      if (insertError) throw insertError;
      setSubmitted(true);
    } catch {
      setError('Something went wrong submitting your audit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-slate-900">Your AI Audit is ready</h1>
        <p className="mt-3 text-lg text-slate-600">
          Based on what you told us, here's your estimated opportunity:
        </p>
        <div className="mt-6 w-full rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-700 p-8 text-white shadow-lg">
          <p className="text-sm font-medium text-teal-100">Estimated annual revenue opportunity</p>
          <p className="mt-2 text-5xl font-extrabold">
            ${estimatedOpportunity.toLocaleString()}
          </p>
          <p className="mt-3 text-sm text-teal-100">
            This is an estimate based on your unanswered inquiries and average customer value.
            WorkforceAI can help capture this revenue by answering every customer — day or night.
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button onClick={() => setView('auth')} className="btn-primary text-base">
            See the Product in Action
            <ArrowRight className="h-4 w-4" />
          </button>
          <button onClick={() => setView('pricing')} className="btn-secondary text-base">
            View Pricing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700 ring-1 ring-inset ring-teal-200">
          <Sparkles className="h-3.5 w-3.5" />
          Free AI Business Audit
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Find your missed revenue
        </h1>
        <p className="mt-3 text-lg text-slate-600">
          Answer a few questions and we'll show you how much revenue you're leaving on the table —
          and how AI can capture it.
        </p>
      </div>

      <div className="mt-10">
        <div className="mb-8 flex items-center justify-center gap-2">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  step >= s ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {s}
              </div>
              {s < 2 && <div className={`h-0.5 w-16 ${step > s ? 'bg-teal-600' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        <div className="card p-6 sm:p-8">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="label">Your name <span className="text-red-500">*</span></label>
                <input className="input" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="John Smith" />
              </div>
              <div>
                <label className="label">Business name <span className="text-red-500">*</span></label>
                <input className="input" value={form.businessName} onChange={(e) => update('businessName', e.target.value)} placeholder="Smith Plumbing Co." />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Email <span className="text-red-500">*</span></label>
                  <input className="input" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="john@smithplumbing.com" />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="(555) 123-4567" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Website</label>
                  <input className="input" value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="smithplumbing.com" />
                </div>
                <div>
                  <label className="label">Industry <span className="text-red-500">*</span></label>
                  <select className="input" value={form.industry} onChange={(e) => update('industry', e.target.value)}>
                    <option value="">Select industry</option>
                    {industries.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="label">How many customer inquiries do you get per month? <span className="text-red-500">*</span></label>
                <input className="input" type="number" min="0" value={form.monthlyInquiries} onChange={(e) => update('monthlyInquiries', e.target.value)} placeholder="50" />
              </div>
              <div>
                <label className="label">How many go unanswered? <span className="text-red-500">*</span></label>
                <input className="input" type="number" min="0" value={form.unansweredInquiries} onChange={(e) => update('unansweredInquiries', e.target.value)} placeholder="15" />
                <p className="mt-1.5 text-xs text-slate-500">After-hours calls, missed chats, voicemails never returned, etc.</p>
              </div>
              <div>
                <label className="label">Average customer value <span className="text-red-500">*</span></label>
                <div className="relative">
                  <DollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input className="input pl-9" type="number" min="0" value={form.averageCustomerValue} onChange={(e) => update('averageCustomerValue', e.target.value)} placeholder="350" />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">What's a typical job worth to you?</p>
              </div>

              {canProceed() && (
                <div className="rounded-xl bg-teal-50 p-4 ring-1 ring-inset ring-teal-200">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-teal-600" />
                    <p className="text-sm font-semibold text-teal-800">Your estimated opportunity</p>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-teal-700">
                    ${estimatedOpportunity.toLocaleString()}<span className="text-sm font-medium text-teal-600">/year</span>
                  </p>
                  <p className="mt-1 text-xs text-teal-600">
                    Based on {form.unansweredInquiries} unanswered inquiries × ${form.averageCustomerValue} average value, assuming 40% could be recovered.
                  </p>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="mt-6 flex justify-between">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="btn-ghost">
                Back
              </button>
            ) : <span />}
            {step < 2 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || submitting}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Calculating...' : 'Get My AI Audit'}
                {!submitting && <Sparkles className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-6 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" /> Takes 2 minutes</span>
          <span className="inline-flex items-center gap-1.5"><Mail className="h-4 w-4" /> No spam</span>
          <span className="inline-flex items-center gap-1.5"><Phone className="h-4 w-4" /> No call required</span>
        </div>
      </div>
    </div>
  );
}
