import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import AuthPage from '@/components/AuthPage';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
  },
  supabaseConfigured: true,
  SUPABASE_CONFIG_MESSAGE: 'Supabase is not configured.',
}));

describe('AuthPage password recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = (() => undefined) as typeof window.scrollTo;
    useAppStore.getState().setView('home');
    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({ data: {}, error: null });
    const user: User = {
      id: 'user-id',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'jane@example.com',
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: {},
      created_at: '2026-10-18T00:00:00.000Z',
    };
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({ data: { user }, error: null });
  });

  it('sends a reset link to the entered email', async () => {
    render(<AuthPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }));
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jane@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

    await waitFor(() => {
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('jane@example.com', {
        redirectTo: `${window.location.origin}/dashboard`,
      });
    });
    expect(await screen.findByText(/We sent a password reset link to/)).toBeInTheDocument();
  });

  it('shows an email-specific message when the reset email is rate limited', async () => {
    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
      data: null,
      error: new Error('email rate limit exceeded'),
    } as never);
    render(<AuthPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }));
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jane@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(await screen.findByText(/Too many emails have been requested/)).toBeInTheDocument();
  });

  it('updates the password after recovery and returns to the dashboard', async () => {
    const onPasswordRecoveryComplete = vi.fn();
    render(
      <AuthPage passwordRecovery onPasswordRecoveryComplete={onPasswordRecoveryComplete} />,
    );

    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'new-password-123' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'new-password-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update password' }));

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'new-password-123' });
    });
    expect(onPasswordRecoveryComplete).toHaveBeenCalledOnce();
    expect(useAppStore.getState().view).toBe('dashboard');
  });

  it('does not update the password when confirmation does not match', async () => {
    render(<AuthPage passwordRecovery />);

    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'new-password-123' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'different-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update password' }));

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it('rejects a new password that is too weak', async () => {
    render(<AuthPage passwordRecovery />);

    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'allletters' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'allletters' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Update password' }).closest('form')!);

    expect(await screen.findByText(/at least 10 characters and include letters and numbers/)).toBeInTheDocument();
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });
});
