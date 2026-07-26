import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import type { Country } from '@/types/country';

interface AnswerButtonProps {
  country: Country;
  disabled: boolean;
  eliminated?: boolean;
  isCorrect?: boolean;
  isSelected?: boolean;
  onPress: () => void;
}

export function AnswerButton({ country, disabled, eliminated, isCorrect, isSelected, onPress }: AnswerButtonProps) {
  const theme = useTheme();
  const resultColor = isCorrect ? theme.colors.primary : '#DC2626';
  const backgroundColor = eliminated
    ? theme.colors.surfaceDisabled
    : isCorrect ? '#DCFCE7' : isSelected ? '#FEE2E2' : theme.colors.surface;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, borderColor: isCorrect || isSelected ? resultColor : eliminated ? theme.colors.outlineVariant : theme.colors.outline },
        pressed && !disabled && styles.pressed,
        eliminated && styles.eliminated,
      ]}
    >
      <Text style={[styles.label, eliminated && styles.eliminatedText]} variant="titleMedium">{country.name}</Text>
      {(isCorrect || isSelected) && (
        <View style={[styles.indicator, { backgroundColor: resultColor }]}>
          <MaterialCommunityIcons color="#FFFFFF" name={isCorrect ? 'check' : 'close'} size={18} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', borderRadius: 18, borderWidth: 2, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 11, minHeight: 61, paddingHorizontal: 17 },
  eliminated: { opacity: 0.35 },
  eliminatedText: { textDecorationLine: 'line-through' },
  indicator: { alignItems: 'center', borderRadius: 13, height: 26, justifyContent: 'center', width: 26 },
  label: { flex: 1 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.985 }] },
});
