import type { ReactNode } from 'react';
import { Mail } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { View } from '@/lib/types';

const CONTACT_EMAIL = 'altwanwilliams22@gmail.com';
const LAST_UPDATED = 'October 18, 2026';

type InfoView = Extract<View, 'privacy' | 'terms' | 'refund' | 'contact'>;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <div className="mt-3 space-y-3 text-slate-600">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function EmailLink() {
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-teal-600 hover:text-teal-700">
      {CONTACT_EMAIL}
    </a>
  );
}

function PrivacyPolicy() {
  return (
    <>
      <p className="text-slate-600">
        This policy explains what information WorkforceAI collects, how it is used, and the choices you have. By using
        the service you agree to this policy.
      </p>
      <Section title="Information we collect">
        <List
          items={[
            'Account information: your name, email address, business name, and password (stored securely by our authentication provider).',
            'Business data you or your AI employees collect: leads, appointment requests, knowledge-base content, and settings.',
            'Chat and conversation content: messages that visitors send to the chat widget and the AI replies.',
            'Free AI audit submissions: the business details and contact information you submit.',
            'Technical data: error reports and basic diagnostics used to keep the service reliable.',
          ]}
        />
      </Section>
      <Section title="How we use information">
        <List
          items={[
            'To provide, operate, and improve the service, including answering customers, capturing leads, and booking appointments.',
            'To send account emails such as confirmations and password resets.',
            'To protect the service against abuse, spam, and fraud.',
            'To respond to your questions and support requests.',
          ]}
        />
        <p>We do not sell your personal information.</p>
      </Section>
      <Section title="Service providers">
        <p>We use trusted providers to run the service. They process data only to perform services for us:</p>
        <List
          items={[
            'Supabase: database, authentication, and server functions.',
            'Vercel: website hosting.',
            'OpenAI: generates AI replies. Chat messages are sent to OpenAI to produce a response.',
            'Cloudflare Turnstile: bot protection on public forms and chat.',
            'Resend: delivery of account emails.',
            'Sentry: error monitoring.',
          ]}
        />
      </Section>
      <Section title="AI-generated responses">
        <p>
          AI employees generate replies automatically and can make mistakes. Customers are told they are chatting with an
          AI assistant, and business owners are responsible for reviewing the leads and appointment requests it records.
        </p>
      </Section>
      <Section title="Data retention and your choices">
        <p>
          We keep your data while your account is active and as needed to provide the service. You can ask us to access,
          correct, or delete your account and associated data by emailing <EmailLink />. We will respond within a
          reasonable time.
        </p>
      </Section>
      <Section title="Security">
        <p>
          We use access controls, encryption in transit, and per-business data isolation to protect information. No
          system is completely secure, so we cannot guarantee absolute security.
        </p>
      </Section>
      <Section title="Children">
        <p>The service is intended for businesses and is not directed to children under 13.</p>
      </Section>
      <Section title="Changes to this policy">
        <p>We may update this policy. The date at the top shows when it last changed.</p>
      </Section>
      <Section title="Contact">
        <p>
          Questions about privacy? Email <EmailLink />.
        </p>
      </Section>
    </>
  );
}

