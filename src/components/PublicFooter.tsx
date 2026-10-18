import { Headset, Twitter, Linkedin, Facebook } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export default function PublicFooter() {
  const { setView, view } = useAppStore();

  const scrollToSection = (sectionId: string) => {
    if (view !== 'home') {
      setView('home');
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return;
    }

    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToTop = () => {
    if (view !== 'home') {
      setView('home');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
                <Headset className="h-4 w-4" />
              </div>
              <span className="text-base font-bold text-white">WorkforceAI</span>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              Your AI Employee for growing your business. Never miss a customer again.
            </p>
            <div className="mt-4 flex gap-3">
              <button type="button" aria-label="Back to top" onClick={scrollToTop} className="text-slate-400 transition-colors hover:text-teal-400"><Twitter className="h-5 w-5" /></button>
              <button type="button" aria-label="Scroll to how it works" onClick={() => scrollToSection('how-it-works')} className="text-slate-400 transition-colors hover:text-teal-400"><Linkedin className="h-5 w-5" /></button>
              <button type="button" aria-label="Scroll to AI employees" onClick={() => scrollToSection('ai-employees')} className="text-slate-400 transition-colors hover:text-teal-400"><Facebook className="h-5 w-5" /></button>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Product</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><button type="button" onClick={() => setView('audit')} className="text-slate-400 hover:text-white">Free AI Audit</button></li>
              <li><button type="button" onClick={() => setView('auth')} className="text-slate-400 hover:text-white">Live Demo</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Company</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><button type="button" onClick={() => scrollToSection('how-it-works')} className="text-slate-400 hover:text-white">About</button></li>
              <li><button type="button" onClick={() => setView('auth')} className="text-slate-400 hover:text-white">Contact</button></li>
              <li><button type="button" onClick={() => setView('auth')} className="text-slate-400 hover:text-white">Careers</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Legal</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><button type="button" onClick={() => setView('home')} className="text-slate-400 hover:text-white">Privacy Policy</button></li>
              <li><button type="button" onClick={() => setView('home')} className="text-slate-400 hover:text-white">Terms of Service</button></li>
              <li><button type="button" onClick={() => setView('home')} className="text-slate-400 hover:text-white">Refund Policy</button></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6 text-center text-sm text-slate-500">
          © 2026 WorkforceAI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
