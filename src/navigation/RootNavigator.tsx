import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AchievementsScreen } from '@/screens/AchievementsScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { QuizScreen } from '@/screens/QuizScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { StatsScreen } from '@/screens/StatsScreen';
import type { RootStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Quiz" component={QuizScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Stats" component={StatsScreen} />
      <Stack.Screen name="Achievements" component={AchievementsScreen} />
    </Stack.Navigator>
  );
}
