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

export const useAppStore = create<AppState>((set) => ({
  view: 'home',
  setView: (v) => {
    set({ view: v, mobileNavOpen: false });
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  },
  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  user: null,
  isAdmin: false,
  setUser: (user) => set({ user }),
  setIsAdmin: (v) => set({ isAdmin: v }),
}));
