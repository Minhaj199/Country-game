import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  FAST_ANSWER_BONUS,
  FAST_ANSWER_THRESHOLD_MS,
  PERFECT_GAME_BONUS,
  QUIZ_MODE_RULES,
  SCORE_PER_CORRECT_ANSWER,
} from '@/constants/quiz';
import { HINT_COSTS, STARTING_LIVES } from '@/constants/player';
import { countryService } from '@/services/CountryService';
import { usePlayerStore } from '@/store/playerStore';
import type { HintType, QuizSession, QuizSummary } from '@/types/quiz';
import type { QuizMode } from '@/types/navigation';
import type { DifficultySelection } from '@/types/country';
import { createQuestion } from '@/utils/quizEngine';

function createSession(mode: QuizMode, difficulty: DifficultySelection, level: number): QuizSession {
  const countries = countryService.getAvailableForLevel(level, difficulty);
  const firstQuestion = createQuestion(countries, []);
  const timeLimitSeconds = QUIZ_MODE_RULES[mode].timeLimitSeconds;

  if (!firstQuestion) {
    return {
      mode, status: 'unavailable',
      usedCountryIds: [], questionNumber: 0,
      score: 0, correctAnswers: 0, wrongAnswers: 0,
      lives: STARTING_LIVES, streak: 0,
      timeRemainingSeconds: timeLimitSeconds,
      eliminatedOptionIds: [], firstLetterRevealed: false,
    };
  }

  return {
    mode, status: 'playing',
    currentQuestion: firstQuestion,
    usedCountryIds: [firstQuestion.correctCountry.id],
    questionNumber: 1,
    score: 0, correctAnswers: 0, wrongAnswers: 0,
    lives: STARTING_LIVES, streak: 0,
    timeRemainingSeconds: timeLimitSeconds,
    eliminatedOptionIds: [], firstLetterRevealed: false,
  };
}

function toSummary(session: QuizSession): QuizSummary {
  const answeredQuestions = session.correctAnswers + session.wrongAnswers;
  const isPerfect = answeredQuestions > 0 && session.wrongAnswers === 0;
  const perfectBonus = isPerfect ? PERFECT_GAME_BONUS : 0;
  return {
    score: session.score + perfectBonus,
    baseScore: session.score,
    perfectBonus,
    correctAnswers: session.correctAnswers,
    wrongAnswers: session.wrongAnswers,
    answeredQuestions,
  };
}

