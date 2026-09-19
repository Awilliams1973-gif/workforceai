import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import type { AppointmentStatus } from '@/lib/types';
import {
  CalendarDays, Clock, Phone, X, CheckCircle2, CalendarX2, RotateCcw,
  Plus, RefreshCw, Inbox,
} from 'lucide-react';

type Appointment = {
  id: string;
  customer_name: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes: string;
  created_at: string;
};

const statusFilters: (AppointmentStatus | 'all')[] = ['all', 'scheduled', 'confirmed', 'completed', 'rescheduled', 'cancelled', 'no-show'];

const statusStyles: Record<AppointmentStatus, string> = {
  scheduled: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  rescheduled: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700',
  'no-show': 'bg-slate-200 text-slate-600',
};

export default function AppointmentsPage() {
  const { user } = useAppStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<AppointmentStatus | 'all'>('all');
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Get user's business_id
      const { data: userBiz, error: bizError } = await supabase
        .from('user_businesses')
        .select('business_id')
        .eq('user_id', user?.id || '')
        .maybeSingle();
      
      if (bizError || !userBiz) {
        setError('Unable to load your business. Please try again.');
        setLoading(false);
        return;
      }

      // Fetch appointments for this business
      const { data, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('business_id', userBiz.business_id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        setError('Unable to load appointments. Please try again.');
      } else {
        setAppointments((data || []) as Appointment[]);
      }
    } catch (err) {
      console.error('Fetch appointments error:', err);
      setError('Unable to load appointments. Please try again.');
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const filtered = appointments.filter((a) => filter === 'all' || a.status === filter);

  const updateStatus = async (id: string, status: AppointmentStatus) => {
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id);
    if (!updateError) {
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
      setSelected((prev) => (prev?.id === id ? { ...prev, status } : prev));
    }
  };

  const addAppointment = async (appt: Omit<Appointment, 'id' | 'created_at' | 'user_id'>) => {
    try {
      // Get user's business_id
      const { data: userBiz } = await supabase
        .from('user_businesses')
        .select('business_id')
        .eq('user_id', user?.id || '')
        .maybeSingle();
      
      if (!userBiz) return;

      const { data, error: insertError } = await supabase
        .from('appointments')
        .insert({ ...appt, business_id: userBiz.business_id, user_id: user?.id })
        .select('*')
        .single();
      if (!insertError && data) {
        setAppointments((prev) => [data as Appointment, ...prev]);
        setShowAddForm(false);
      }
    } catch (err) {
      console.error('Add appointment error:', err);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
          <p className="mt-1 text-sm text-slate-500">Booked by your AI employees, ready for your team.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAppointments} disabled={loading} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowAddForm(true)} className="btn-primary text-sm">
            <Plus className="h-4 w-4" />
            Add Appointment
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
              filter === s ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {s === 'all' ? 'All' : s.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Appointment list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-teal-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Inbox className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">
            {appointments.length === 0 ? 'No appointments yet' : 'No matches found'}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {appointments.length === 0
              ? 'When your AI Appointment Assistant books a customer, or you add one manually, it will appear here.'
              : 'Try a different filter.'}
          </p>
          {appointments.length === 0 && (
            <button onClick={() => setShowAddForm(true)} className="btn-primary mt-4 text-sm">
              <Plus className="h-4 w-4" />
              Add your first appointment
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((appt) => (
            <button
              key={appt.id}
              onClick={() => setSelected(appt)}
              className="card p-5 text-left transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex w-14 flex-col items-center rounded-xl bg-slate-50 py-2">
                  <span className="text-xs font-medium text-slate-500">{appt.date}</span>
                  <span className="text-sm font-bold text-slate-900">{appt.time}</span>
                </div>
                <span className={`badge ${statusStyles[appt.status]}`}>{appt.status.replace('-', ' ')}</span>
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900">{appt.customer_name}</p>
              <p className="text-sm text-slate-500">{appt.service}</p>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                <Phone className="h-3.5 w-3.5" />
                {appt.phone || 'No phone'}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <AppointmentModal
          appt={selected}
          onClose={() => setSelected(null)}
          onUpdateStatus={(s) => updateStatus(selected.id, s)}
        />
      )}

      {/* Add appointment form */}
      {showAddForm && (
        <AddAppointmentForm onClose={() => setShowAddForm(false)} onAdd={addAppointment} />
      )}
    </div>
  );
}

function AppointmentModal({ appt, onClose, onUpdateStatus }: {
  appt: Appointment;
  onClose: () => void;
  onUpdateStatus: (s: AppointmentStatus) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{appt.customer_name}</h2>
              <span className={`badge ${statusStyles[appt.status]}`}>{appt.status.replace('-', ' ')}</span>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <Row icon={CalendarDays} label="Date" value={appt.date} />
          <Row icon={Clock} label="Time" value={appt.time} />
          <Row icon={CheckCircle2} label="Service" value={appt.service} />
          <Row icon={Phone} label="Phone" value={appt.phone || 'No phone'} />
        </div>

        {appt.notes && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="mb-1 text-sm font-medium text-slate-700">Notes</p>
            <p className="text-sm text-slate-600">{appt.notes}</p>
          </div>
        )}

        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-slate-700">Update status</p>
          <div className="flex flex-wrap gap-2">
            {(['scheduled', 'confirmed', 'completed', 'rescheduled', 'cancelled', 'no-show'] as AppointmentStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => onUpdateStatus(s)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                  appt.status === s
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={() => onUpdateStatus('confirmed')} className="btn-primary flex-1">
            <CheckCircle2 className="h-4 w-4" />
            Confirm
          </button>
          <button onClick={() => onUpdateStatus('rescheduled')} className="btn-secondary">
            <RotateCcw className="h-4 w-4" />
            Reschedule
          </button>
          <button onClick={() => onUpdateStatus('cancelled')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100">
            <CalendarX2 className="h-4 w-4" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function AddAppointmentForm({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (appt: Omit<Appointment, 'id' | 'created_at' | 'user_id'>) => void;
}) {
  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    service: '',
    date: '',
    time: '',
    status: 'scheduled' as AppointmentStatus,
    notes: '',
  });

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = () => {
    if (!form.customer_name.trim()) return;
    onAdd(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Add new appointment</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5 space-y-4">
          <div>
            <label className="label">Customer name <span className="text-red-500">*</span></label>
            <input className="input" value={form.customer_name} onChange={(e) => update('customer_name', e.target.value)} placeholder="John Smith" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="(555) 123-4567" />
            </div>
            <div>
              <label className="label">Service</label>
              <input className="input" value={form.service} onChange={(e) => update('service', e.target.value)} placeholder="Emergency leak repair" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Date <span className="text-red-500">*</span></label>
              <input className="input" value={form.date} onChange={(e) => update('date', e.target.value)} placeholder="Sep 5" />
            </div>
            <div>
              <label className="label">Time <span className="text-red-500">*</span></label>
              <input className="input" value={form.time} onChange={(e) => update('time', e.target.value)} placeholder="2:30 PM" />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input min-h-[80px] resize-y" value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Any details about this appointment..." />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={!form.customer_name.trim() || !form.date.trim() || !form.time.trim()} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">
            <Plus className="h-4 w-4" />
            Add Appointment
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="h-4 w-4 text-slate-400" />
      <span className="text-slate-500">{label}</span>
      <span className="ml-auto font-medium text-slate-900">{value}</span>
    </div>
  );
}
