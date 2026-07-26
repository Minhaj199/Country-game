import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type ColorScheme = 'light' | 'dark';

interface SettingsState {
  colorScheme: ColorScheme;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  toggleColorScheme: () => void;
  toggleSound: () => void;
  toggleVibration: () => void;
  resetProgress: () => void;
}

const storage = createJSONStorage(() => AsyncStorage);

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      colorScheme: 'light',
      soundEnabled: true,
      vibrationEnabled: true,
      toggleColorScheme: () =>
        set((s) => ({ colorScheme: s.colorScheme === 'light' ? 'dark' : 'light' })),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      toggleVibration: () => set((s) => ({ vibrationEnabled: !s.vibrationEnabled })),
      resetProgress: () => {},
    }),
    {
      name: 'country-quest-settings',
      storage,
      version: 1,
    },
  ),
);
