import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

import { Screen } from '@/components/Screen';
import { GAME_MODES } from '@/constants/game';
import { countryService } from '@/services/CountryService';
import type { RootStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Quiz'>;

export function QuizScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const mode = GAME_MODES[route.params.mode];
  const hasLocalDataset = countryService.hasLocalDataset();

  return (
    <Screen scroll={false}>
      <View style={styles.content}>
        <Text variant="headlineMedium">{mode.title}</Text>
        <Text style={{ color: theme.colors.onSurfaceVariant }} variant="bodyLarge">
          {hasLocalDataset
            ? 'Country data is ready locally. Quiz gameplay arrives in Phase 3.'
            : 'Run npm run download-countries to generate the local country dataset.'}
        </Text>
      </View>
      <Button mode="contained" onPress={() => navigation.goBack()}>Back to modes</Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, gap: 12, justifyContent: 'center' },
});
