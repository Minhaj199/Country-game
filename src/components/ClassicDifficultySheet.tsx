import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Modal, Portal, Text, useTheme } from 'react-native-paper';
import { useState } from 'react';

import { DIFFICULTY_OPTIONS, isDifficultyUnlocked } from '@/constants/difficulty';
import type { DifficultySelection } from '@/types/country';

const DIFFICULTY_ICON: Record<DifficultySelection, { name: string; color: string }> = {
  easy:   { name: 'sprout',          color: '#22C55E' },
  medium: { name: 'fire',            color: '#F59E0B' },
  hard:   { name: 'skull-outline',   color: '#EF4444' },
  expert: { name: 'crown',           color: '#8B5CF6' },
  random: { name: 'shuffle-variant', color: '#3B82F6' },
};

interface Props {
  visible: boolean;
  level: number;
  onDismiss: () => void;
  onStart: (difficulty: DifficultySelection) => void;
}

export function ClassicDifficultySheet({ visible, level, onDismiss, onStart }: Props) {
  const theme = useTheme();
  const [selected, setSelected] = useState<DifficultySelection>('easy');

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.sheet, { backgroundColor: theme.colors.surface }]}
      >
        <View style={styles.handle} />
        <Text variant="titleLarge" style={styles.title}>Classic</Text>
        <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
          DIFFICULTY
        </Text>

        {DIFFICULTY_OPTIONS.map((option) => {
          const unlocked = isDifficultyUnlocked(option.id, level);
          const active = selected === option.id;
          return (
            <Pressable
              key={option.id}
              disabled={!unlocked}
              onPress={() => setSelected(option.id)}
              style={[
                styles.row,
                { borderColor: active ? theme.colors.primary : theme.colors.outlineVariant },
                active && { backgroundColor: theme.colors.primaryContainer },
                !unlocked && styles.rowDisabled,
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: DIFFICULTY_ICON[option.id].color + '22' }]}>
                <MaterialCommunityIcons
                  name={DIFFICULTY_ICON[option.id].name as never}
                  color={DIFFICULTY_ICON[option.id].color}
                  size={22}
                />
              </View>
              <View style={styles.rowText}>
                <Text variant="titleSmall" style={!unlocked && { color: theme.colors.onSurfaceDisabled }}>
                  {option.title}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {unlocked ? option.subtitle : 'Locked'}
                </Text>
              </View>
              {active && <Text style={{ color: theme.colors.primary }}>✓</Text>}
            </Pressable>
          );
        })}

        <Button
          mode="contained"
          style={styles.startBtn}
          onPress={() => { onDismiss(); onStart(selected); }}
        >
          Start Game
        </Button>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, bottom: 0, left: 0, padding: 24, paddingBottom: 36, position: 'absolute', right: 0 },
  handle: { alignSelf: 'center', backgroundColor: '#ccc', borderRadius: 3, height: 4, marginBottom: 20, width: 40 },
  title: { marginBottom: 20 },
  label: { marginBottom: 12 },
  row: { alignItems: 'center', borderRadius: 16, borderWidth: 1.5, flexDirection: 'row', gap: 14, marginBottom: 10, padding: 14 },
  rowDisabled: { opacity: 0.45 },
  rowText: { flex: 1 },
  iconWrap: { alignItems: 'center', borderRadius: 10, height: 42, justifyContent: 'center', width: 42 },
  startBtn: { borderRadius: 14, marginTop: 10 },
});
