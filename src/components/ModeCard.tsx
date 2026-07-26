import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

interface ModeCardProps {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}

export function ModeCard({ icon, title, subtitle, onPress }: ModeCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Start ${title} mode`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { backgroundColor: theme.colors.surface }, pressed && styles.pressed]}
    >
      <View style={[styles.icon, { backgroundColor: theme.colors.primaryContainer }]}>
        <MaterialCommunityIcons color={theme.colors.primary} name={icon as never} size={27} />
      </View>
      <View style={styles.copy}>
        <Text variant="titleMedium">{title}</Text>
        <Text style={{ color: theme.colors.onSurfaceVariant }} variant="bodyMedium">{subtitle}</Text>
      </View>
      <MaterialCommunityIcons color={theme.colors.onSurfaceVariant} name="chevron-right" size={24} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', borderRadius: 24, elevation: 2, flexDirection: 'row', gap: 14, marginBottom: 14, padding: 16 },
  copy: { flex: 1, gap: 3 },
  icon: { alignItems: 'center', borderRadius: 16, height: 54, justifyContent: 'center', width: 54 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
});
