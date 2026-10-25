import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import InfoPages from '@/components/InfoPages';
import PublicFooter from '@/components/PublicFooter';
import { useAppStore, viewFromPath } from '@/lib/store';

describe('info pages', () => {
  beforeEach(() => {
    window.scrollTo = (() => undefined) as typeof window.scrollTo;
    window.history.pushState({}, '', '/');
    useAppStore.setState({ view: 'home' });
  });

  it('maps known paths to views and defaults to home', () => {
    expect(viewFromPath('/privacy')).toBe('privacy');
    expect(viewFromPath('/terms/')).toBe('terms');
    expect(viewFromPath('/refund')).toBe('refund');
    expect(viewFromPath('/contact')).toBe('contact');
    expect(viewFromPath('/')).toBe('home');
    expect(viewFromPath('/anything-else')).toBe('home');
  });

  it('footer links open the matching page and update the URL', () => {
    render(<PublicFooter />);

    fireEvent.click(screen.getByRole('button', { name: 'Privacy Policy' }));
    expect(useAppStore.getState().view).toBe('privacy');
    expect(window.location.pathname).toBe('/privacy');

    fireEvent.click(screen.getByRole('button', { name: 'Terms of Service' }));
    expect(window.location.pathname).toBe('/terms');

    fireEvent.click(screen.getByRole('button', { name: 'Refund Policy' }));
    expect(window.location.pathname).toBe('/refund');

    fireEvent.click(screen.getByRole('button', { name: 'Contact' }));
    expect(window.location.pathname).toBe('/contact');
  });

  it('returns the URL to the home path when leaving an info page', () => {
    useAppStore.getState().setView('privacy');
    useAppStore.getState().setView('home');
    expect(window.location.pathname).toBe('/');
  });

  it('renders each page with its heading', () => {
    const { rerender } = render(<InfoPages view="privacy" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeInTheDocument();

    rerender(<InfoPages view="terms" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Terms of Service' })).toBeInTheDocument();

    rerender(<InfoPages view="refund" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Refund Policy' })).toBeInTheDocument();

    rerender(<InfoPages view="contact" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Contact us' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'altwanwilliams22@gmail.com' }).length).toBeGreaterThan(0);
  });
});