function TermsOfService() {
  return (
    <>
      <p className="text-slate-600">
        These terms govern your use of WorkforceAI. By creating an account or using the service you agree to them.
      </p>
      <Section title="The service">
        <p>
          WorkforceAI provides AI employees that answer customer questions, capture leads, and help request
          appointments for local service businesses. Features may change as the product develops.
        </p>
      </Section>
      <Section title="Your account">
        <List
          items={[
            'You must provide accurate information and keep your password confidential.',
            'You are responsible for activity under your account.',
            'You must be able to form a binding contract and use the service for business purposes.',
          ]}
        />
      </Section>
      <Section title="Acceptable use">
        <p>You agree not to:</p>
        <List
          items={[
            'Use the service for unlawful, deceptive, harassing, or abusive purposes.',
            'Attempt to access other customers’ data or disrupt or reverse engineer the service.',
            'Send spam, or use the AI employees to impersonate a human or another business.',
            'Upload content that you do not have the right to use.',
          ]}
        />
      </Section>
      <Section title="AI output">
        <p>
          AI-generated responses may be inaccurate or incomplete. You are responsible for the information you provide to
          the AI, for reviewing the leads and appointment requests it records, and for confirming prices, availability,
          and commitments with your customers. AI replies are not professional, legal, or safety advice.
        </p>
      </Section>
      <Section title="Your data">
        <p>
          You keep ownership of the content and business data you provide. You give us permission to process it to
          operate the service, as described in our Privacy Policy.
        </p>
      </Section>
      <Section title="Fees">
        <p>
          Paid plans are not yet available. If plans are introduced, pricing, billing terms, and cancellation details
          will be shown before you are charged, and our Refund Policy will apply.
        </p>
      </Section>
      <Section title="Availability and changes">
        <p>
          We work to keep the service available but do not guarantee uninterrupted operation. We may modify or
          discontinue features, and may suspend accounts that violate these terms.
        </p>
      </Section>
      <Section title="Disclaimer and limitation of liability">
        <p>
          The service is provided “as is” without warranties of any kind. To the fullest extent permitted by law,
          WorkforceAI is not liable for indirect, incidental, or consequential damages, or for lost profits or leads
          arising from use of the service.
        </p>
      </Section>
      <Section title="Ending your account">
        <p>
          You may stop using the service at any time and request account deletion by emailing <EmailLink />.
        </p>
      </Section>
      <Section title="Changes and contact">
        <p>
          We may update these terms; continued use means you accept the changes. Questions? Email <EmailLink />.
        </p>
      </Section>
    </>
  );
}

function RefundPolicy() {
  return (
    <>
      <p className="text-slate-600">
        This policy explains how refunds work for WorkforceAI.
      </p>
      <Section title="Free access">
        <p>
          You can start for free without a credit card. There is nothing to refund while you are using free access.
        </p>
      </Section>
      <Section title="Paid plans">
        <p>
          Paid plans are not yet available. When they launch, the billing and cancellation terms will be shown
          clearly before you are charged, and this policy will be updated with the specific refund terms.
        </p>
      </Section>
      <Section title="Billing questions">
        <p>
          If you believe you were charged in error, email <EmailLink /> and we will review it promptly.
        </p>
      </Section>
    </>
  );
}

function ContactPage() {
  return (
    <>
      <p className="text-slate-600">
        Questions about WorkforceAI, your account, or your data? We read every message.
      </p>
      <div className="mt-8 flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white">
          <Mail className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Email us</h2>
          <p className="mt-1">
            <EmailLink />
          </p>
          <p className="mt-2 text-sm text-slate-500">We aim to reply within one business day.</p>
        </div>
      </div>
      <Section title="Want to see it in action?">
        <p>Start with the free AI audit to see how many customers you may be missing.</p>
      </Section>
    </>
  );
}

const pages: Record<InfoView, { title: string; showUpdated: boolean; body: () => ReactNode }> = {
  privacy: { title: 'Privacy Policy', showUpdated: true, body: PrivacyPolicy },
  terms: { title: 'Terms of Service', showUpdated: true, body: TermsOfService },
  refund: { title: 'Refund Policy', showUpdated: true, body: RefundPolicy },
  contact: { title: 'Contact us', showUpdated: false, body: ContactPage },
};

export default function InfoPages({ view }: { view: InfoView }) {
  const { setView } = useAppStore();
  const page = pages[view];
  const Body = page.body;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => setView('home')}
        className="text-sm font-medium text-teal-600 hover:text-teal-700"
      >
        ← Back to home
      </button>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{page.title}</h1>
      {page.showUpdated && <p className="mt-2 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>}
      <div className="mt-6">
        <Body />
      </div>
    </div>
  );
}
