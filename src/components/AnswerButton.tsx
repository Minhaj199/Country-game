import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';

import type { Country } from '@/types/country';

interface AnswerButtonProps {
  country: Country;
  disabled: boolean;
  eliminated?: boolean;
  isCorrect?: boolean;
  isSelected?: boolean;
  onPress: () => void;
}

export const AnswerButton = memo(function AnswerButton({
  country, disabled, eliminated, isCorrect, isSelected, onPress,
}: AnswerButtonProps) {
  const theme = useTheme();
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  const isDark = theme.dark;
  const correctBg = isDark ? '#14532D' : '#DCFCE7';
  const correctBorder = isDark ? '#4ADE80' : theme.colors.primary;
  const correctText = isDark ? '#4ADE80' : theme.colors.primary;
  const wrongBg = isDark ? '#450A0A' : '#FEE2E2';
  const wrongBorder = '#EF4444';
  const wrongText = isDark ? '#FCA5A5' : '#DC2626';

  const resultBorderColor = isCorrect ? correctBorder : wrongBorder;
  const backgroundColor = eliminated
    ? theme.colors.surfaceDisabled
    : isCorrect ? correctBg : isSelected ? wrongBg : theme.colors.surface;

  // Shake on wrong selection
  useEffect(() => {
    if (isSelected) {
      translateX.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 50 }),
          withTiming(8, { duration: 50 }),
          withTiming(-6, { duration: 50 }),
          withTiming(6, { duration: 50 }),
          withTiming(0, { duration: 50 }),
        ),
        1,
      );
    }
  }, [isSelected, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
        style={[
          styles.button,
          {
            backgroundColor,
            borderColor: isCorrect
              ? correctBorder
              : isSelected
                ? wrongBorder
                : eliminated ? theme.colors.outlineVariant : theme.colors.outline,
          },
          eliminated && styles.eliminated,
        ]}
      >
        <Text
          style={[
            styles.label,
            eliminated && styles.eliminatedText,
            isCorrect && { color: correctText, fontWeight: '700' },
            isSelected && { color: wrongText, fontWeight: '700' },
          ]}
          variant="titleMedium"
        >
          {country.name}
        </Text>
        {(isCorrect || isSelected) && (
          <Animated.View style={[styles.indicator, { backgroundColor: isCorrect ? correctBorder : wrongBorder }]}>
            <MaterialCommunityIcons color="#FFFFFF" name={isCorrect ? 'check' : 'close'} size={18} />
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  button: { alignItems: 'center', borderRadius: 18, borderWidth: 2, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 11, minHeight: 61, paddingHorizontal: 17 },
  eliminated: { opacity: 0.35 },
  eliminatedText: { textDecorationLine: 'line-through' },
  indicator: { alignItems: 'center', borderRadius: 13, height: 26, justifyContent: 'center', width: 26 },
  label: { flex: 1 },
});
