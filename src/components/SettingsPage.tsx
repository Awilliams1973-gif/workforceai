import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import {
  Building2,
  Phone,
  Clock,
  Save,
  CheckCircle2,
  Wrench,
  Flame,
  Zap,
  Home,
  Hammer,
  Building,
  Loader2,
} from 'lucide-react';

const industries = [
  { icon: Wrench, name: 'Plumbing' },
  { icon: Flame, name: 'HVAC' },
  { icon: Zap, name: 'Electrical' },
  { icon: Home, name: 'Roofing' },
  { icon: Hammer, name: 'General Contracting' },
  { icon: Building, name: 'Property Management' },
];

const emptyForm = {
  business_name: '',
  industry: '',
  phone: '',
  email: '',
  website: '',
  address: '',
  hours: '',
  service_area: '',
  description: '',
};

export default function SettingsPage() {
  const { user } = useAppStore();
  const userId = user?.id;
  const [form, setForm] = useState(emptyForm);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!userId) {
      setError('Please sign in to load your business settings.');
      setLoading(false);
      return;
    }

    const { data: membership, error: membershipError } = await supabase
      .from('user_businesses')
      .select('business_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (membershipError || !membership) {
      console.error('Business lookup error:', membershipError);
      setError('Unable to load your business. Please try again.');
      setLoading(false);
      return;
    }

    setBusinessId(membership.business_id);
    const { data, error: fetchError } = await supabase
      .from('business_settings')
      .select('*')
      .eq('business_id', membership.business_id)
      .maybeSingle();

    if (fetchError) {
      setError('Unable to load settings. Please try again.');
    } else if (data) {
      setForm({
        business_name: data.business_name ?? '',
        industry: data.industry ?? '',
        phone: data.phone ?? '',
        email: data.email ?? '',
        website: data.website ?? '',
        address: data.address ?? '',
        hours: data.hours ?? '',
        service_area: data.service_area ?? '',
        description: data.description ?? '',
      });
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const update = (key: keyof typeof form, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    if (!businessId) {
      setError('Unable to load your business. Please try again.');
      setSaving(false);
      return;
    }

    const { error: upsertError } = await supabase
      .from('business_settings')
      .upsert({
        business_id: businessId,
        ...form,
      }, { onConflict: 'business_id' });

    if (upsertError) {
      setError('Unable to save settings. Please try again.');
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Business Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Your AI employees use this information to represent your business.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Business profile */}
      <div className="card p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <Building2 className="h-5 w-5" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">Business profile</h2>
        </div>
        <div className="mt-5 space-y-4">
          <div>
            <label className="label">Business name</label>
            <input className="input" value={form.business_name} onChange={(e) => update('business_name', e.target.value)} />
          </div>
          <div>
            <label className="label">Business description</label>
            <textarea className="input min-h-[80px] resize-y" value={form.description} onChange={(e) => update('description', e.target.value)} />
            <p className="mt-1.5 text-xs text-slate-500">Your AI uses this to introduce your business to customers.</p>
          </div>
          <div>
            <label className="label">Industry</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {industries.map((ind) => (
                <button
                  key={ind.name}
                  onClick={() => update('industry', ind.name)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all ${
                    form.industry === ind.name
                      ? 'border-teal-600 bg-teal-50 text-teal-700'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <ind.icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{ind.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contact info */}
      <div className="card p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Phone className="h-5 w-5" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">Contact information</h2>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Phone number</label>
            <input className="input" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
          </div>
          <div>
            <label className="label">Website</label>
            <input className="input" value={form.website} onChange={(e) => update('website', e.target.value)} />
          </div>
          <div>
            <label className="label">Business address</label>
            <input className="input" value={form.address} onChange={(e) => update('address', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Hours & service area */}
      <div className="card p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">Hours & service area</h2>
        </div>
        <div className="mt-5 space-y-4">
          <div>
            <label className="label">Business hours</label>
            <input className="input" value={form.hours} onChange={(e) => update('hours', e.target.value)} />
            <p className="mt-1.5 text-xs text-slate-500">Include emergency hours if you offer 24/7 service.</p>
          </div>
          <div>
            <label className="label">Service area</label>
            <textarea className="input min-h-[60px] resize-y" value={form.service_area} onChange={(e) => update('service_area', e.target.value)} />
            <p className="mt-1.5 text-xs text-slate-500">Your AI uses this to tell customers if you serve their location.</p>
          </div>
        </div>
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            Changes saved
          </span>
        )}
        <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save changes
        </button>
      </div>
    </div>
  );
}
