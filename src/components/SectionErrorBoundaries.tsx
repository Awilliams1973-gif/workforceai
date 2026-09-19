import { ReactNode } from 'react';
import { SectionErrorBoundary } from './SectionErrorBoundary';

// ============ LEADS SECTION ERROR BOUNDARY ============

interface LeadsErrorProps {
  children: ReactNode;
  onRetry?: () => void;
}

export function LeadsErrorBoundary({ children, onRetry }: LeadsErrorProps) {
  return (
    <SectionErrorBoundary
      onError={(error) => {
        console.error('Leads section error:', error);
        onRetry?.();
      }}
      fallback={
        <div className="space-y-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Leads Section Error</h3>
                <p className="mt-2 text-sm text-red-700">We're having trouble loading your leads. Please try refreshing the page.</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 inline-flex items-center px-3 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </SectionErrorBoundary>
  );
}

// ============ APPOINTMENTS SECTION ERROR BOUNDARY ============

interface AppointmentsErrorProps {
  children: ReactNode;
  onRetry?: () => void;
}

export function AppointmentsErrorBoundary({ children, onRetry }: AppointmentsErrorProps) {
  return (
    <SectionErrorBoundary
      onError={(error) => {
        console.error('Appointments section error:', error);
        onRetry?.();
      }}
      fallback={
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Appointments Section Error</h3>
              <p className="mt-2 text-sm text-red-700">We're having trouble loading your appointments. Try refreshing.</p>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </SectionErrorBoundary>
  );
}

// ============ CONVERSATIONS SECTION ERROR BOUNDARY ============

interface ConversationsErrorProps {
  children: ReactNode;
  onRetry?: () => void;
}

export function ConversationsErrorBoundary({ children, onRetry }: ConversationsErrorProps) {
  return (
    <SectionErrorBoundary
      onError={(error) => {
        console.error('Conversations section error:', error);
        onRetry?.();
      }}
      fallback={
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Conversations Section Error</h3>
              <p className="mt-2 text-sm text-red-700">We're having trouble loading conversations. Please try again.</p>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </SectionErrorBoundary>
  );
}

// ============ DASHBOARD GRID ERROR BOUNDARY ============

interface GridErrorProps {
  children: ReactNode;
}

export function GridErrorBoundary({ children }: GridErrorProps) {
  return (
    <SectionErrorBoundary
      fallback={
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">Dashboard stats temporarily unavailable</p>
        </div>
      }
    >
      {children}
    </SectionErrorBoundary>
  );
}

// ============ KNOWLEDGE BASE SECTION ERROR BOUNDARY ============

interface KnowledgeErrorProps {
  children: ReactNode;
}

export function KnowledgeErrorBoundary({ children }: KnowledgeErrorProps) {
  return (
    <SectionErrorBoundary
      fallback={
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-800 font-medium">Knowledge Base Error</p>
          <p className="mt-1 text-sm text-red-700">Unable to load knowledge base. Please try refreshing.</p>
        </div>
      }
    >
      {children}
    </SectionErrorBoundary>
  );
}
