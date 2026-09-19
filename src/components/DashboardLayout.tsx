import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import type { View } from '@/lib/types';
import {
  Headset,
  LayoutDashboard,
  Users,
  CalendarDays,
  MessageSquare,
  BookOpen,
  Handshake,
  CalendarCheck,
  Megaphone,
  Star,
  CreditCard,
  Settings,
  ArrowLeft,
  X,
  ClipboardList,
  LogOut,
  ChevronDown,
} from 'lucide-react';

const navItems: { id: View; label: string; icon: typeof Headset; group?: string; adminOnly?: boolean }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'appointments', label: 'Appointments', icon: CalendarDays },
  { id: 'receptionist', label: 'AI Receptionist', icon: Headset, group: 'AI Employees' },
  { id: 'conversations', label: 'Conversations', icon: MessageSquare },
  { id: 'sales', label: 'AI Sales Assistant', icon: Handshake, group: 'AI Employees' },
  { id: 'appointments-assistant', label: 'AI Appointments', icon: CalendarCheck, group: 'AI Employees' },
  { id: 'marketing', label: 'AI Marketing', icon: Megaphone, group: 'AI Employees' },
  { id: 'reviews', label: 'AI Reviews', icon: Star, group: 'AI Employees' },
  { id: 'audit-leads', label: 'Audit Leads', icon: ClipboardList, group: 'Admin', adminOnly: true },
  { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen, group: 'Settings' },
  { id: 'pricing', label: 'Plans & Billing', icon: CreditCard, group: 'Settings' },
  { id: 'settings', label: 'Business Settings', icon: Settings, group: 'Settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { view, setView, mobileNavOpen, setMobileNavOpen, user, isAdmin } = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const visibleNav = navItems.filter((item) => !item.adminOnly || isAdmin);

  let lastGroup = '';
  const grouped = visibleNav.map((item) => {
    const showGroup = item.group && item.group !== lastGroup;
    lastGroup = item.group || lastGroup;
    return { ...item, showGroup };
  });

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'U';

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 flex-shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <SidebarContent />
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">
            <button
              onClick={() => setMobileNavOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Headset className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold text-slate-700">
              {visibleNav.find((n) => n.id === view)?.label || 'Dashboard'}
            </span>
          </div>
          <div className="relative flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-xs font-semibold text-white">
              {initials}
            </div>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-10 z-20 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-900 truncate">{user?.email}</p>
                    <p className="text-xs text-slate-500">{isAdmin ? 'Administrator' : 'Member'}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );

  function SidebarContent() {
    return (
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center gap-2 border-b border-slate-200 px-4">
          <button onClick={() => setView('home')} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
              <Headset className="h-4 w-4" />
            </div>
            <span className="text-base font-bold text-slate-900">WorkforceAI</span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          {grouped.map((item) => (
            <div key={item.id}>
              {item.showGroup && (
                <p className="mt-4 mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {item.group}
                </p>
              )}
              <button
                onClick={() => setView(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  view === item.id
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <button
            onClick={() => setView('home')}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to website
          </button>
        </div>
      </div>
    );
  }
}
