import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, IconButton, ProgressBar, Text, useTheme } from 'react-native-paper';

import { AnswerButton } from '@/components/AnswerButton';
import { ConfettiOverlay } from '@/components/ConfettiOverlay';
import { CountryInfoCard } from '@/components/CountryInfoCard';
import { FlashOverlay } from '@/components/FlashOverlay';
import { Screen } from '@/components/Screen';
import { SlideView } from '@/components/SlideView';
import { GAME_MODES } from '@/constants/game';
import { HINT_COSTS, STARTING_LIVES } from '@/constants/player';
import { QUIZ_MODE_RULES } from '@/constants/quiz';
import { useQuizGame } from '@/hooks/useQuizGame';
import { useSound } from '@/hooks/useSound';
import { useVibration } from '@/hooks/useVibration';
import { LocalCountryRepository } from '@/repository/LocalCountryRepository';
import { countryService } from '@/services/CountryService';
import { usePlayerStore } from '@/store/playerStore';
import type { RootStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Quiz'>;

const countryRepository = new LocalCountryRepository();

export function QuizScreen({ navigation, route }: Props) {
  const mode = route.params.mode;
  const theme = useTheme();
  const { session, summary, answer, nextQuestion, restart, useHint } = useQuizGame(mode);
  const coins = usePlayerStore((s) => s.coins);
  const { play } = useSound();
  const { vibrate } = useVibration();
  const rules = QUIZ_MODE_RULES[mode];
  const question = session.currentQuestion;
  const answeredQuestions = session.correctAnswers + session.wrongAnswers;

  function handleAnswer(countryId: number) {
    answer(countryId);
    const correct = question?.correctCountry.id === countryId;
    play(correct ? 'correct' : 'wrong');
    if (!correct) vibrate([0, 40, 30, 40]);
  }

  function handleHint(hint: Parameters<typeof useHint>[0]) {
    play('click');
    useHint(hint);
  }

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
    const isPerfect = summary.perfectBonus > 0;
    return (
      <Screen scroll={false}>
        <ConfettiOverlay visible={isPerfect} />
        <View style={styles.centered}>
          <View style={[styles.trophy, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons color={theme.colors.primary} name="trophy-outline" size={58} />
          </View>
          <Text variant="headlineMedium">Round complete!</Text>
          <Text style={{ color: theme.colors.primary, fontWeight: '800' }} variant="displaySmall">{summary.score} pts</Text>
          <Text style={styles.centerText} variant="bodyLarge">
            {summary.correctAnswers} correct · {summary.wrongAnswers} incorrect
          </Text>
          {isPerfect && (
            <Text style={{ color: theme.colors.primary }} variant="titleMedium">Perfect game +{summary.perfectBonus}</Text>
          )}
          <View style={styles.summaryRow}>
            <Chip icon="fire" compact>{session.streak > 0 ? `Best streak: ${session.streak}` : 'No streak'}</Chip>
            <Chip icon="heart" compact>{session.lives}/{STARTING_LIVES} lives left</Chip>
          </View>
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

  const flashCorrect = session.status === 'answered' && session.answerResult
    ? session.answerResult.correct
    : null;

  return (
    <Screen>
      <FlashOverlay correct={flashCorrect} />

      <View style={styles.header}>
        <Button compact icon="chevron-left" mode="text" onPress={() => navigation.goBack()}>Exit</Button>
        <View style={styles.headerRight}>
          <View style={styles.livesRow}>
            {Array.from({ length: STARTING_LIVES }).map((_, i) => (
              <MaterialCommunityIcons
                key={i}
                name={i < session.lives ? 'heart' : 'heart-outline'}
                color={i < session.lives ? '#EF4444' : theme.colors.outlineVariant}
                size={20}
              />
            ))}
          </View>
          <View style={styles.score}>
            <MaterialCommunityIcons color={theme.colors.primary} name="star-four-points" size={18} />
            <Text variant="titleMedium">{session.score}</Text>
          </View>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressMeta}>
          <Text style={{ color: theme.colors.onSurfaceVariant }} variant="labelLarge">{GAME_MODES[mode].title}</Text>
          <Text style={{ color: theme.colors.onSurfaceVariant }} variant="labelLarge">{progressLabel}</Text>
        </View>
        <ProgressBar
          color={mode === 'timeAttack' ? '#F97316' : theme.colors.primary}
          progress={progress}
          style={styles.progress}
        />
      </View>

      {session.streak >= 2 && (
        <View style={styles.streakRow}>
          <MaterialCommunityIcons name="fire" color="#F97316" size={18} />
          <Text style={styles.streakText}>{session.streak} streak!</Text>
        </View>
      )}

      <SlideView slideKey={question.id}>
        <Text style={styles.questionLabel} variant="titleLarge">Which country is this?</Text>
        {session.firstLetterRevealed && (
          <Text style={[styles.hintLabel, { color: theme.colors.primary }]} variant="labelLarge">
            Starts with "{question.correctCountry.name[0]}"
          </Text>
        )}

        <View style={styles.flagCard}>
          <LinearGradient
            colors={['#1E293B', '#0F172A', '#1E293B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {flagSource ? <Image contentFit="contain" source={flagSource} style={styles.flag} transition={150} /> : null}
        </View>

        {session.status === 'playing' && (
          <View style={styles.hintsRow}>
            <IconButton
              icon="approximately-equal"
              mode="outlined"
              size={20}
              disabled={coins < HINT_COSTS.fiftyFifty}
              onPress={() => handleHint('fiftyFifty')}
              accessibilityLabel={`50-50 hint (${HINT_COSTS.fiftyFifty} coins)`}
            />
            <IconButton
              icon="skip-next"
              mode="outlined"
              size={20}
              disabled={coins < HINT_COSTS.skip}
              onPress={() => handleHint('skip')}
              accessibilityLabel={`Skip hint (${HINT_COSTS.skip} coins)`}
            />
            <IconButton
              icon="alphabetical"
              mode="outlined"
              size={20}
              disabled={coins < HINT_COSTS.firstLetter || session.firstLetterRevealed}
              onPress={() => handleHint('firstLetter')}
              accessibilityLabel={`First letter hint (${HINT_COSTS.firstLetter} coins)`}
            />
            <View style={styles.coinBadge}>
              <MaterialCommunityIcons name="circle-multiple" color="#F59E0B" size={16} />
              <Text variant="labelMedium">{coins}</Text>
            </View>
          </View>
        )}

        <View style={styles.answers}>
          {question.options.map((option) => {
            const eliminated = session.eliminatedOptionIds.includes(option.id);
            return (
              <AnswerButton
                country={option}
                disabled={session.status !== 'playing' || eliminated}
                eliminated={eliminated}
                isCorrect={session.status === 'answered' && option.id === question.correctCountry.id}
                isSelected={session.status === 'answered' && option.id === selectedCountryId && option.id !== question.correctCountry.id}
                key={option.id}
                onPress={() => handleAnswer(option.id)}
              />
            );
          })}
        </View>
      </SlideView>

      {session.status === 'answered' && session.answerResult && (
        <>
          <Text
            style={[styles.feedback, { color: session.answerResult.correct ? '#15803D' : '#B91C1C' }]}
            variant="titleMedium"
          >
            {session.answerResult.correct
              ? `Correct! +${session.answerResult.pointsAwarded}`
              : `That was ${question.correctCountry.name}.`}
          </Text>
          {!session.answerResult.correct && session.lives > 0 && (
            <Text style={{ color: '#EF4444', textAlign: 'center' }} variant="labelLarge">
              {session.lives} {session.lives === 1 ? 'life' : 'lives'} remaining
            </Text>
          )}
          <CountryInfoCard country={question.correctCountry} />
          <Button mode="contained" onPress={nextQuestion} style={styles.nextButton}>
            {(mode === 'endless' && !session.answerResult.correct) || session.lives <= 0
              ? 'See results'
              : 'Next question'}
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
  coinBadge: { alignItems: 'center', flexDirection: 'row', gap: 3, marginLeft: 4 },
  feedback: { marginTop: 7, textAlign: 'center' },
  flag: { height: '100%', width: '100%', zIndex: 1 },
  flagCard: { borderRadius: 28, borderWidth: 1, borderColor: '#0F172A', elevation: 3, height: 180, marginBottom: 12, overflow: 'hidden', padding: 24, alignItems: 'center', justifyContent: 'center' },
  footerActions: { flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 17, marginLeft: -12 },
  headerRight: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  hintLabel: { marginBottom: 6, textAlign: 'center' },
  hintsRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  livesRow: { flexDirection: 'row', gap: 2 },
  nextButton: { marginTop: 16 },
  progress: { borderRadius: 99, height: 8, width: '100%' },
  progressMeta: { flexDirection: 'row', gap: 8, justifyContent: 'space-between', marginBottom: 8 },
  progressSection: { marginBottom: 16, width: '100%' },
  questionLabel: { marginBottom: 8, textAlign: 'center' },
  score: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  streakRow: { alignItems: 'center', flexDirection: 'row', gap: 4, justifyContent: 'center', marginBottom: 6 },
  streakText: { color: '#F97316', fontWeight: '700' },
  summaryRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  trophy: { alignItems: 'center', borderRadius: 32, height: 112, justifyContent: 'center', width: 112 },
});
