import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { ModeCard } from '@/components/ModeCard';
import { Screen } from '@/components/Screen';
import { GAME_MODES } from '@/constants/game';
import { usePlayerStore } from '@/store/playerStore';
import type { RootStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const coins = usePlayerStore((s) => s.coins);
  const xp = usePlayerStore((s) => s.xp);
  const level = usePlayerStore((s) => s.level);

  return (
    <Screen>
      <View style={styles.topBar}>
        <View>
          <Text style={{ color: theme.colors.onSurfaceVariant }} variant="labelLarge">READY TO EXPLORE?</Text>
          <Text variant="headlineMedium">Country Quest</Text>
        </View>
        <Pressable accessibilityLabel="Open settings" onPress={() => navigation.navigate('Settings')}>
          <MaterialCommunityIcons color={theme.colors.onSurface} name="cog-outline" size={28} />
        </Pressable>
      </View>

      <LinearGradient colors={['#4F46E5', '#7C3AED']} end={{ x: 1, y: 1 }} style={styles.hero}>
        <Text style={styles.heroEyebrow}>YOUR WORLD AWAITS</Text>
        <Text style={styles.heroTitle}>Learn flags.{`\n`}Travel farther.</Text>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <MaterialCommunityIcons color="#FDE68A" name="star" size={19} />
            <Text style={styles.heroStatText}>Level {level} · {xp} XP</Text>
          </View>
          <View style={styles.heroStat}>
            <MaterialCommunityIcons color="#FDE68A" name="circle-multiple" size={19} />
            <Text style={styles.heroStatText}>{coins} coins</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.quickLinks}>
        <Pressable
          style={[styles.quickLink, { backgroundColor: theme.colors.surface }]}
          onPress={() => navigation.navigate('Stats')}
        >
          <MaterialCommunityIcons color={theme.colors.primary} name="chart-bar" size={22} />
          <Text variant="labelLarge">Stats</Text>
        </Pressable>
        <Pressable
          style={[styles.quickLink, { backgroundColor: theme.colors.surface }]}
          onPress={() => navigation.navigate('Achievements')}
        >
          <MaterialCommunityIcons color={theme.colors.primary} name="trophy-outline" size={22} />
          <Text variant="labelLarge">Achievements</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle} variant="titleLarge">Choose a game</Text>
      {Object.entries(GAME_MODES).map(([mode, config]) => (
        <ModeCard
          icon={config.icon}
          key={mode}
          subtitle={config.subtitle}
          title={config.title}
          onPress={() => navigation.navigate('Quiz', { mode: mode as keyof typeof GAME_MODES })}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 26 },
  hero: { borderRadius: 28, marginBottom: 20, overflow: 'hidden', padding: 25 },
  heroEyebrow: { color: '#C7D2FE', fontSize: 12, fontWeight: '800', letterSpacing: 1.1, marginBottom: 10 },
  heroTitle: { color: '#FFFFFF', fontSize: 29, fontWeight: '800', letterSpacing: -0.7, lineHeight: 35 },
  heroStats: { flexDirection: 'row', gap: 18, marginTop: 24 },
  heroStat: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  heroStatText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  quickLinks: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  quickLink: { alignItems: 'center', borderRadius: 16, flex: 1, gap: 6, justifyContent: 'center', paddingVertical: 14 },
  sectionTitle: { marginBottom: 15 },
});
