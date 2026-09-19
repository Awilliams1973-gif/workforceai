import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import type { LeadStatus } from '@/lib/types';
import {
  Search, Filter, ArrowUpDown, Phone, Mail, X, Plus, RefreshCw, Inbox, Trash2,
} from 'lucide-react';

type Lead = {
  id: string;
  name: string;
  phone: string;
  email: string;
  service: string;
  source: string;
  status: LeadStatus;
  value: number;
  notes: string;
  next_follow_up: string;
  created_at: string;
};

const statusFilters: (LeadStatus | 'all')[] = ['all', 'new', 'contacted', 'qualified', 'won', 'lost'];

const statusStyles: Record<LeadStatus, string> = {
  new: 'bg-teal-100 text-teal-700',
  contacted: 'bg-blue-100 text-blue-700',
  qualified: 'bg-green-100 text-green-700',
  won: 'bg-green-600 text-white',
  lost: 'bg-slate-100 text-slate-500',
};

export default function LeadsPage() {
  const { user } = useAppStore();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'value' | 'date'>('date');
  const [selected, setSelected] = useState<Lead | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // First, get user's business_id from user_businesses
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

      // Now fetch leads for this business (RLS will filter automatically)
      const { data, error: fetchError } = await supabase
        .from('leads')
        .select('*')
        .eq('business_id', userBiz.business_id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        setError('Unable to load leads. Please try again.');
      } else {
        setLeads((data || []) as Lead[]);
      }
    } catch (err) {
      console.error('Fetch leads error:', err);
      setError('Unable to load leads. Please try again.');
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const filtered = leads
    .filter((l) => statusFilter === 'all' || l.status === statusFilter)
    .filter((l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.service.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => sortBy === 'value'
      ? Number(b.value) - Number(a.value)
      : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const updateStatus = async (id: string, status: LeadStatus) => {
    const { error: updateError } = await supabase
      .from('leads')
      .update({ status })
      .eq('id', id);
    if (!updateError) {
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
      setSelected((prev) => (prev?.id === id ? { ...prev, status } : prev));
    }
  };

  const deleteLead = async (id: string) => {
    const { error: deleteError } = await supabase.from('leads').delete().eq('id', id);
    if (!deleteError) {
      setLeads((prev) => prev.filter((l) => l.id !== id));
      setSelected(null);
    }
  };

  const addLead = async (lead: Omit<Lead, 'id' | 'created_at' | 'user_id'>) => {
    const { data, error: insertError } = await supabase
      .from('leads')
      .insert({
        ...lead,
        value: Number(lead.value),
      })
      .select('*')
      .single();
    if (!insertError && data) {
      setLeads((prev) => [data as Lead, ...prev]);
      setShowAddForm(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="mt-1 text-sm text-slate-500">Every customer your AI employees capture, in one place.</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="btn-primary text-sm">
          <Plus className="h-4 w-4" />
          Add Lead
        </button>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {/* Toolbar */}
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-500 focus:outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
            >
              {statusFilters.map((s) => (
                <option key={s} value={s}>{s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setSortBy(sortBy === 'value' ? 'date' : 'value')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortBy === 'value' ? 'Value' : 'Date'}
          </button>
          <button onClick={fetchLeads} disabled={loading} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
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
            {leads.length === 0 ? 'No leads yet' : 'No matches found'}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {leads.length === 0
              ? 'When your AI Receptionist captures a lead, or you add one manually, it will appear here.'
              : 'Try a different search or filter.'}
          </p>
          {leads.length === 0 && (
            <button onClick={() => setShowAddForm(true)} className="btn-primary mt-4 text-sm">
              <Plus className="h-4 w-4" />
              Add your first lead
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Customer</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Service</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Source</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Value</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Follow-up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelected(lead)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                          {lead.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{lead.name}</p>
                          <p className="text-xs text-slate-500">{lead.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-700">{lead.service}</td>
                    <td className="px-5 py-3 text-sm text-slate-500">{lead.source}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-slate-900">${Number(lead.value).toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <span className={`badge ${statusStyles[lead.status]}`}>{lead.status}</span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500">{lead.next_follow_up || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <LeadDrawer
          lead={selected}
          onClose={() => setSelected(null)}
          onUpdateStatus={(s) => updateStatus(selected.id, s)}
          onDelete={() => deleteLead(selected.id)}
        />
      )}

      {/* Add lead form */}
      {showAddForm && (
        <AddLeadForm onClose={() => setShowAddForm(false)} onAdd={addLead} />
      )}
    </div>
  );
}

function LeadDrawer({ lead, onClose, onUpdateStatus, onDelete }: {
  lead: Lead;
  onClose: () => void;
  onUpdateStatus: (s: LeadStatus) => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative h-full w-full max-w-md overflow-y-auto bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Lead details</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-5 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-lg font-semibold text-teal-700">
              {lead.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">{lead.name}</p>
              <span className={`badge ${statusStyles[lead.status]}`}>{lead.status}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-slate-400" />
              {lead.phone ? <a href={`tel:${lead.phone}`} className="text-teal-600 hover:underline">{lead.phone}</a> : <span className="text-slate-400">No phone</span>}
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-slate-400" />
              {lead.email ? <a href={`mailto:${lead.email}`} className="text-teal-600 hover:underline">{lead.email}</a> : <span className="text-slate-400">No email</span>}
            </div>
          </div>

          <div className="space-y-3 border-t border-slate-100 pt-4">
            <Detail label="Service" value={lead.service || 'Not specified'} />
            <Detail label="Source" value={lead.source} />
            <Detail label="Estimated value" value={`$${Number(lead.value).toLocaleString()}`} />
            <Detail label="Next follow-up" value={lead.next_follow_up || 'Not scheduled'} />
            <Detail label="Created" value={new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} />
          </div>

          {lead.notes && (
            <div className="border-t border-slate-100 pt-4">
              <p className="mb-1.5 text-sm font-medium text-slate-700">Notes</p>
              <p className="text-sm text-slate-600">{lead.notes}</p>
            </div>
          )}

          <div className="border-t border-slate-100 pt-4">
            <p className="mb-2 text-sm font-medium text-slate-700">Update status</p>
            <div className="flex flex-wrap gap-2">
              {(['new', 'contacted', 'qualified', 'won', 'lost'] as LeadStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => onUpdateStatus(s)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                    lead.status === s
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete lead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddLeadForm({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (lead: Omit<Lead, 'id' | 'created_at' | 'user_id'>) => void;
}) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    service: '',
    source: 'Manual entry',
    status: 'new' as LeadStatus,
    value: '',
    notes: '',
    next_follow_up: '',
  });

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    onAdd({ ...form, value: Number(form.value) || 0 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Add new lead</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5 space-y-4">
          <div>
            <label className="label">Name <span className="text-red-500">*</span></label>
            <input className="input" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="John Smith" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="(555) 123-4567" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="john@email.com" />
            </div>
          </div>
          <div>
            <label className="label">Service</label>
            <input className="input" value={form.service} onChange={(e) => update('service', e.target.value)} placeholder="Emergency leak repair" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Source</label>
              <input className="input" value={form.source} onChange={(e) => update('source', e.target.value)} placeholder="Manual entry" />
            </div>
            <div>
              <label className="label">Estimated value ($)</label>
              <input className="input" type="number" min="0" value={form.value} onChange={(e) => update('value', e.target.value)} placeholder="450" />
            </div>
          </div>
          <div>
            <label className="label">Next follow-up</label>
            <input className="input" value={form.next_follow_up} onChange={(e) => update('next_follow_up', e.target.value)} placeholder="Today 2:00 PM" />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input min-h-[80px] resize-y" value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Any details about this lead..." />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={!form.name.trim()} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">
            <Plus className="h-4 w-4" />
            Add Lead
          </button>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}
