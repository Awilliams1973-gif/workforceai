import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';
import LandingPage from '@/components/LandingPage';
import AuditPage from '@/components/AuditPage';
import AuthPage from '@/components/AuthPage';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardHome from '@/components/DashboardHome';
import LeadsPage from '@/components/LeadsPage';
import AppointmentsPage from '@/components/AppointmentsPage';
import ReceptionistPage from '@/components/ReceptionistPage';
import ConversationsPage from '@/components/ConversationsPage';
import KnowledgePage from '@/components/KnowledgePage';
import AIEmployeePage from '@/components/AIEmployeePage';
import PricingPage from '@/components/PricingPage';
import SettingsPage from '@/components/SettingsPage';
import AuditLeadsPage from '@/components/AuditLeadsPage';
import ChatWidget from '@/components/ChatWidget';
import {
  LeadsErrorBoundary,
  AppointmentsErrorBoundary,
  ConversationsErrorBoundary,
  GridErrorBoundary,
  KnowledgeErrorBoundary,
} from '@/components/SectionErrorBoundaries';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';

const dashboardViews = [
  'dashboard',
  'leads',
  'appointments',
  'receptionist',
  'conversations',
  'knowledge',
  'sales',
  'appointments-assistant',
  'marketing',
  'reviews',
  'pricing',
  'settings',
  'audit-leads',
];

function App() {
  const { view, setView, user, setUser, isAdmin, setIsAdmin } = useAppStore();
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw new Error(`Failed to get session: ${sessionError.message}`);
        }

        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('is_admin')
              .eq('id', session.user.id)
              .maybeSingle();
            
            if (profileError) {
              console.error('Profile fetch error:', profileError);
              // Don't throw — let user continue without admin flag
            }
            
            if (profile && mounted) {
              setIsAdmin(profile.is_admin);
            }
          } catch (err) {
            console.error('Profile fetch failed:', err);
          }
        }
        
        if (mounted) {
          setAuthReady(true);
          setAuthError(null);
        }
      } catch (err) {
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to initialize authentication';
          setAuthError(errorMessage);
          setAuthReady(true);
          console.error('Auth initialization error:', err);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        (async () => {
          try {
            if (event === 'SIGNED_OUT') {
              if (mounted) {
                setUser(null);
                setIsAdmin(false);
                setView('home');
                setAuthError(null);
              }
            } else if (event === 'SIGNED_IN' && session?.user) {
              if (mounted) {
                setUser(session.user);
                try {
                  const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', session.user.id)
                    .maybeSingle();
                  
                  if (!profileError && profile && mounted) {
                    setIsAdmin(profile.is_admin);
                  }
                } catch (err) {
                  console.error('Profile fetch failed:', err);
                }
              }
            }
          } catch (err) {
            console.error('Auth state change error:', err);
          }
        })();
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, setIsAdmin, setView]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setAuthError(null);
    setAuthReady(false);
    window.location.reload();
  };

  // Loading state
  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-teal-600" />
          </div>
          <p className="text-sm text-slate-600">Initializing app...</p>
        </div>
      </div>
    );
  }

  // Auth error state
  if (authError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="max-w-md rounded-lg bg-white p-8 shadow-lg">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-red-100 p-3">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-center text-2xl font-bold text-gray-900">
            Connection Error
          </h1>
          <p className="mt-4 text-center text-gray-600">
            We're having trouble connecting to our service. Please check your internet connection and try again.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Error: {authError}
          </p>
          <div className="mt-6 space-y-3">
            <button
              onClick={handleRetry}
              className="w-full rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-teal-700"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Refresh Page
            </button>
          </div>
          {retryCount > 2 && (
            <p className="mt-4 text-xs text-orange-600">
              If this persists, please contact support or try again later.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Auth page — standalone, no nav/footer
  if (view === 'auth') {
    return <AuthPage />;
  }

  // Dashboard views require authentication
  if (dashboardViews.includes(view)) {
    if (!user) {
      return <AuthPage />;
    }
    return (
      <DashboardLayout>
        <GridErrorBoundary>
          {view === 'dashboard' && <DashboardHome />}
        </GridErrorBoundary>
        <LeadsErrorBoundary>
          {view === 'leads' && <LeadsPage />}
        </LeadsErrorBoundary>
        <AppointmentsErrorBoundary>
          {view === 'appointments' && <AppointmentsPage />}
        </AppointmentsErrorBoundary>
        <SectionErrorBoundary>
          {view === 'receptionist' && <ReceptionistPage />}
        </SectionErrorBoundary>
        <ConversationsErrorBoundary>
          {view === 'conversations' && <ConversationsPage />}
        </ConversationsErrorBoundary>
        <KnowledgeErrorBoundary>
          {view === 'knowledge' && <KnowledgePage />}
        </KnowledgeErrorBoundary>
        <SectionErrorBoundary>
          {view === 'sales' && <AIEmployeePage employeeId="sales" />}
        </SectionErrorBoundary>
        <SectionErrorBoundary>
          {view === 'appointments-assistant' && <AIEmployeePage employeeId="appointments-assistant" />}
        </SectionErrorBoundary>
        <SectionErrorBoundary>
          {view === 'marketing' && <AIEmployeePage employeeId="marketing" />}
        </SectionErrorBoundary>
        <SectionErrorBoundary>
          {view === 'reviews' && <AIEmployeePage employeeId="reviews" />}
        </SectionErrorBoundary>
        <SectionErrorBoundary>
          {view === 'pricing' && <PricingPage />}
        </SectionErrorBoundary>
        <SectionErrorBoundary>
          {view === 'settings' && <SettingsPage />}
        </SectionErrorBoundary>
        <SectionErrorBoundary>
          {view === 'audit-leads' && isAdmin && <AuditLeadsPage />}
        </SectionErrorBoundary>
      </DashboardLayout>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicNav />
      <main className="flex-1">
        {view === 'audit' ? <AuditPage /> : <LandingPage />}
      </main>
      <PublicFooter />
      <ChatWidget />
    </div>
  );
}

export default App;
