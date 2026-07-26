import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface FlashOverlayProps {
  correct: boolean | null;
}

export function FlashOverlay({ correct }: FlashOverlayProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (correct === null) return;
    opacity.value = 0.25;
    opacity.value = withTiming(0, { duration: 500 });
  }, [correct, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    backgroundColor: correct ? '#16A34A' : '#DC2626',
  }));

  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]} />;
}
