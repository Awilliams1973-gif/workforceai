import { useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, ChevronRight, ListChecks, MessageSquare, Settings2, Users, X } from 'lucide-react';
import { useAppStore } from '@/lib/store';

type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  view: 'settings' | 'knowledge' | 'receptionist' | 'leads';
  icon: typeof Settings2;
};

const steps: OnboardingStep[] = [
  {
    id: 'business-profile',
    title: 'Set up your business profile',
    description: 'Add your business details, hours, and service area.',
    view: 'settings',
    icon: Settings2,
  },
  {
    id: 'knowledge-base',
    title: 'Teach your AI employees',
    description: 'Add services, FAQs, pricing, and policies to your knowledge base.',
    view: 'knowledge',
    icon: BookOpen,
  },
  {
    id: 'test-receptionist',
    title: 'Test your AI Receptionist',
    description: 'Review its channels and confirm how it handles customer inquiries.',
    view: 'receptionist',
    icon: MessageSquare,
  },
  {
    id: 'review-leads',
    title: 'Review your lead workflow',
    description: 'See where captured leads will appear and how your team can follow up.',
    view: 'leads',
    icon: Users,
  },
];

function storageKey(userId: string) {
  return `workforceai:onboarding:${userId}`;
}

export default function OnboardingChecklist({ userId }: { userId?: string }) {
  const { setView } = useAppStore();
  const [completed, setCompleted] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!userId) return;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey(userId)) || '{}') as {
        completed?: string[];
        dismissed?: boolean;
      };
      setCompleted(saved.completed || []);
      setDismissed(saved.dismissed === true);
    } catch {
      setCompleted([]);
      setDismissed(false);
    }
  }, [userId]);

  if (!userId || dismissed) return null;

  const save = (nextCompleted: string[], nextDismissed: boolean = dismissed) => {
    localStorage.setItem(storageKey(userId), JSON.stringify({ completed: nextCompleted, dismissed: nextDismissed }));
  };

  const toggleCompleted = (stepId: string) => {
    const nextCompleted = completed.includes(stepId)
      ? completed.filter((id) => id !== stepId)
      : [...completed, stepId];
    setCompleted(nextCompleted);
    save(nextCompleted);
  };

  const dismiss = () => {
    setDismissed(true);
    save(completed, true);
  };

  const completionPercent = Math.round((completed.length / steps.length) * 100);

  return (
    <section className="card overflow-hidden border-teal-200 bg-gradient-to-br from-teal-50 to-white" aria-labelledby="onboarding-title">
      <div className="flex items-start justify-between gap-4 border-b border-teal-100 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white">
            <ListChecks className="h-5 w-5" />
          </div>
          <div>
            <h2 id="onboarding-title" className="text-base font-semibold text-slate-900">Get your AI employees ready</h2>
            <p className="mt-1 text-sm text-slate-600">Complete these steps to get your first useful result.</p>
          </div>
        </div>
        <button type="button" onClick={dismiss} aria-label="Dismiss onboarding checklist" className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-5 py-4">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
          <span>{completed.length} of {steps.length} complete</span>
          <span>{completionPercent}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-teal-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completionPercent}>
          <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${completionPercent}%` }} />
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {steps.map((step) => {
            const isComplete = completed.includes(step.id);
            const Icon = step.icon;
            return (
              <div key={step.id} className={`flex items-start gap-3 rounded-xl border p-3 ${isComplete ? 'border-green-200 bg-green-50/70' : 'border-slate-200 bg-white'}`}>
                <button type="button" onClick={() => toggleCompleted(step.id)} aria-label={`${isComplete ? 'Mark incomplete' : 'Mark complete'}: ${step.title}`} className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${isComplete ? 'border-green-600 bg-green-600 text-white' : 'border-slate-300 text-transparent hover:border-teal-500'}`}>
                  <CheckCircle2 className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${isComplete ? 'text-green-800 line-through' : 'text-slate-900'}`}>{step.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{step.description}</p>
                  {!isComplete && (
                    <button type="button" onClick={() => setView(step.view)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800">
                      <Icon className="h-3.5 w-3.5" />
                      Open step
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
