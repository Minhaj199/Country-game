import { useCallback, useState } from 'react';

import {
  cancelReminder,
  requestNotificationPermission,
  scheduleReminder,
} from '@/services/NotificationService';
import { useSettingsStore } from '@/store/settingsStore';

export function useNotifications() {
  const reminderEnabled = useSettingsStore((s) => s.reminderEnabled);
  const reminderHour = useSettingsStore((s) => s.reminderHour);
  const reminderMinute = useSettingsStore((s) => s.reminderMinute);
  const setReminder = useSettingsStore((s) => s.setReminder);
  const [loading, setLoading] = useState(false);

  const toggleReminder = useCallback(async () => {
    setLoading(true);
    try {
      if (reminderEnabled) {
        await cancelReminder();
        setReminder(false);
      } else {
        const granted = await requestNotificationPermission();
        if (!granted) return;
        await scheduleReminder(reminderHour, reminderMinute);
        setReminder(true);
      }
    } finally {
      setLoading(false);
    }
  }, [reminderEnabled, reminderHour, reminderMinute, setReminder]);

  const updateTime = useCallback(async (hour: number, minute: number) => {
    setLoading(true);
    try {
      setReminder(true, hour, minute);
      await scheduleReminder(hour, minute);
    } finally {
      setLoading(false);
    }
  }, [setReminder]);

  return { reminderEnabled, reminderHour, reminderMinute, loading, toggleReminder, updateTime };
}
