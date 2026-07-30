import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { Screen } from '@/components/Screen';
import { usePlayerStore } from '@/store/playerStore';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

function StatRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: theme.colors.surface }]}>
      <MaterialCommunityIcons color={theme.colors.primary} name={icon} size={22} />
      <Text style={styles.rowLabel} variant="bodyLarge">{label}</Text>
      <Text style={{ fontWeight: '700' }} variant="bodyLarge">{value}</Text>
    </View>
  );
}

export function StatsScreen() {
  const statistics = usePlayerStore((s) => s.statistics);
  const coins = usePlayerStore((s) => s.coins);
  const xp = usePlayerStore((s) => s.xp);
  const level = usePlayerStore((s) => s.level);

  const totalAnswered = statistics.correctAnswers + statistics.wrongAnswers;
  const accuracy = totalAnswered > 0
    ? `${Math.round((statistics.correctAnswers / totalAnswered) * 100)}%`
    : '—';
  const avgResponseSec = totalAnswered > 0
    ? `${(statistics.totalResponseTimeMs / totalAnswered / 1000).toFixed(1)}s`
    : '—';
  const favoriteContinent = Object.entries(statistics.continentCorrectAnswers).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  return (
    <Screen>
      <View style={styles.heading}>
        <Text variant="headlineMedium">Statistics</Text>
        <Text variant="bodyLarge">Level {level} · {xp} XP · {coins} coins</Text>
      </View>

      <StatRow icon="controller-classic" label="Games played" value={String(statistics.gamesPlayed)} />
      <StatRow icon="trophy-outline" label="Highest score" value={String(statistics.highestScore)} />
      <StatRow icon="check-circle-outline" label="Correct answers" value={String(statistics.correctAnswers)} />
      <StatRow icon="close-circle-outline" label="Wrong answers" value={String(statistics.wrongAnswers)} />
      <StatRow icon="percent" label="Accuracy" value={accuracy} />
      <StatRow icon="fire" label="Best streak" value={String(statistics.bestStreak)} />
      <StatRow icon="timer-outline" label="Avg response time" value={avgResponseSec} />
      <StatRow icon="earth" label="Favourite continent" value={favoriteContinent} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: 4, marginBottom: 20 },
  row: { alignItems: 'center', borderRadius: 16, flexDirection: 'row', gap: 12, marginBottom: 10, padding: 14 },
  rowLabel: { flex: 1 },
});
