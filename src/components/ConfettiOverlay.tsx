import LottieView from 'lottie-react-native';
import { StyleSheet, View } from 'react-native';

const CONFETTI_URL = 'https://assets10.lottiefiles.com/packages/lf20_u4yrau.json';

interface ConfettiOverlayProps {
  visible: boolean;
}

export function ConfettiOverlay({ visible }: ConfettiOverlayProps) {
  if (!visible) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LottieView
        autoPlay
        loop={false}
        source={{ uri: CONFETTI_URL }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
