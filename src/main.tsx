import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import * as Sentry from '@sentry/react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { redactPII } from './lib/sentry-redaction';
import App from './App.tsx';
import './index.css';

// Initialize Sentry if DSN is provided
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,  // Mask all text in replays
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Redact sensitive data before sending to Sentry
    beforeSend(event) {
      // Redact breadcrumb data
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => redactPII(breadcrumb));
      }
      
      // Redact exception data
      if (event.exception?.values) {
        event.exception.values = event.exception.values.map(exception => redactPII(exception));
      }

      if (event.message) event.message = redactPII(event.message);
      if (event.logentry) event.logentry = redactPII(event.logentry);
      if (event.user) event.user = redactPII(event.user);
      
      // Redact request data
      if (event.request) {
        event.request = {
          ...event.request,
          url: event.request.url
            ? redactPII(event.request.url).replace(
                /([?&#](?:token|password|key|access_token|refresh_token)=)[^&#]*/gi,
                '$1***',
              )
            : event.request.url,
          headers: redactPII(event.request.headers),
        };
        delete event.request.cookies;
        if (event.request.headers) {
          for (const header of Object.keys(event.request.headers)) {
            if (/^(authorization|cookie|apikey|x-client-info)$/i.test(header)) {
              event.request.headers[header] = '[REDACTED]';
            }
          }
        }
      }
      
      // Redact extra data
      if (event.extra) {
        event.extra = redactPII(event.extra);
      }
      
      // Redact contexts
      if (event.contexts) {
        event.contexts = redactPII(event.contexts);
      }
      
      return event;
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorBoundary><div>Error</div></ErrorBoundary>}>
      <ErrorBoundary>
        <App />
        <Analytics />
      </ErrorBoundary>
    </Sentry.ErrorBoundary>
  </StrictMode>
);
