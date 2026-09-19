import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { demoEmployees } from '@/lib/demo-data';
import {
  Users,
  CalendarDays,
  MessageSquare,
  TrendingUp,
  Clock,
  Headset,
  Handshake,
  CalendarCheck,
  Megaphone,
  Star,
  CheckCircle2,
  Phone,
  DollarSign,
  Inbox,
} from 'lucide-react';

const employeeIcons: Record<string, typeof Headset> = {
  headset: Headset,
  handshake: Handshake,
  calendar: CalendarCheck,
  megaphone: Megaphone,
  star: Star,
};

type Lead = {
  id: string;
  name: string;
  service: string;
  source: string;
  status: string;
  value: number;
  next_follow_up: string;
  created_at: string;
};

type Appointment = {
  id: string;
  customer_name: string;
  service: string;
  date: string;
  time: string;
  status: string;
};

type Conversation = {
  id: string;
  visitor_name: string | null;
  status: string;
  created_at: string;
};

export default function DashboardHome() {
  const { setView, user } = useAppStore();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutMsg, setCheckoutMsg] = useState<{ type: 'success' | 'cancel'; text: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      setCheckoutMsg({ type: 'success', text: 'Subscription activated! Your plan is now active.' });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('checkout') === 'cancelled') {
      setCheckoutMsg({ type: 'cancel', text: 'Checkout was cancelled. You can try again anytime.' });
      window.history.replaceState({}, '', window.location.pathname);
    }

    (async () => {
      const [leadsRes, apptsRes, convosRes] = await Promise.all([
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('appointments').select('*').order('created_at', { ascending: false }),
        supabase.from('chat_conversations').select('*').order('created_at', { ascending: false }),
      ]);

      if (leadsRes.data) setLeads(leadsRes.data as Lead[]);
      if (apptsRes.data) setAppointments(apptsRes.data as Appointment[]);
      if (convosRes.data) setConversations(convosRes.data as Conversation[]);
      setLoading(false);
    })();
  }, []);

  const newLeads = leads.filter((l) => l.status === 'new').length;
  const totalLeads = leads.length;
  const upcomingAppts = appointments.filter((a) => a.status === 'scheduled' || a.status === 'confirmed');
  const activeConvos = conversations.filter((c) => c.status === 'active' || c.status === 'awaiting_human');
  const pipelineValue = leads
    .filter((l) => l.status === 'new' || l.status === 'contacted' || l.status === 'qualified')
    .reduce((sum, l) => sum + Number(l.value), 0);
  const estimatedRevenue = leads
    .filter((l) => l.status === 'won' || l.status === 'qualified')
    .reduce((sum, l) => sum + Number(l.value), 0);

  const firstName = user?.email?.split('@')[0] || 'there';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {checkoutMsg && (
        <div className={`rounded-xl px-4 py-3 text-sm ${checkoutMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
          {checkoutMsg.text}
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 capitalize">Good morning, {firstName}</h1>
        <p className="mt-1 text-sm text-slate-500">Here's what your AI employees have been doing.</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="New leads" value={newLeads.toString()} sub={`${totalLeads} total in pipeline`} color="teal" />
        <StatCard icon={CalendarDays} label="Upcoming appointments" value={upcomingAppts.length.toString()} sub="Scheduled & confirmed" color="blue" />
        <StatCard icon={MessageSquare} label="Active conversations" value={activeConvos.length.toString()} sub={activeConvos.length > 0 ? 'Needs attention' : 'All caught up'} color="amber" />
        <StatCard icon={DollarSign} label="Pipeline value" value={`$${pipelineValue.toLocaleString()}`} sub="Estimated, not guaranteed" color="green" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Opportunities */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">Opportunities needing attention</h2>
            <button onClick={() => setView('leads')} className="text-sm font-medium text-teal-600 hover:text-teal-700">
              View all
            </button>
          </div>
          {leads.filter((l) => l.status === 'new' || l.status === 'contacted').length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <Inbox className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm text-slate-500">No leads need attention right now.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {leads.filter((l) => l.status === 'new' || l.status === 'contacted').slice(0, 4).map((lead) => (
                <div key={lead.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                      {lead.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{lead.name}</p>
                      <p className="text-xs text-slate-500">{lead.service} · {lead.source}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">${Number(lead.value).toLocaleString()}</p>
                      <p className="text-xs text-slate-500">{lead.next_follow_up || 'No follow-up'}</p>
                    </div>
                    <StatusBadge status={lead.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Activity */}
        <div className="card">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">Your AI employees</h2>
          </div>
          <div className="space-y-3 p-4">
            {demoEmployees.map((emp) => {
              const Icon = employeeIcons[emp.icon] || Headset;
              return (
                <div key={emp.id} className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${emp.status === 'active' ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-400'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{emp.name}</p>
                    <p className="text-xs text-slate-500">{emp.conversations} conversations · {emp.actions} actions</p>
                  </div>
                  <span className={`badge ${emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${emp.status === 'active' ? 'bg-green-500' : 'bg-slate-400'}`} />
                    {emp.status === 'active' ? 'Active' : 'Setup'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upcoming appointments */}
      <div className="card">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Upcoming appointments</h2>
          <button onClick={() => setView('appointments')} className="text-sm font-medium text-teal-600 hover:text-teal-700">
            View all
          </button>
        </div>
        {upcomingAppts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <CalendarDays className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm text-slate-500">No upcoming appointments.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {upcomingAppts.map((appt) => (
              <div key={appt.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="flex w-14 flex-col items-center rounded-lg bg-slate-50 py-1.5">
                    <span className="text-xs font-medium text-slate-500">{appt.date}</span>
                    <span className="text-sm font-bold text-slate-900">{appt.time}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{appt.customer_name}</p>
                    <p className="text-xs text-slate-500">{appt.service}</p>
                  </div>
                </div>
                <span className={`badge ${
                  appt.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {appt.status === 'confirmed' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  {appt.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Revenue summary */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Closed & qualified revenue</p>
              <p className="text-2xl font-bold text-slate-900">${estimatedRevenue.toLocaleString()}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Estimated from leads marked as won or qualified. Actual revenue may differ.
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Conversations captured by AI</p>
              <p className="text-2xl font-bold text-slate-900">{conversations.length}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            {activeConvos.length} active · {conversations.length - activeConvos.length} closed
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: typeof Users; label: string; value: string; sub: string; color: string }) {
  const colors: Record<string, string> = {
    teal: 'bg-teal-50 text-teal-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
  };
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <p className="text-xs text-slate-400">{sub}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: 'bg-teal-100 text-teal-700',
    contacted: 'bg-blue-100 text-blue-700',
    qualified: 'bg-green-100 text-green-700',
    won: 'bg-green-600 text-white',
    lost: 'bg-slate-100 text-slate-500',
  };
  return <span className={`badge ${styles[status] || styles.new}`}>{status}</span>;
}
