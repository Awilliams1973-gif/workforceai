import { Headset, Twitter, Linkedin, Facebook } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export default function PublicFooter() {
  const { setView } = useAppStore();

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
              <a href="#" className="text-slate-400 transition-colors hover:text-teal-400"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="text-slate-400 transition-colors hover:text-teal-400"><Linkedin className="h-5 w-5" /></a>
              <a href="#" className="text-slate-400 transition-colors hover:text-teal-400"><Facebook className="h-5 w-5" /></a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Product</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><button onClick={() => setView('audit')} className="text-slate-400 hover:text-white">Free AI Audit</button></li>
              <li><button onClick={() => setView('pricing')} className="text-slate-400 hover:text-white">Pricing</button></li>
              <li><button onClick={() => setView('auth')} className="text-slate-400 hover:text-white">Live Demo</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Company</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><a href="#" className="text-slate-400 hover:text-white">About</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white">Contact</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white">Careers</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Legal</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><a href="#" className="text-slate-400 hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white">Terms of Service</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white">Refund Policy</a></li>
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