export function useQuizGame(mode: QuizMode, difficulty: DifficultySelection) {
  const level = usePlayerStore((s) => s.level);
  const [session, setSession] = useState<QuizSession>(() => createSession(mode, difficulty, level));
  const answerStartedAt = useRef(Date.now());
  const rules = QUIZ_MODE_RULES[mode];
  const countries = useMemo(() => countryService.getAvailableForLevel(level, difficulty), [difficulty, level]);
  const summary = useMemo(() => (session.status === 'complete' ? toSummary(session) : undefined), [session]);

  const rewardCorrectAnswer = usePlayerStore((s) => s.rewardCorrectAnswer);
  const recordGame = usePlayerStore((s) => s.recordGame);
  const spendCoins = usePlayerStore((s) => s.spendCoins);
  const gameRecorded = useRef(false);

  // Reward player after a correct answer (outside the setSession updater to avoid setState-during-render)
  const lastAnswerResult = session.answerResult;
  const lastAnswerKey = lastAnswerResult
    ? `${lastAnswerResult.selectedCountryId}-${session.questionNumber}`
    : null;
  const rewardedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!lastAnswerKey || rewardedKey.current === lastAnswerKey) return;
    if (!lastAnswerResult?.correct) return;
    rewardedKey.current = lastAnswerKey;
    rewardCorrectAnswer();
  }, [lastAnswerKey, lastAnswerResult?.correct, rewardCorrectAnswer]);

  // Record game once when complete
  useEffect(() => {
    if (session.status !== 'complete' || gameRecorded.current) return;
    const answeredQuestions = session.correctAnswers + session.wrongAnswers;
    if (answeredQuestions === 0) return;
    gameRecorded.current = true;
    recordGame({
      score: toSummary(session).score,
      correctAnswers: session.correctAnswers,
      wrongAnswers: session.wrongAnswers,
      totalResponseTimeMs: 0,
      bestStreak: session.streak,
      correctByContinent: {},
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.status]);

  const restart = useCallback(() => {
    answerStartedAt.current = Date.now();
    gameRecorded.current = false;
    rewardedKey.current = null;
    setSession(createSession(mode, difficulty, level));
  }, [difficulty, level, mode]);

  const finish = useCallback(() => {
    setSession((c) => c.status === 'complete' ? c : { ...c, status: 'complete' });
  }, []);

  const answer = useCallback((selectedCountryId: number) => {
    setSession((current) => {
      if (current.status !== 'playing' || !current.currentQuestion) return current;

      const responseTimeMs = Date.now() - answerStartedAt.current;
      const correct = current.currentQuestion.correctCountry.id === selectedCountryId;
      const fastBonusAwarded = correct && responseTimeMs < FAST_ANSWER_THRESHOLD_MS;
      const pointsAwarded = correct ? SCORE_PER_CORRECT_ANSWER + (fastBonusAwarded ? FAST_ANSWER_BONUS : 0) : 0;
      const newStreak = correct ? current.streak + 1 : 0;
      const newLives = correct ? current.lives : current.lives - 1;

      return {
        ...current,
        status: 'answered',
        score: current.score + pointsAwarded,
        correctAnswers: current.correctAnswers + Number(correct),
        wrongAnswers: current.wrongAnswers + Number(!correct),
        lives: newLives,
        streak: newStreak,
        answerResult: { selectedCountryId, correct, pointsAwarded, fastBonusAwarded, responseTimeMs },
      };
    });
  }, []);

  const nextQuestion = useCallback(() => {
    setSession((current) => {
      if (current.status !== 'answered') return current;

      const reachedQuestionLimit = Boolean(rules.questionLimit && current.questionNumber >= rules.questionLimit);
      const endlessMistake = mode === 'endless' && !current.answerResult?.correct;
      const noLives = current.lives <= 0;

      if (reachedQuestionLimit || endlessMistake || noLives) return { ...current, status: 'complete' };

      const next = createQuestion(countries, current.usedCountryIds);
      if (!next) return { ...current, status: 'complete' };

      answerStartedAt.current = Date.now();
      return {
        ...current,
        status: 'playing',
        currentQuestion: next,
        usedCountryIds: [...current.usedCountryIds, next.correctCountry.id],
        questionNumber: current.questionNumber + 1,
        answerResult: undefined,
        eliminatedOptionIds: [],
        firstLetterRevealed: false,
      };
    });
  }, [countries, mode, rules.questionLimit]);

  const useHint = useCallback((hint: HintType) => {
    const cost = HINT_COSTS[hint];
    if (!spendCoins(cost)) return false;

    setSession((current) => {
      if (current.status !== 'playing' || !current.currentQuestion) return current;

      if (hint === 'fiftyFifty') {
        const wrongOptions = current.currentQuestion.options
          .filter((o) => o.id !== current.currentQuestion!.correctCountry.id)
          .filter((o) => !current.eliminatedOptionIds.includes(o.id));
        const toEliminate = wrongOptions.slice(0, 2).map((o) => o.id);
        return { ...current, eliminatedOptionIds: [...current.eliminatedOptionIds, ...toEliminate] };
      }

      if (hint === 'firstLetter') {
        return { ...current, firstLetterRevealed: true };
      }

      if (hint === 'skip') {
        const next = createQuestion(countries, current.usedCountryIds);
        if (!next) return current;
        answerStartedAt.current = Date.now();
        return {
          ...current,
          currentQuestion: next,
          usedCountryIds: [...current.usedCountryIds, next.correctCountry.id],
          questionNumber: current.questionNumber + 1,
          eliminatedOptionIds: [],
          firstLetterRevealed: false,
        };
      }

      return current;
    });

    return true;
  }, [countries, spendCoins]);

  useEffect(() => {
    if (mode !== 'timeAttack' || session.status === 'complete' || session.status === 'unavailable') return;

    const timer = setInterval(() => {
      setSession((current) => {
        const remaining = current.timeRemainingSeconds ?? 0;
        if (remaining <= 1) return { ...current, timeRemainingSeconds: 0, status: 'complete' };
        return { ...current, timeRemainingSeconds: remaining - 1 };
      });
    }, 1_000);

    return () => clearInterval(timer);
  }, [mode, session.status]);

  return { session, summary, answer, nextQuestion, restart, finish, useHint };
}
