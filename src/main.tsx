import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { ErrorBoundary } from './components/ErrorBoundary';
import App from './App.tsx';
import './index.css';

// PII Redaction function
const redactPII = (data: any): any => {
  if (!data) return data;
  
  // List of PII fields to redact
  const piiFields = ['email', 'phone', 'password', 'creditCard', 'ssn', 'name', 'address'];
  
  // Redact object values
  if (typeof data === 'object') {
    const redacted = Array.isArray(data) ? [...data] : { ...data };
    
    for (const key in redacted) {
      if (piiFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        redacted[key] = '[REDACTED]';
      } else if (typeof redacted[key] === 'object') {
        redacted[key] = redactPII(redacted[key]);
      } else if (typeof redacted[key] === 'string') {
        // Redact email patterns
        if (redacted[key].match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)) {
          redacted[key] = '[EMAIL_REDACTED]';
        }
        // Redact phone patterns (XXX-XXX-XXXX or similar)
        if (redacted[key].match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/)) {
          redacted[key] = '[PHONE_REDACTED]';
        }
      }
    }
    return redacted;
  }
  
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
      if (event.exception) {
        event.exception = event.exception.map(ex => ({
          ...ex,
          value: ex.value?.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]') || ex.value,
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
      </ErrorBoundary>
    </Sentry.ErrorBoundary>
  </StrictMode>
);
