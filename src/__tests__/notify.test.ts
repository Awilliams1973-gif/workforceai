import { describe, expect, it, vi } from 'vitest';
import { notifyOwner } from '../../supabase/functions/_shared/notify';

const env = (values: Record<string, string>) => ({ get: (name: string) => values[name] });
const fullEnv = env({ RESEND_API_KEY: 're_test', OWNER_NOTIFY_EMAIL: 'owner@example.com', NOTIFY_FROM_EMAIL: 'alerts@example.com' });

describe('notifyOwner', () => {
  it('skips sending when any setting is missing', async () => {
    const fetchImpl = vi.fn();
    const sent = await notifyOwner({ subject: 's', lines: [] }, env({ RESEND_API_KEY: 'x' }), fetchImpl as unknown as typeof fetch);
    expect(sent).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('posts a plain-text email and strips line breaks from the subject', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true });
    const sent = await notifyOwner(
      { subject: 'New lead: A\r\nBcc: evil@example.com', lines: [['Name', 'Ann'], ['Phone', '']] },
      fullEnv,
      fetchImpl as unknown as typeof fetch,
    );
    expect(sent).toBe(true);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    const body = JSON.parse(init.body);
    expect(body.to).toEqual(['owner@example.com']);
    expect(body.subject).not.toMatch(/[\r\n]/);
    expect(body.text).toContain('Name: Ann');
    expect(body.text).toContain('Phone: -');
    expect(init.headers.Authorization).toBe('Bearer re_test');
  });

  it('returns false without throwing when the provider fails', async () => {
    const rejected = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    const thrown = vi.fn().mockRejectedValue(new Error('network'));
    expect(await notifyOwner({ subject: 's', lines: [] }, fullEnv, rejected as unknown as typeof fetch)).toBe(false);
    expect(await notifyOwner({ subject: 's', lines: [] }, fullEnv, thrown as unknown as typeof fetch)).toBe(false);
  });
});
