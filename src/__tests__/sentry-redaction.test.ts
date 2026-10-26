import { describe, expect, it } from 'vitest';
import { redactPII } from '@/lib/sentry-redaction';

describe('Sentry PII redaction', () => {
  it('redacts email addresses and phone numbers in error messages', () => {
    expect(redactPII('Contact test@example.invalid at 2025550147')).toBe(
      'Contact [EMAIL_REDACTED] at [PHONE_REDACTED]',
    );
  });

  it('redacts nested PII fields and string values', () => {
    expect(redactPII({
      user: {
        email: 'test@example.invalid',
        phone: '202-555-0147',
        note: 'Call 202.555.0147',
      },
    })).toEqual({
      user: {
        email: '[REDACTED]',
        phone: '[REDACTED]',
        note: 'Call [PHONE_REDACTED]',
      },
    });
  });
});
