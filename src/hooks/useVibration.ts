import { useCallback } from 'react';
import { Vibration } from 'react-native';

import { useSettingsStore } from '@/store/settingsStore';

export function useVibration() {
  const vibrationEnabled = useSettingsStore((s) => s.vibrationEnabled);

  const vibrate = useCallback((pattern: number | number[] = 40) => {
    if (!vibrationEnabled) return;
    Vibration.vibrate(pattern);
  }, [vibrationEnabled]);

  return { vibrate };
}
