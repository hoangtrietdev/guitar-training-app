import { create } from 'zustand';
import type { AppSettings } from '@/types';

interface AppStore extends AppSettings {
  setTheme: (theme: AppSettings['theme']) => void;
  setVolume: (v: number) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  theme: 'dark',
  volume: 0.8,
  countInBars: 1,
  setTheme: (theme) => set({ theme }),
  setVolume: (volume) => set({ volume }),
}));
