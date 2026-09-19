import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { plans, demoEmployees } from '@/lib/demo-data';
import { startCheckout } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import {
  Headset,
  Handshake,
  CalendarCheck,
  Megaphone,
  Star,
  Phone,
  MessageSquare,
  Clock,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Wrench,
  Flame,
  Zap,
  Home,
  Hammer,
  Building2,
  ChevronDown,
} from 'lucide-react';

const employeeIcons: Record<string, typeof Headset> = {
  headset: Headset,
  handshake: Handshake,
  calendar: CalendarCheck,
  megaphone: Megaphone,
  star: Star,
};

const industries = [
  { icon: Wrench, name: 'Plumbing' },
  { icon: Flame, name: 'HVAC' },
  { icon: Zap, name: 'Electrical' },
  { icon: Home, name: 'Roofing' },
  { icon: Hammer, name: 'General Contractors' },
  { icon: Building2, name: 'Property Management' },
];

const faqs = [
  {
    q: 'How does the AI answer my customers?',
    a: 'The AI Receptionist learns from your business knowledge base — services, prices, hours, service areas, and FAQs. It answers questions, captures leads, and books appointments in your voice, 24/7.',
  },
  {
    q: 'Will it sound like a robot to my customers?',
    a: 'No. The AI is trained on your business details and speaks naturally. Customers get helpful, specific answers — not generic scripts. You can review and refine the knowledge base anytime.',
  },
  {
    q: 'What if the AI can\'t handle a question?',
    a: 'The AI hands off to you or your team with a full conversation summary. You can take over anytime from the conversation center. The customer never gets stuck.',
  },
  {
    q: 'Do I need to replace my phone system?',
    a: 'No. The AI Receptionist works on your website chat first, and can connect to your existing phone line when you\'re ready. External connections are clearly marked in settings.',
  },
  {
    q: 'How much does it cost?',
    a: 'Start free with the AI Receptionist on your website. Paid plans begin at $49/month for solo owners and scale up for multi-location operations. See pricing below.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. There are no long-term contracts. You can upgrade, downgrade, or cancel from your account settings at any time.',
  },
];

