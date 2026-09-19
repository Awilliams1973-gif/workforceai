import { useState } from 'react';
import { demoEmployees } from '@/lib/demo-data';
import type { AIEmployee } from '@/lib/types';
import {
  Headset,
  Handshake,
  CalendarCheck,
  Megaphone,
  Star,
  Power,
  Settings2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Phone,
  MessageSquare,
  Clock,
  Users,
} from 'lucide-react';

const employeeIcons: Record<string, typeof Headset> = {
  headset: Headset,
  handshake: Handshake,
  calendar: CalendarCheck,
  megaphone: Megaphone,
  star: Star,
};

export default function ReceptionistPage() {
  const [employees, setEmployees] = useState<AIEmployee[]>(demoEmployees);
  const receptionist = employees.find((e) => e.id === 'receptionist')!;

  const toggleStatus = (id: string) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, status: e.status === 'active' ? 'paused' : 'active' } : e)));
  };

  const Icon = employeeIcons[receptionist.icon] || Headset;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Receptionist</h1>
          <p className="mt-1 text-sm text-slate-500">Answers calls and chats 24/7, captures every lead, books appointments.</p>
        </div>
        <button
          onClick={() => toggleStatus(receptionist.id)}
          className={`btn-secondary ${receptionist.status === 'active' ? 'text-amber-600 ring-amber-200 hover:bg-amber-50' : 'text-teal-600 ring-teal-200 hover:bg-teal-50'}`}
        >
          <Power className="h-4 w-4" />
          {receptionist.status === 'active' ? 'Pause' : 'Activate'}
        </button>
      </div>

      {/* Status banner */}
      <div className={`flex items-center gap-3 rounded-xl p-4 ${
        receptionist.status === 'active' ? 'bg-green-50 ring-1 ring-inset ring-green-200' : 'bg-slate-100 ring-1 ring-inset ring-slate-200'
      }`}>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${receptionist.status === 'active' ? 'bg-green-600 text-white animate-pulse-ring' : 'bg-slate-400 text-white'}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {receptionist.status === 'active' ? 'AI Receptionist is online' : 'AI Receptionist is paused'}
          </p>
          <p className="text-xs text-slate-500">
            {receptionist.status === 'active'
              ? 'Currently answering customer chats on your website and capturing leads.'
              : 'Customers will not be answered until you reactivate.'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatBox icon={MessageSquare} label="Conversations today" value="12" color="teal" />
        <StatBox icon={Users} label="Leads captured" value="8" color="blue" />
        <StatBox icon={CalendarCheck} label="Appointments booked" value="5" color="green" />
      </div>

      {/* Channels */}
      <div className="card p-5">
        <h2 className="text-base font-semibold text-slate-900">Connected channels</h2>
        <p className="mt-1 text-sm text-slate-500">Where your AI Receptionist answers customers.</p>
        <div className="mt-4 space-y-3">
          <ChannelRow icon={MessageSquare} name="Website chat" status="connected" desc="Live on your website" />
          <ChannelRow icon={Phone} name="Phone line" status="ready" desc="Connect your existing phone number to enable AI call answering" />
          <ChannelRow icon={MessageSquare} name="SMS / Text" status="ready" desc="Enable two-way texting with customers" />
        </div>
      </div>

      {/* What it does */}
      <div className="card p-5">
        <h2 className="text-base font-semibold text-slate-900">What your AI Receptionist does</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { icon: MessageSquare, title: 'Answers questions', desc: 'Uses your knowledge base to answer FAQs, pricing, hours, and service questions.' },
            { icon: Users, title: 'Captures leads', desc: 'Collects name, phone, email, and service needed for every inquiry.' },
            { icon: CalendarCheck, title: 'Books appointments', desc: 'Offers available slots and confirms bookings automatically.' },
            { icon: Headset, title: 'Hands off to you', desc: 'Escalates complex issues with a full conversation summary.' },
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

      {/* Other AI employees */}
      <div className="card p-5">
        <h2 className="text-base font-semibold text-slate-900">Other AI employees</h2>
        <div className="mt-4 space-y-3">
          {employees.filter((e) => e.id !== 'receptionist').map((emp) => {
            const EIcon = employeeIcons[emp.icon] || Headset;
            return (
              <div key={emp.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 hover:bg-slate-50">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${emp.status === 'active' ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-400'}`}>
                  <EIcon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{emp.name}</p>
                  <p className="text-xs text-slate-500">{emp.role}</p>
                </div>
                <span className={`badge ${emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {emp.status === 'active' ? 'Active' : 'Setup'}
                </span>
                <ArrowRight className="h-4 w-4 text-slate-300" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatBox({ icon: Icon, label, value, color }: { icon: typeof Users; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    teal: 'bg-teal-50 text-teal-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
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

function ChannelRow({ icon: Icon, name, status, desc }: { icon: typeof Phone; name: string; status: 'connected' | 'ready'; desc: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${status === 'connected' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900">{name}</p>
          <p className="text-xs text-slate-500">{desc}</p>
        </div>
      </div>
      {status === 'connected' ? (
        <span className="badge bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3" /> Connected</span>
      ) : (
        <button className="btn-ghost text-xs">
          <Settings2 className="h-3.5 w-3.5" />
          Connect
        </button>
      )}
    </div>
  );
}
