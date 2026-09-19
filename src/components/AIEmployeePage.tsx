import { useState } from 'react';
import { demoEmployees } from '@/lib/demo-data';
import type { AIEmployee } from '@/lib/types';
import {
  Handshake,
  CalendarCheck,
  Megaphone,
  Star,
  Power,
  CheckCircle2,
  Clock,
  Users,
  TrendingUp,
  Mail,
  MessageSquare,
  Send,
  Sparkles,
} from 'lucide-react';

const employeeIcons: Record<string, typeof Handshake> = {
  handshake: Handshake,
  calendar: CalendarCheck,
  megaphone: Megaphone,
  star: Star,
};

type Props = {
  employeeId: 'sales' | 'appointments-assistant' | 'marketing' | 'reviews';
};

export default function AIEmployeePage({ employeeId }: Props) {
  const [employees] = useState<AIEmployee[]>(demoEmployees);
  const idMap: Record<string, string> = {
    'sales': 'sales',
    'appointments-assistant': 'appointments',
    'marketing': 'marketing',
    'reviews': 'reviews',
  };
  const employee = employees.find((e) => e.id === idMap[employeeId])!;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{employee.name}</h1>
          <p className="mt-1 text-sm text-slate-500">{employee.description}</p>
        </div>
        <StatusBadge status={employee.status} />
      </div>

      {employeeId === 'sales' && <SalesContent employee={employee} />}
      {employeeId === 'appointments-assistant' && <AppointmentsContent employee={employee} />}
      {employeeId === 'marketing' && <MarketingContent employee={employee} />}
      {employeeId === 'reviews' && <ReviewsContent employee={employee} />}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === 'active' ? 'bg-green-500' : 'bg-slate-400'}`} />
      {status === 'active' ? 'Active' : 'Ready to activate'}
    </span>
  );
}

function StatBox({ icon: Icon, label, value, color }: { icon: typeof Users; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    teal: 'bg-teal-50 text-teal-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="card p-4">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colors[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function SalesContent({ employee }: { employee: AIEmployee }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatBox icon={Users} label="Leads followed up" value={employee.conversations.toString()} color="teal" />
        <StatBox icon={CheckCircle2} label="Leads qualified" value={employee.actions.toString()} color="green" />
        <StatBox icon={TrendingUp} label="Avg. response time" value="2 min" color="blue" />
      </div>

      <div className="card p-5">
        <h2 className="text-base font-semibold text-slate-900">How the AI Sales Assistant works</h2>
        <div className="mt-4 space-y-3">
          {[
            { icon: Mail, title: 'Follows up automatically', desc: 'Sends a personalized follow-up to every new lead within minutes.' },
            { icon: MessageSquare, title: 'Answers pricing questions', desc: 'Uses your knowledge base to handle pricing and service questions.' },
            { icon: CheckCircle2, title: 'Qualifies leads', desc: 'Asks the right questions to identify ready-to-book customers.' },
            { icon: TrendingUp, title: 'Hands off hot leads', desc: 'Escalates qualified leads to you with a summary and recommended next step.' },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{f.title}</p>
                <p className="text-xs text-slate-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-base font-semibold text-slate-900">Recent follow-ups</h2>
        <div className="mt-3 space-y-2">
          {[
            { name: 'James Okafor', action: 'Quote sent', time: '2 hours ago' },
            { name: 'David Kim', action: 'Follow-up email sent', time: '5 hours ago' },
            { name: 'Linda Chen', action: 'Qualified — maintenance plan', time: 'Yesterday' },
          ].map((f, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{f.name}</p>
                  <p className="text-xs text-slate-500">{f.action}</p>
                </div>
              </div>
              <span className="text-xs text-slate-400">{f.time}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function AppointmentsContent({ employee }: { employee: AIEmployee }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatBox icon={CalendarCheck} label="Booked this week" value={employee.actions.toString()} color="teal" />
        <StatBox icon={CheckCircle2} label="Confirmed" value="6" color="green" />
        <StatBox icon={Clock} label="Reminders sent" value="14" color="blue" />
      </div>

      <div className="card p-5">
        <h2 className="text-base font-semibold text-slate-900">How the AI Appointment Assistant works</h2>
        <div className="mt-4 space-y-3">
          {[
            { icon: CalendarCheck, title: 'Offers available slots', desc: 'Shows customers your real availability and lets them pick.' },
            { icon: Send, title: 'Sends confirmations', desc: 'Automatically sends a confirmation message when a booking is made.' },
            { icon: Clock, title: 'Sends reminders', desc: 'Reminds customers 24 hours before their appointment to reduce no-shows.' },
            { icon: CalendarCheck, title: 'Handles reschedules', desc: 'Lets customers reschedule without back-and-forth phone calls.' },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{f.title}</p>
                <p className="text-xs text-slate-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-base font-semibold text-slate-900">Calendar connection</h2>
        <p className="mt-1 text-sm text-slate-500">Connect your calendar so the AI can see real availability.</p>
        <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Google Calendar</p>
              <p className="text-xs text-slate-500">Connect to sync availability</p>
            </div>
          </div>
          <button className="btn-ghost text-xs">Connect</button>
        </div>
      </div>
    </>
  );
}

function MarketingContent({ employee }: { employee: AIEmployee }) {
  return (
    <>
      <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 ring-1 ring-inset ring-amber-200">
        <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
        <p className="text-sm text-amber-800">
          The AI Marketing Assistant drafts campaigns for your approval. Nothing is ever sent without you saying yes.
        </p>
      </div>

      <div className="card p-5">
        <h2 className="text-base font-semibold text-slate-900">How the AI Marketing Assistant works</h2>
        <div className="mt-4 space-y-3">
          {[
            { icon: Megaphone, title: 'Drafts seasonal campaigns', desc: 'Suggests campaigns for busy seasons, holidays, and slow periods.' },
            { icon: MessageSquare, title: 'Writes follow-up messages', desc: 'Creates follow-up sequences for leads that haven\'t booked yet.' },
            { icon: CheckCircle2, title: 'You approve everything', desc: 'Review and edit every message before it goes out.' },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{f.title}</p>
                <p className="text-xs text-slate-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-base font-semibold text-slate-900">Suggested campaigns</h2>
        <p className="mt-1 text-sm text-slate-500">Drafts ready for your review.</p>
        <div className="mt-4 space-y-3">
          {[
            { title: 'Pre-winter furnace tune-up', desc: 'Target past customers with a seasonal maintenance reminder.', type: 'Email campaign' },
            { title: 'Follow-up: unbooked leads', desc: 'Re-engage 12 leads from the last 30 days that didn\'t book.', type: 'SMS sequence' },
          ].map((c, i) => (
            <div key={i} className="rounded-xl border border-slate-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{c.title}</p>
                  <p className="text-xs text-slate-500">{c.desc}</p>
                </div>
                <span className="badge bg-slate-100 text-slate-600">{c.type}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <button className="btn-primary text-xs">Review & approve</button>
                <button className="btn-ghost text-xs">Edit draft</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ReviewsContent({ employee }: { employee: AIEmployee }) {
  return (
    <>
      <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 ring-1 ring-inset ring-amber-200">
        <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
        <p className="text-sm text-amber-800">
          The AI Review Manager requests reviews from happy customers and drafts responses for your approval.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatBox icon={Star} label="Review requests sent" value="23" color="amber" />
        <StatBox icon={CheckCircle2} label="Reviews received" value="9" color="green" />
        <StatBox icon={Star} label="Average rating" value="4.8" color="teal" />
      </div>

      <div className="card p-5">
        <h2 className="text-base font-semibold text-slate-900">How the AI Review Manager works</h2>
        <div className="mt-4 space-y-3">
          {[
            { icon: Star, title: 'Requests reviews', desc: 'Automatically asks happy customers for a review after completed jobs.' },
            { icon: MessageSquare, title: 'Drafts responses', desc: 'Writes professional responses to reviews for your approval.' },
            { icon: CheckCircle2, title: 'You approve everything', desc: 'No review response goes out without your say-so.' },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{f.title}</p>
                <p className="text-xs text-slate-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-base font-semibold text-slate-900">Reviews needing a response</h2>
        <div className="mt-3 space-y-3">
          {[
            { name: 'Robert H.', rating: 5, text: 'Great service, on time and professional!', time: '2 days ago' },
            { name: 'Eddie T.', rating: 4, text: 'Good work but arrived a bit late.', time: '5 days ago' },
          ].map((r, i) => (
            <div key={i} className="rounded-xl border border-slate-100 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex">{Array.from({ length: 5 }).map((_, j) => <Star key={j} className={`h-4 w-4 ${j < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />)}</div>
                  <span className="text-sm font-medium text-slate-900">{r.name}</span>
                </div>
                <span className="text-xs text-slate-400">{r.time}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">"{r.text}"</p>
              <div className="mt-3 flex gap-2">
                <button className="btn-primary text-xs">Review AI draft</button>
                <button className="btn-ghost text-xs">Write my own</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
