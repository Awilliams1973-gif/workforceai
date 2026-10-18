import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: { sitekey: string; appearance?: 'always' | 'execute' | 'interaction-only'; callback: (token: string) => void; 'expired-callback'?: () => void; 'error-callback'?: () => void }) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

const SCRIPT_ID = 'cloudflare-turnstile-script';

export default function TurnstileWidget({ onToken, manual = false }: { onToken: (token: string | null) => void; manual?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string>();
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    const render = () => {
      if (!window.turnstile || !containerRef.current) return false;
      if (widgetId.current) return true;
      widgetId.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        appearance: 'always',
        callback: (token) => onToken(token),
        'expired-callback': () => onToken(null),
        'error-callback': () => onToken(null),
      });
      return true;
    };

    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      const interval = window.setInterval(() => {
        if (render()) window.clearInterval(interval);
      }, 100);
      return () => {
        window.clearInterval(interval);
        widgetId.current = undefined;
        onToken(null);
      };
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.addEventListener('load', render);
    document.head.appendChild(script);

    const interval = window.setInterval(() => {
      if (render()) window.clearInterval(interval);
    }, 100);
    return () => {
      window.clearInterval(interval);
      widgetId.current = undefined;
      onToken(null);
    };
  }, [onToken, siteKey, manual]);

  return siteKey ? <div ref={containerRef} className="mt-3 min-h-[65px] overflow-visible" /> : null;
}
