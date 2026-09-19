import { useAppStore } from '@/lib/store';
import { Headset, Menu, X, Sparkles } from 'lucide-react';

export default function PublicNav() {
  const { view, setView, user, isAdmin } = useAppStore();

  const navLinks: { label: string; target: string }[] = [
    { label: 'How it works', target: 'how-it-works' },
    { label: 'AI Employees', target: 'ai-employees' },
    { label: 'Industries', target: 'industries' },
    { label: 'Pricing', target: 'pricing' },
    { label: 'FAQ', target: 'faq' },
  ];

  const scrollTo = (id: string) => {
    if (view !== 'home') {
      setView('home');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button onClick={() => setView('home')} className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
            <Headset className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Workforce<span className="text-teal-600">AI</span>
          </span>
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <button
              key={link.target}
              onClick={() => scrollTo(link.target)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {isAdmin && (
                <button onClick={() => setView('audit-leads')} className="btn-ghost text-sm">
                  Audit Leads
                </button>
              )}
              <button onClick={() => setView('dashboard')} className="btn-ghost">
                Dashboard
              </button>
            </>
          ) : (
            <button onClick={() => setView('auth')} className="btn-ghost">
              Sign in
            </button>
          )}
          <button onClick={() => setView('audit')} className="btn-primary">
            <Sparkles className="h-4 w-4" />
            Free AI Audit
          </button>
        </div>

        <MobileNav />
      </div>
    </header>
  );
}

function MobileNav() {
  const { mobileNavOpen, setMobileNavOpen, setView, view, user, isAdmin } = useAppStore();

  const navLinks: { label: string; target: string }[] = [
    { label: 'How it works', target: 'how-it-works' },
    { label: 'AI Employees', target: 'ai-employees' },
    { label: 'Industries', target: 'industries' },
    { label: 'Pricing', target: 'pricing' },
    { label: 'FAQ', target: 'faq' },
  ];

  const scrollTo = (id: string) => {
    setMobileNavOpen(false);
    if (view !== 'home') {
      setView('home');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="md:hidden">
      <button
        onClick={() => setMobileNavOpen(!mobileNavOpen)}
        className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
        aria-label="Toggle menu"
      >
        {mobileNavOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>
      {mobileNavOpen && (
        <div className="absolute inset-x-0 top-16 z-40 border-b border-slate-200 bg-white p-4 shadow-lg">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <button
                key={link.target}
                onClick={() => scrollTo(link.target)}
                className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {link.label}
              </button>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-slate-200 pt-3">
              {user ? (
                <>
                  {isAdmin && (
                    <button onClick={() => { setMobileNavOpen(false); setView('audit-leads'); }} className="btn-secondary w-full">
                      Audit Leads
                    </button>
                  )}
                  <button onClick={() => { setMobileNavOpen(false); setView('dashboard'); }} className="btn-secondary w-full">
                    Dashboard
                  </button>
                </>
              ) : (
                <button onClick={() => { setMobileNavOpen(false); setView('auth'); }} className="btn-secondary w-full">
                  Sign in
                </button>
              )}
              <button onClick={() => { setMobileNavOpen(false); setView('audit'); }} className="btn-primary w-full">
                Free AI Audit
              </button>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
