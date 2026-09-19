import { useState } from 'react';
import { demoKnowledge } from '@/lib/demo-data';
import type { KnowledgeItem } from '@/lib/types';
import {
  BookOpen,
  Plus,
  Search,
  Wrench,
  DollarSign,
  HelpCircle,
  FileText,
  Clock,
  MapPin,
  Tag,
  X,
  Sparkles,
} from 'lucide-react';

const categoryIcons: Record<string, typeof BookOpen> = {
  service: Wrench,
  pricing: DollarSign,
  faq: HelpCircle,
  policy: FileText,
  hours: Clock,
  area: MapPin,
  offer: Tag,
};

const categoryLabels: Record<string, string> = {
  service: 'Services',
  pricing: 'Pricing',
  faq: 'FAQs',
  policy: 'Policies',
  hours: 'Hours',
  area: 'Service Areas',
  offer: 'Special Offers',
};

export default function KnowledgePage() {
  const [items, setItems] = useState<KnowledgeItem[]>(demoKnowledge);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ category: 'faq' as KnowledgeItem['category'], title: '', content: '' });

  const filtered = items
    .filter((i) => activeCategory === 'all' || i.category === activeCategory)
    .filter((i) => i.title.toLowerCase().includes(search.toLowerCase()) || i.content.toLowerCase().includes(search.toLowerCase()));

  const addItem = () => {
    if (!newItem.title || !newItem.content) return;
    setItems((prev) => [{ id: Date.now().toString(), ...newItem }, ...prev]);
    setNewItem({ category: 'faq', title: '', content: '' });
    setShowAdd(false);
  };

  const deleteItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Knowledge Base</h1>
          <p className="mt-1 text-sm text-slate-500">Your AI employees use this to answer customers accurately.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl bg-teal-50 p-4 ring-1 ring-inset ring-teal-200">
        <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-600" />
        <p className="text-sm text-teal-800">
          The more details you add here, the more accurately your AI employees can answer customer questions. Add your services, prices, FAQs, hours, and policies.
        </p>
      </div>

      {/* Search + filters */}
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search knowledge..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveCategory('all')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === 'all' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === key ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => {
          const Icon = categoryIcons[item.category] || BookOpen;
          return (
            <div key={item.id} className="card group p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium text-slate-500">{categoryLabels[item.category]}</span>
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="rounded-lg p-1 text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{item.content}</p>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card py-12 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">No knowledge items yet. Add your first one to help your AI employees.</p>
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setShowAdd(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Add knowledge item</h2>
              <button onClick={() => setShowAdd(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="label">Category</label>
                <select
                  className="input"
                  value={newItem.category}
                  onChange={(e) => setNewItem((p) => ({ ...p, category: e.target.value as KnowledgeItem['category'] }))}
                >
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Title</label>
                <input className="input" value={newItem.title} onChange={(e) => setNewItem((p) => ({ ...p, title: e.target.value }))} placeholder="e.g., Do you offer emergency service?" />
              </div>
              <div>
                <label className="label">Content</label>
                <textarea
                  className="input min-h-[100px] resize-y"
                  value={newItem.content}
                  onChange={(e) => setNewItem((p) => ({ ...p, content: e.target.value }))}
                  placeholder="The answer or details your AI should give customers..."
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowAdd(false)} className="btn-ghost">Cancel</button>
              <button onClick={addItem} className="btn-primary" disabled={!newItem.title || !newItem.content}>
                <Plus className="h-4 w-4" />
                Add to Knowledge Base
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
