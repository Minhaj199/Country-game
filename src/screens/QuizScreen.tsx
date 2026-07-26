import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import { Button, ProgressBar, Text, useTheme } from 'react-native-paper';

import { AnswerButton } from '@/components/AnswerButton';
import { CountryInfoCard } from '@/components/CountryInfoCard';
import { Screen } from '@/components/Screen';
import { GAME_MODES } from '@/constants/game';
import { QUIZ_MODE_RULES } from '@/constants/quiz';
import { useQuizGame } from '@/hooks/useQuizGame';
import { LocalCountryRepository } from '@/repository/LocalCountryRepository';
import { countryService } from '@/services/CountryService';
import type { RootStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Quiz'>;

const countryRepository = new LocalCountryRepository();

export function QuizScreen({ navigation, route }: Props) {
  const mode = route.params.mode;
  const theme = useTheme();
  const { session, summary, answer, nextQuestion, restart } = useQuizGame(mode);
  const rules = QUIZ_MODE_RULES[mode];
  const question = session.currentQuestion;
  const answeredQuestions = session.correctAnswers + session.wrongAnswers;

  if (session.status === 'unavailable') {
    return (
      <Screen scroll={false}>
        <View style={styles.centered}>
          <MaterialCommunityIcons color={theme.colors.primary} name="database-alert-outline" size={56} />
          <Text variant="headlineSmall">Country data is missing</Text>
          <Text style={styles.centerText} variant="bodyLarge">Run npm run download-countries, then restart Expo.</Text>
        </View>
        <Button mode="contained" onPress={() => navigation.goBack()}>Back to modes</Button>
      </Screen>
    );
  }

  if (session.status === 'complete' && summary) {
    return (
      <Screen scroll={false}>
        <View style={styles.centered}>
          <View style={[styles.trophy, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons color={theme.colors.primary} name="trophy-outline" size={58} />
          </View>
          <Text variant="headlineMedium">Round complete!</Text>
          <Text style={{ color: theme.colors.primary, fontWeight: '800' }} variant="displaySmall">{summary.score} pts</Text>
          <Text style={styles.centerText} variant="bodyLarge">
            {summary.correctAnswers} correct · {summary.wrongAnswers} incorrect
          </Text>
          {summary.perfectBonus > 0 && <Text style={{ color: theme.colors.primary }} variant="titleMedium">Perfect game +{summary.perfectBonus}</Text>}
        </View>
        <View style={styles.footerActions}>
          <Button mode="outlined" onPress={() => navigation.goBack()}>Modes</Button>
          <Button mode="contained" onPress={restart}>Play again</Button>
        </View>
      </Screen>
    );
  }

  if (!question) return null;

  const flagSource = countryRepository.getFlagSource(question.correctCountry);
  const selectedCountryId = session.answerResult?.selectedCountryId;
  const questionLimit = rules.questionLimit;
  const totalCountries = countryService.getAll().length;
  const progress = mode === 'timeAttack'
    ? Math.max(0, (session.timeRemainingSeconds ?? 0) / (rules.timeLimitSeconds ?? 60))
    : Math.min(answeredQuestions / (questionLimit ?? totalCountries), 1);
  const progressLabel = mode === 'timeAttack'
    ? `${session.timeRemainingSeconds ?? 0}s remaining`
    : questionLimit
      ? `Question ${session.questionNumber} of ${questionLimit}`
      : `${answeredQuestions} of ${totalCountries} discovered`;

  return (
    <Screen>
      <View style={styles.header}>
        <Button compact icon="chevron-left" mode="text" onPress={() => navigation.goBack()}>Exit</Button>
        <View style={styles.score}>
          <MaterialCommunityIcons color={theme.colors.primary} name="star-four-points" size={18} />
          <Text variant="titleMedium">{session.score}</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressMeta}>
          <Text style={{ color: theme.colors.onSurfaceVariant }} variant="labelLarge">{GAME_MODES[mode].title}</Text>
          <Text style={{ color: theme.colors.onSurfaceVariant }} variant="labelLarge">{progressLabel}</Text>
        </View>
        <ProgressBar color={mode === 'timeAttack' ? '#F97316' : theme.colors.primary} progress={progress} style={styles.progress} />
      </View>

      <Text style={styles.questionLabel} variant="titleLarge">Which country is this?</Text>
      <View style={[styles.flagCard, { backgroundColor: theme.colors.surface }]}>
        {flagSource ? <Image contentFit="contain" source={flagSource} style={styles.flag} transition={150} /> : null}
      </View>

      <View style={styles.answers}>
        {question.options.map((option) => (
          <AnswerButton
            country={option}
            disabled={session.status !== 'playing'}
            isCorrect={session.status === 'answered' && option.id === question.correctCountry.id}
            isSelected={session.status === 'answered' && option.id === selectedCountryId && option.id !== question.correctCountry.id}
            key={option.id}
            onPress={() => answer(option.id)}
          />
        ))}
      </View>

      {session.status === 'answered' && session.answerResult && (
        <>
          <Text style={[styles.feedback, { color: session.answerResult.correct ? '#15803D' : '#B91C1C' }]} variant="titleMedium">
            {session.answerResult.correct ? `Correct! +${session.answerResult.pointsAwarded}` : `That was ${question.correctCountry.name}.`}
          </Text>
          <CountryInfoCard country={question.correctCountry} />
          <Button mode="contained" onPress={nextQuestion} style={styles.nextButton}>
            {mode === 'endless' && !session.answerResult.correct ? 'See results' : 'Next question'}
          </Button>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  answers: { marginTop: 4 },
  centerText: { textAlign: 'center' },
  centered: { alignItems: 'center', flex: 1, gap: 13, justifyContent: 'center' },
  feedback: { marginTop: 7, textAlign: 'center' },
  flag: { height: '100%', width: '100%' },
  flagCard: { alignItems: 'center', borderRadius: 28, elevation: 2, height: 180, justifyContent: 'center', marginBottom: 22, overflow: 'hidden', padding: 24 },
  footerActions: { flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 17, marginLeft: -12 },
  nextButton: { marginTop: 16 },
  progress: { borderRadius: 99, height: 8, width: '100%' },
  progressMeta: { flexDirection: 'row', gap: 8, justifyContent: 'space-between', marginBottom: 8 },
  progressSection: { marginBottom: 25, width: '100%' },
  questionLabel: { marginBottom: 15, textAlign: 'center' },
  score: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  trophy: { alignItems: 'center', borderRadius: 32, height: 112, justifyContent: 'center', width: 112 },
});