export default function LandingPage() {
  const { setView, user } = useAppStore();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  async function handlePlanClick(planId: string, price: number) {
    if (price === 0) {
      setView('auth');
      return;
    }
    if (!user) {
      setView('auth');
      return;
    }
    setCheckoutError(null);
    setLoadingPlan(planId);
    try {
      await startCheckout(planId);
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Something went wrong');
      setLoadingPlan(null);
    }
  }

  return (
    <div className="bg-white">
      <Hero />
      <TrustBar />
      <HowItWorks />
      <AIEmployeesSection />
      <IndustriesSection />
      <StatsSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
    </div>
  );

  function Hero() {
    return (
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-teal-50 via-white to-white" />
        <div className="absolute right-0 top-0 -z-10 h-[600px] w-[600px] rounded-full bg-teal-100/40 blur-3xl" />
        <div className="absolute left-1/4 top-1/3 -z-10 h-[400px] w-[400px] rounded-full bg-cyan-100/30 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700 ring-1 ring-inset ring-teal-200">
                <Sparkles className="h-3.5 w-3.5" />
                AI employees for local service businesses
              </div>
              <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Your AI Employee for{' '}
                <span className="text-teal-600">growing your business</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-slate-600">
                Never miss a customer again. AI employees that answer calls and chats, book
                appointments, follow up with leads, and request reviews — 24 hours a day, 7 days a
                week.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button onClick={() => setView('audit')} className="btn-primary text-base">
                  <Sparkles className="h-5 w-5" />
                  Get Your Free AI Audit
                </button>
                <button onClick={() => setView('auth')} className="btn-secondary text-base">
                  See Live Demo
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-6 flex items-center gap-4 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-teal-600" /> Free to start</span>
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-teal-600" /> No credit card</span>
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-teal-600" /> Cancel anytime</span>
              </div>
            </div>

            <HeroVisual />
          </div>
        </div>
      </section>
    );
  }

  function HeroVisual() {
    return (
      <div className="relative animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        <div className="card overflow-hidden p-0 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
            </div>
            <span className="ml-2 text-xs font-medium text-slate-500">AI Receptionist — Live Chat</span>
            <span className="ml-auto flex items-center gap-1 text-xs font-medium text-green-600">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Online
            </span>
          </div>
          <div className="space-y-3 p-5">
            <div className="flex justify-end">
              <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-teal-600 px-4 py-2.5 text-sm text-white">
                Hi, I have a kitchen pipe leaking. Can someone come today?
              </div>
            </div>
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2.5 text-sm text-slate-800">
                I'm sorry to hear that! We offer same-day emergency service in your area. I can have
                a technician out at 2:30 PM today. Shall I book that?
              </div>
            </div>
            <div className="flex justify-end">
              <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-teal-600 px-4 py-2.5 text-sm text-white">
                Yes please. How much is the call-out fee?
              </div>
            </div>
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2.5 text-sm text-slate-800">
                Our emergency call-out is $120, credited toward any repair work. The technician will
                give a full quote before starting. You're booked for 2:30 PM today.
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-teal-50 px-3 py-2 text-xs font-medium text-teal-700">
              <CheckCircle2 className="h-4 w-4" />
              Lead captured · Appointment booked · Confirmation sent
            </div>
          </div>
        </div>
        <div className="absolute -bottom-4 -left-4 hidden rounded-xl bg-white p-3 shadow-lg ring-1 ring-slate-200 sm:block">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Leads this week</p>
              <p className="text-sm font-bold text-slate-900">+47</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function TrustBar() {
    return (
      <section className="border-y border-slate-200 bg-slate-50 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
            Built for local service businesses
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-semibold text-slate-400">
            <span>Plumbing</span>
            <span className="text-slate-300">•</span>
            <span>HVAC</span>
            <span className="text-slate-300">•</span>
            <span>Electrical</span>
            <span className="text-slate-300">•</span>
            <span>Roofing</span>
            <span className="text-slate-300">•</span>
            <span>Contractors</span>
            <span className="text-slate-300">•</span>
            <span>Property Mgmt</span>
          </div>
        </div>
      </section>
    );
  }

  function HowItWorks() {
    const steps = [
      {
        icon: MessageSquare,
        title: 'Customer reaches out',
        desc: 'A customer calls, chats on your website, or texts — any time, day or night.',
      },
      {
        icon: Headset,
        title: 'AI employee responds',
        desc: 'Your AI Receptionist answers instantly, using your business knowledge to help.',
      },
      {
        icon: CalendarCheck,
        title: 'Lead captured & booked',
        desc: 'The AI qualifies the lead, collects details, and books the appointment automatically.',
      },
      {
        icon: TrendingUp,
        title: 'You grow',
        desc: 'You see everything in your dashboard. More leads, more bookings, more revenue.',
      },
    ];

    return (
      <section id="how-it-works" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              From first contact to booked appointment — without you lifting a finger.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <div key={i} className="card p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <step.icon className="h-6 w-6" />
                </div>
                <div className="mt-4 text-xs font-bold uppercase tracking-wider text-teal-600">
                  Step {i + 1}
                </div>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  function AIEmployeesSection() {
    return (
      <section id="ai-employees" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Meet your AI employees
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Five specialized AI workers, ready to hire. Start with one or activate them all.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {demoEmployees.map((emp) => {
              const Icon = employeeIcons[emp.icon] || Headset;
              return (
                <div key={emp.id} className="card p-6 transition-all duration-200 hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className={`badge ${emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${emp.status === 'active' ? 'bg-green-500' : 'bg-slate-400'}`} />
                      {emp.status === 'active' ? 'Active' : 'Ready to activate'}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{emp.name}</h3>
                  <p className="text-sm font-medium text-teal-600">{emp.role}</p>
                  <p className="mt-2 text-sm text-slate-600">{emp.description}</p>
                </div>
              );
            })}
            <div className="card flex flex-col items-center justify-center p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">More on the way</h3>
              <p className="mt-2 text-sm text-slate-500">
                We're adding new AI employees based on what our customers need most.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  function IndustriesSection() {
    return (
      <section id="industries" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Built for your trade
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              WorkforceAI learns your services, prices, and service area — so it speaks your
              customers' language.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {industries.map((ind) => (
              <div key={ind.name} className="card flex flex-col items-center p-6 text-center transition-all hover:shadow-md">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                  <ind.icon className="h-7 w-7" />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">{ind.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  function StatsSection() {
    const stats = [
      { value: '24/7', label: 'Always available' },
      { value: '<5s', label: 'Average response time' },
      { value: '0', label: 'Missed calls' },
      { value: '3x', label: 'More leads captured' },
    ];
    return (
      <section className="bg-teal-700 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-4xl font-extrabold text-white sm:text-5xl">{s.value}</p>
                <p className="mt-2 text-sm font-medium text-teal-100">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  function PricingSection() {
    return (
      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Simple, honest pricing
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Start free. Upgrade when you're ready. Cancel anytime.
            </p>
          </div>
          {checkoutError && (
            <div className="mx-auto mt-6 max-w-md rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-700">
              {checkoutError}
            </div>
          )}
          <div className="mt-12 grid gap-6 lg:grid-cols-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`card relative p-6 ${plan.highlight ? 'ring-2 ring-teal-600 shadow-lg' : ''}`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold text-white">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{plan.tagline}</p>
                <div className="mt-4">
                  <span className="text-4xl font-extrabold text-slate-900">${plan.price}</span>
                  <span className="text-sm font-medium text-slate-500">/mo</span>
                </div>
                <ul className="mt-5 space-y-2.5">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handlePlanClick(plan.id, plan.price)}
                  disabled={loadingPlan !== null}
                  className={`mt-6 flex w-full items-center justify-center gap-2 ${plan.highlight ? 'btn-primary' : 'btn-secondary'} ${loadingPlan === plan.id ? 'opacity-60' : ''}`}
                >
                  {loadingPlan === plan.id && <Loader2 className="h-4 w-4 animate-spin" />}
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  function FAQSection() {
    return (
      <section id="faq" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Frequently asked questions
            </h2>
          </div>
          <div className="mt-10 space-y-3">
            {faqs.map((faq, i) => (
              <details key={i} className="card group p-5">
                <summary className="flex cursor-pointer items-center justify-between text-base font-semibold text-slate-900">
                  {faq.q}
                  <ChevronDown className="h-5 w-5 text-slate-400 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    );
  }

  function CTASection() {
    return (
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-8 py-14 text-center sm:px-16">
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-teal-600/20 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-cyan-600/20 blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Find out how much revenue you're leaving on the table
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
                Get a free AI Business Audit. We'll show you exactly how many customers you're
                missing and how WorkforceAI can capture them.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <button onClick={() => setView('audit')} className="btn-primary text-base">
                  <Sparkles className="h-5 w-5" />
                  Get Your Free AI Audit
                </button>
                <button onClick={() => setView('auth')} className="btn-secondary text-base">
                  View Pricing
                </button>
              </div>
              <div className="mt-6 flex items-center justify-center gap-6 text-sm text-slate-400">
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> No credit card</span>
                <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" /> 2-minute setup</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
}
