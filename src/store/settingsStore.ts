import { create } from 'zustand';

type ColorScheme = 'light' | 'dark';

interface SettingsState {
  colorScheme: ColorScheme;
  setColorScheme: (colorScheme: ColorScheme) => void;
  toggleColorScheme: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  colorScheme: 'light',
  setColorScheme: (colorScheme) => set({ colorScheme }),
  toggleColorScheme: () =>
    set((state) => ({ colorScheme: state.colorScheme === 'light' ? 'dark' : 'light' })),
}));
