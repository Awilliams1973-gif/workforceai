import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Search,
  Phone,
  Mail,
  Globe,
  TrendingUp,
  X,
  RefreshCw,
  Inbox,
  Building2,
} from 'lucide-react';

type AuditSubmission = {
  id: string;
  name: string;
  business_name: string;
  email: string;
  phone: string | null;
  website: string | null;
  industry: string;
  monthly_inquiries: number;
  unanswered_inquiries: number;
  average_customer_value: number;
  estimated_opportunity: number;
  created_at: string;
};

export default function AuditLeadsPage() {
  const [submissions, setSubmissions] = useState<AuditSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AuditSubmission | null>(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('business_audit_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError('Unable to load audit submissions. Please try again.');
    } else {
      setSubmissions(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const filtered = submissions.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.business_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.industry.toLowerCase().includes(search.toLowerCase())
  );

  const totalOpportunity = submissions.reduce(
    (sum, s) => sum + Number(s.estimated_opportunity),
    0
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Leads</h1>
        <p className="mt-1 text-sm text-slate-500">
          Every business that completed the free AI audit. Follow up to close the deal.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total leads</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{submissions.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total opportunity</p>
          <p className="mt-1 text-2xl font-bold text-teal-600">
            ${totalOpportunity.toLocaleString()}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Avg. opportunity</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {submissions.length > 0
              ? `$${Math.round(totalOpportunity / submissions.length).toLocaleString()}`
              : '—'}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search by name, business, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={fetchSubmissions}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

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
            {submissions.length === 0 ? 'No audit submissions yet' : 'No matches found'}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {submissions.length === 0
              ? 'When visitors complete the free AI audit, they\'ll appear here.'
              : 'Try a different search term.'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Contact</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Business</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Industry</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Opportunity</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => setSelected(s)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-teal-700">
                          {s.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{s.name}</p>
                          <p className="text-xs text-slate-500">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-700">{s.business_name}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{s.industry}</td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-semibold text-teal-600">
                        ${Number(s.estimated_opportunity).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500">
                      {new Date(s.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <LeadDrawer lead={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function LeadDrawer({ lead, onClose }: { lead: AuditSubmission; onClose: () => void }) {
  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative h-full w-full max-w-md overflow-y-auto bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Audit lead details</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Contact */}
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-lg font-semibold text-teal-700">
              {lead.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">{lead.name}</p>
              <p className="text-sm text-slate-500">{lead.business_name}</p>
            </div>
          </div>

          {/* Contact actions */}
          <div className="space-y-2">
            <a
              href={`mailto:${lead.email}`}
              className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Mail className="h-4 w-4 text-slate-400" />
              {lead.email}
            </a>
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Phone className="h-4 w-4 text-slate-400" />
                {lead.phone}
              </a>
            )}
            {lead.website && (
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700">
                <Globe className="h-4 w-4 text-slate-400" />
                {lead.website}
              </div>
            )}
          </div>

          {/* Business info */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <Detail label="Industry" value={lead.industry} icon={<Building2 className="h-4 w-4" />} />
            <Detail label="Monthly inquiries" value={lead.monthly_inquiries.toString()} />
            <Detail label="Unanswered inquiries" value={lead.unanswered_inquiries.toString()} />
            <Detail label="Average customer value" value={`$${Number(lead.average_customer_value).toLocaleString()}`} />
            <Detail label="Submitted" value={formatDate(lead.created_at)} />
          </div>

          {/* Opportunity */}
          <div className="rounded-xl bg-gradient-to-br from-teal-600 to-cyan-700 p-5 text-white">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <p className="text-sm font-medium text-teal-100">Estimated annual opportunity</p>
            </div>
            <p className="mt-2 text-3xl font-extrabold">
              ${Number(lead.estimated_opportunity).toLocaleString()}
            </p>
            <p className="mt-2 text-xs text-teal-100">
              Based on {lead.unanswered_inquiries} unanswered inquiries × ${Number(lead.average_customer_value).toLocaleString()} average value, assuming 40% recoverable.
            </p>
          </div>

          {/* Follow-up actions */}
          <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
            <a
              href={`mailto:${lead.email}?subject=Your AI Business Audit Results for ${lead.business_name}&body=Hi ${lead.name},%0D%0A%0D%0AThanks for completing the free AI Business Audit. Based on what you told us, you're missing an estimated $${Number(lead.estimated_opportunity).toLocaleString()} in annual revenue from unanswered customer inquiries.%0D%0A%0D%0AI'd love to show you how WorkforceAI can help capture that revenue. Are you available for a quick 15-minute call this week?%0D%0A%0D%0ABest regards,%0D%0AThe WorkforceAI Team`}
              className="btn-primary w-full justify-center"
            >
              <Mail className="h-4 w-4" />
              Send follow-up email
            </a>
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="btn-secondary w-full justify-center">
                <Phone className="h-4 w-4" />
                Call now
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="flex items-center gap-1.5 font-medium text-slate-900">
        {icon}
        {value}
      </span>
    </div>
  );
}
