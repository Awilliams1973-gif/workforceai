import { ArrowLeft, Home, SearchX } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export default function NotFoundPage() {
  const { setView } = useAppStore();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
          <SearchX className="h-8 w-8" />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-teal-600">404 error</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Page not found</h1>
        <p className="mt-3 text-slate-600">
          The page you requested does not exist or may have moved.
        </p>
        <button
          type="button"
          onClick={() => setView('home')}
          className="btn-primary mx-auto mt-6"
        >
          <Home className="h-4 w-4" />
          Back to home
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="mx-auto mt-3 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back
        </button>
      </div>
    </div>
  );
}
