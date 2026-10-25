import { create } from 'zustand';
import type { View } from './types';
import type { User } from '@supabase/supabase-js';

type AppState = {
  view: View;
  setView: (v: View) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  user: User | null;
  isAdmin: boolean;
  setUser: (user: User | null) => void;
  setIsAdmin: (v: boolean) => void;
};

export const infoViewPaths: Partial<Record<View, string>> = {
  privacy: '/privacy',
  terms: '/terms',
  refund: '/refund',
  contact: '/contact',
};

export const viewFromPath = (pathname: string): View => {
  const match = Object.entries(infoViewPaths).find(([, path]) => path === pathname.replace(/\/+$/, ''));
  return (match?.[0] as View | undefined) ?? 'home';
};

export const useAppStore = create<AppState>((set) => ({
  view: typeof window === 'undefined' ? 'home' : viewFromPath(window.location.pathname),
  setView: (v) => {
    set({ view: v, mobileNavOpen: false });
    const targetPath = infoViewPaths[v];
    const onInfoPath = Object.values(infoViewPaths).includes(window.location.pathname);
    if (targetPath && window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    } else if (!targetPath && onInfoPath) {
      window.history.pushState({}, '', '/');
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  },
  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  user: null,
  isAdmin: false,
  setUser: (user) => set({ user }),
  setIsAdmin: (v) => set({ isAdmin: v }),
}));
