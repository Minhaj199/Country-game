import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { Screen } from '@/components/Screen';
import { ACHIEVEMENTS, type AchievementId } from '@/constants/player';
import { usePlayerStore } from '@/store/playerStore';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const ACHIEVEMENT_ICONS: Record<AchievementId, IconName> = {
  firstWin: 'flag-checkered',
  hundredCorrect: 'school',
  perfectGame: 'star-circle',
  thousandCoins: 'cash-multiple',
  everyContinent: 'earth',
};

export function AchievementsScreen() {
  const theme = useTheme();
  const achievements = usePlayerStore((s) => s.achievements);

  return (
    <Screen>
      <View style={styles.heading}>
        <Text variant="headlineMedium">Achievements</Text>
        <Text style={{ color: theme.colors.onSurfaceVariant }} variant="bodyLarge">
          {Object.keys(achievements).length} / {Object.keys(ACHIEVEMENTS).length} unlocked
        </Text>
      </View>

      {(Object.keys(ACHIEVEMENTS) as AchievementId[]).map((id) => {
        const unlocked = Boolean(achievements[id]);
        const { title, description } = ACHIEVEMENTS[id];
        return (
          <View
            key={id}
            style={[
              styles.card,
              { backgroundColor: unlocked ? theme.colors.primaryContainer : theme.colors.surface },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: unlocked ? theme.colors.primary : theme.colors.surfaceVariant }]}>
              <MaterialCommunityIcons
                color={unlocked ? '#FFFFFF' : theme.colors.onSurfaceVariant}
                name={ACHIEVEMENT_ICONS[id]}
                size={26}
              />
            </View>
            <View style={styles.text}>
              <Text style={unlocked ? { color: theme.colors.onPrimaryContainer, fontWeight: '700' } : { color: theme.colors.onSurfaceVariant }} variant="titleSmall">
                {title}
              </Text>
              <Text style={{ color: unlocked ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }} variant="bodySmall">
                {description}
              </Text>
              {unlocked && achievements[id] && (
                <Text style={{ color: theme.colors.primary, fontSize: 11 }} variant="labelSmall">
                  Unlocked {new Date(achievements[id]!).toLocaleDateString()}
                </Text>
              )}
            </View>
            {!unlocked && (
              <MaterialCommunityIcons color={theme.colors.outlineVariant} name="lock-outline" size={20} />
            )}
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', borderRadius: 18, flexDirection: 'row', gap: 14, marginBottom: 12, padding: 14 },
  heading: { gap: 4, marginBottom: 20 },
  iconWrap: { alignItems: 'center', borderRadius: 14, height: 48, justifyContent: 'center', width: 48 },
  text: { flex: 1, gap: 2 },
});
