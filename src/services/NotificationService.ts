import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const REMINDER_NOTIFICATION_ID = 'daily-reminder';

const MESSAGES = [
  { title: '🌍 Country Quest', body: "Ready for today's country challenge?" },
  { title: '🧠 Country Quest', body: 'Test your geography skills today!' },
  { title: '🚀 Country Quest', body: 'Keep your learning streak alive!' },
  { title: '🏆 Country Quest', body: "Can you beat yesterday's score?" },
  { title: '🌎 Country Quest', body: 'A new flag challenge is waiting for you!' },
  { title: '🎯 Country Quest', body: 'Just 5 minutes to sharpen your geography knowledge!' },
  { title: '⭐ Country Quest', body: "Don't break your daily streak!" },
  { title: '🗺️ Country Quest', body: 'Explore another country today!' },
];

function randomMessage() {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('daily-reminder', {
    name: 'Daily Reminder',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#4F46E5',
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleReminder(hour: number, minute: number): Promise<void> {
  try {
    await cancelReminder();
    await ensureAndroidChannel();
    const { title, body } = randomMessage();
    await Notifications.scheduleNotificationAsync({
      identifier: REMINDER_NOTIFICATION_ID,
      content: {
        title,
        body,
        sound: true,
        ...(Platform.OS === 'android' && { channelId: 'daily-reminder' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  } catch {
    // Silently ignore — notifications not supported in this environment (e.g. Expo Go)
  }
}

export async function cancelReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_NOTIFICATION_ID);
  } catch {
    // Silently ignore
  }
}

export async function getReminderStatus(): Promise<boolean> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.some((n) => n.identifier === REMINDER_NOTIFICATION_ID);
  } catch {
    return false;
  }
}
