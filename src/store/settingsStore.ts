import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type ColorScheme = 'light' | 'dark';

interface SettingsState {
  colorScheme: ColorScheme;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  toggleColorScheme: () => void;
  toggleSound: () => void;
  toggleVibration: () => void;
  setReminder: (enabled: boolean, hour?: number, minute?: number) => void;
}

const storage = createJSONStorage(() => AsyncStorage);

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      colorScheme: 'light',
      soundEnabled: true,
      vibrationEnabled: true,
      reminderEnabled: false,
      reminderHour: 20,
      reminderMinute: 0,
      toggleColorScheme: () =>
        set((s) => ({ colorScheme: s.colorScheme === 'light' ? 'dark' : 'light' })),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      toggleVibration: () => set((s) => ({ vibrationEnabled: !s.vibrationEnabled })),
      setReminder: (enabled, hour, minute) =>
        set((s) => ({
          reminderEnabled: enabled,
          reminderHour: hour ?? s.reminderHour,
          reminderMinute: minute ?? s.reminderMinute,
        })),
    }),
    {
      name: 'country-quest-settings',
      storage,
      version: 2,
      migrate: (state: unknown, _fromVersion: number): Partial<SettingsState> => {
        // Merge persisted state with current defaults so new fields get their default values
        const persisted = (state ?? {}) as Partial<SettingsState>;
        return {
          colorScheme: persisted.colorScheme ?? 'light',
          soundEnabled: persisted.soundEnabled ?? true,
          vibrationEnabled: persisted.vibrationEnabled ?? true,
          reminderEnabled: false,
          reminderHour: 20,
          reminderMinute: 0,
        };
      },
    },
  ),
);
