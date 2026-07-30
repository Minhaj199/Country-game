import { Alert, Linking, StyleSheet, View } from 'react-native';
import { Divider, List, Switch, Text, useTheme } from 'react-native-paper';
import { useState } from 'react';

import { Screen } from '@/components/Screen';
import { TimePickerModal } from '@/components/TimePickerModal';
import { useNotifications } from '@/hooks/useNotifications';
import { usePlayerStore } from '@/store/playerStore';
import { useSettingsStore } from '@/store/settingsStore';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function SettingsScreen() {
  const theme = useTheme();
  const colorScheme = useSettingsStore((s) => s.colorScheme);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const vibrationEnabled = useSettingsStore((s) => s.vibrationEnabled);
  const toggleColorScheme = useSettingsStore((s) => s.toggleColorScheme);
  const toggleSound = useSettingsStore((s) => s.toggleSound);
  const toggleVibration = useSettingsStore((s) => s.toggleVibration);

  const { reminderEnabled, reminderHour, reminderMinute, loading, toggleReminder, updateTime } = useNotifications();
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  const resetPlayer = () => {
    usePlayerStore.setState({
      coins: 0, xp: 0, level: 1,
      statistics: {
        gamesPlayed: 0, highestScore: 0, correctAnswers: 0,
        wrongAnswers: 0, totalResponseTimeMs: 0, bestStreak: 0,
        continentCorrectAnswers: {},
      },
      achievements: {},
      lastDailyRewardDate: undefined,
    });
  };

  function confirmReset() {
    Alert.alert(
      'Reset Progress',
      'This will erase all your coins, XP, stats, and achievements. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetPlayer },
      ],
    );
  }

  return (
    <Screen>
      <View style={styles.heading}>
        <Text variant="headlineMedium">Settings</Text>
        <Text style={{ color: theme.colors.onSurfaceVariant }} variant="bodyLarge">Make Country Quest yours.</Text>
      </View>

      <List.Section>
        <List.Subheader>Appearance</List.Subheader>
        <List.Item
          description="Switch between light and dark palette"
          left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
          right={() => <Switch value={colorScheme === 'dark'} onValueChange={toggleColorScheme} />}
          title="Dark mode"
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Audio & Haptics</List.Subheader>
        <List.Item
          description="Play sounds on correct and wrong answers"
          left={(props) => <List.Icon {...props} icon="volume-high" />}
          right={() => <Switch value={soundEnabled} onValueChange={toggleSound} />}
          title="Sound effects"
        />
        <List.Item
          description="Vibrate on wrong answers"
          left={(props) => <List.Icon {...props} icon="vibrate" />}
          right={() => <Switch value={vibrationEnabled} onValueChange={toggleVibration} />}
          title="Vibration"
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Daily Reminder</List.Subheader>
        <List.Item
          description="Get a daily nudge to keep your streak alive"
          left={(props) => <List.Icon {...props} icon="bell-outline" />}
          right={() => (
            <Switch
              value={reminderEnabled}
              onValueChange={toggleReminder}
              disabled={loading}
            />
          )}
          title="Daily reminder"
        />
        {reminderEnabled && (
          <List.Item
            description={`Reminder set for ${pad(reminderHour)}:${pad(reminderMinute)}`}
            left={(props) => <List.Icon {...props} icon="clock-outline" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            title="Reminder time"
            onPress={() => setTimePickerVisible(true)}
          />
        )}
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Account</List.Subheader>
        <List.Item
          description="Erase all coins, XP, stats, and achievements"
          left={(props) => <List.Icon {...props} icon="delete-outline" />}
          title="Reset progress"
          titleStyle={{ color: theme.colors.error }}
          onPress={confirmReset}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>About</List.Subheader>
        <List.Item
          description="Help us grow with a 5-star review"
          left={(props) => <List.Icon {...props} icon="star-outline" />}
          title="Rate the app"
          onPress={() => Linking.openURL('market://details?id=com.countryquest.game')}
        />
        <List.Item
          description="https://countryquest.app/privacy"
          left={(props) => <List.Icon {...props} icon="shield-outline" />}
          title="Privacy policy"
          onPress={() => Linking.openURL('https://countryquest.app/privacy')}
        />
        <List.Item
          description="Country Quest v1.0.0"
          left={(props) => <List.Icon {...props} icon="information-outline" />}
          title="About"
        />
      </List.Section>

      <TimePickerModal
        visible={timePickerVisible}
        hour={reminderHour}
        minute={reminderMinute}
        onConfirm={(h, m) => {
          setTimePickerVisible(false);
          updateTime(h, m);
        }}
        onDismiss={() => setTimePickerVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({ heading: { gap: 6, marginBottom: 20 } });
