interface LoadingSkeletonProps {
  rows?: number;
  variant?: 'card' | 'list';
  label?: string;
}

export function LoadingSkeleton({ rows = 5, variant = 'card', label = 'Loading' }: LoadingSkeletonProps) {
  const items = Array.from({ length: rows }, (_, i) => i);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={variant === 'card' ? 'card divide-y divide-slate-100 overflow-hidden' : 'divide-y divide-slate-100'}
    >
      <span className="sr-only">{label}…</span>
      {items.map((i) => (
        <div key={i} className="flex animate-pulse items-center gap-4 px-4 py-4">
          <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-slate-200" />
            <div className="h-3 w-2/3 rounded bg-slate-100" />
          </div>
          {variant === 'card' && <div className="hidden h-6 w-16 rounded-full bg-slate-100 sm:block" />}
        </div>
      ))}
    </div>
  );
}
