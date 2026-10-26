import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: {
        sitekey: string;
        appearance?: 'always' | 'execute' | 'interaction-only';
        callback: (token: string) => void;
        'expired-callback'?: () => void;
        'error-callback'?: () => void;
      }) => string;
      remove?: (widgetId: string) => void;
    };
  }
}

const SCRIPT_ID = 'cloudflare-turnstile-script';
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let scriptPromise: Promise<void> | null = null;

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  const script = existingScript ?? document.createElement('script');

  scriptPromise = new Promise<void>((resolve, reject) => {
    let settled = false;
    const timeout = window.setTimeout(() => finish(new Error('Turnstile script timed out')), 15000);
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
      if (error) reject(error);
      else resolve();
    };
    const onLoad = () => window.turnstile
      ? finish()
      : finish(new Error('Turnstile API did not initialize'));
    const onError = () => finish(new Error('Turnstile script failed to load'));

    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);
    if (window.turnstile) {
      finish();
    } else if (!existingScript) {
      script.id = SCRIPT_ID;
      script.src = SCRIPT_URL;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }).catch((error: unknown) => {
    scriptPromise = null;
    throw error;
  });

  return scriptPromise;
}

type WidgetStatus = 'loading' | 'ready' | 'verified' | 'error';

export default function TurnstileWidget({
  onToken,
  siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined,
}: {
  onToken: (token: string | null) => void;
  siteKey?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const [status, setStatus] = useState<WidgetStatus>('loading');
  const [attempt, setAttempt] = useState(0);

  onTokenRef.current = onToken;

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    let active = true;
    setStatus('loading');

    loadTurnstile()
      .then(() => {
        if (!active || !containerRef.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          appearance: 'always',
          callback: (token) => {
            setStatus('verified');
            onTokenRef.current(token);
          },
          'expired-callback': () => {
            setStatus('ready');
            onTokenRef.current(null);
          },
          'error-callback': () => {
            setStatus('error');
            onTokenRef.current(null);
          },
        });
        setStatus('ready');
      })
      .catch(() => {
        if (!active) return;
        setStatus('error');
        onTokenRef.current(null);
      });

    return () => {
      active = false;
      if (widgetId.current) {
        window.turnstile?.remove?.(widgetId.current);
        widgetId.current = null;
      }
      onTokenRef.current(null);
    };
  }, [attempt, siteKey]);

  if (!siteKey) {
    return <p role="alert" className="mt-3 text-xs text-red-700">Security verification is not configured. Chat is unavailable.</p>;
  }

  return (
    <div className="mt-3 min-h-[65px] overflow-visible">
      <div ref={containerRef} />
      {status === 'loading' && <p role="status" className="mt-2 text-xs text-slate-500">Loading security verification…</p>}
      {status === 'ready' && <p role="status" className="mt-2 text-xs text-slate-500">Complete the security check to send a message.</p>}
      {status === 'verified' && <p role="status" className="mt-2 text-xs text-teal-700">Security check complete. You can send your message.</p>}
      {status === 'error' && (
        <div className="mt-2">
          <p role="alert" className="text-xs text-red-700">Security verification could not load. Check your connection and try again.</p>
          <button type="button" onClick={() => setAttempt((current) => current + 1)} className="mt-1 text-xs font-semibold text-teal-700 hover:text-teal-800">
            Retry security check
          </button>
        </div>
      )}
    </div>
  );
}
