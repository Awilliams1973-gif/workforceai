import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import * as Sentry from '@sentry/react';
import { ErrorBoundary } from './components/ErrorBoundary';
import App from './App.tsx';
import './index.css';

// PII Redaction function
const redactPII = <T,>(data: T): T => {
  if (typeof data === 'string') {
    return data
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]')
      .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE_REDACTED]') as T;
  }
  if (data === null || typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(item => redactPII(item)) as T;
  }

  // List of PII fields to redact
  const piiFields = ['email', 'phone', 'password', 'creditCard', 'ssn', 'name', 'address'];

  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (piiFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = redactPII(value);
    }
  }

  return redacted as T;
  
  return data;
};

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
        event.breadcrumbs = event.breadcrumbs.map(bc => ({
          ...bc,
          data: redactPII(bc.data),
          message: bc.message?.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]') || bc.message,
        }));
      }
      
      // Redact exception data
      if (event.exception?.values) {
        event.exception.values = event.exception.values.map(exception => ({
          ...exception,
          value: exception.value?.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]') || exception.value,
        }));
      }
      
      // Redact request data
      if (event.request) {
        event.request = {
          ...event.request,
          url: event.request.url?.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]') || event.request.url,
          headers: redactPII(event.request.headers),
        };
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
