import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface SlideViewProps extends PropsWithChildren {
  slideKey: string | number;
}

export function SlideView({ children, slideKey }: SlideViewProps) {
  const translateX = useSharedValue(60);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = 60;
    opacity.value = 0;
    translateX.value = withTiming(0, { duration: 280 });
    opacity.value = withTiming(1, { duration: 280 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideKey]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}
