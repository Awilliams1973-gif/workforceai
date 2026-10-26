import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TurnstileWidget from '@/components/TurnstileWidget';

describe('TurnstileWidget', () => {
  beforeEach(() => {
    document.getElementById('cloudflare-turnstile-script')?.remove();
    delete window.turnstile;
  });

  it('fails closed when the public site key is missing', () => {
    render(<TurnstileWidget onToken={vi.fn()} siteKey="" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Security verification is not configured');
    expect(document.getElementById('cloudflare-turnstile-script')).toBeNull();
  });

  it('reports an unavailable verification script instead of failing silently', async () => {
    render(<TurnstileWidget onToken={vi.fn()} siteKey="test-site-key" />);

    const script = await waitFor(() => {
      const element = document.getElementById('cloudflare-turnstile-script');
      expect(element).not.toBeNull();
      return element as HTMLScriptElement;
    });
    fireEvent.error(script);

    expect(await screen.findByRole('alert')).toHaveTextContent('Security verification could not load');
  });

  it('renders the widget and reports a verified token', async () => {
    const onToken = vi.fn();
    let verify: ((token: string) => void) | undefined;
    const renderWidget = vi.fn((_container: HTMLElement, options: { sitekey: string; callback: (token: string) => void }) => {
      verify = options.callback;
      return 'widget-id';
    });
    render(<TurnstileWidget onToken={onToken} siteKey="test-site-key" />);

    const script = await waitFor(() => {
      const element = document.getElementById('cloudflare-turnstile-script');
      expect(element).not.toBeNull();
      return element as HTMLScriptElement;
    });
    window.turnstile = { render: renderWidget };
    fireEvent.load(script);

    await waitFor(() => expect(renderWidget).toHaveBeenCalledOnce());
    expect(renderWidget).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ sitekey: 'test-site-key', appearance: 'always' }),
    );
    act(() => verify?.('valid-test-token'));

    expect(onToken).toHaveBeenCalledWith('valid-test-token');
    expect(await screen.findByText('Security check complete. You can send your message.')).toBeInTheDocument();
  });
});
