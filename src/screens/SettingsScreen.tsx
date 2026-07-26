import { StyleSheet, View } from 'react-native';
import { List, Switch, Text, useTheme } from 'react-native-paper';

import { Screen } from '@/components/Screen';
import { useSettingsStore } from '@/store/settingsStore';

export function SettingsScreen() {
  const theme = useTheme();
  const colorScheme = useSettingsStore((state) => state.colorScheme);
  const toggleColorScheme = useSettingsStore((state) => state.toggleColorScheme);

  return (
    <Screen>
      <View style={styles.heading}>
        <Text variant="headlineMedium">Settings</Text>
        <Text style={{ color: theme.colors.onSurfaceVariant }} variant="bodyLarge">Make Country Quest yours.</Text>
      </View>
      <List.Section>
        <List.Item
          description="Use a comfortable palette"
          left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
          right={() => <Switch value={colorScheme === 'dark'} onValueChange={toggleColorScheme} />}
          title="Dark mode"
        />
        <List.Item description="Coming in Phase 5" left={(props) => <List.Icon {...props} icon="music" />} title="Music" />
        <List.Item description="Coming in Phase 5" left={(props) => <List.Icon {...props} icon="volume-high" />} title="Sound effects" />
      </List.Section>
    </Screen>
  );
}

const styles = StyleSheet.create({ heading: { gap: 6, marginBottom: 20 } });
