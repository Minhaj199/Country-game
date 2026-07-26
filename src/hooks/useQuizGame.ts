import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  FAST_ANSWER_BONUS,
  FAST_ANSWER_THRESHOLD_MS,
  PERFECT_GAME_BONUS,
  QUIZ_MODE_RULES,
  SCORE_PER_CORRECT_ANSWER,
} from '@/constants/quiz';
import { countryService } from '@/services/CountryService';
import type { QuizSession, QuizSummary } from '@/types/quiz';
import type { QuizMode } from '@/types/navigation';
import { createQuestion } from '@/utils/quizEngine';

function createSession(mode: QuizMode): QuizSession {
  const countries = countryService.getAll();
  const firstQuestion = createQuestion(countries, []);
  const timeLimitSeconds = QUIZ_MODE_RULES[mode].timeLimitSeconds;

  if (!firstQuestion) {
    return {
      mode,
      status: 'unavailable',
      usedCountryIds: [],
      questionNumber: 0,
      score: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      timeRemainingSeconds: timeLimitSeconds,
    };
  }

  return {
    mode,
    status: 'playing',
    currentQuestion: firstQuestion,
    usedCountryIds: [firstQuestion.correctCountry.id],
    questionNumber: 1,
    score: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    timeRemainingSeconds: timeLimitSeconds,
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

export function useQuizGame(mode: QuizMode) {
  const [session, setSession] = useState<QuizSession>(() => createSession(mode));
  const answerStartedAt = useRef(Date.now());
  const rules = QUIZ_MODE_RULES[mode];
  const countries = useMemo(() => countryService.getAll(), []);
  const summary = useMemo(() => (session.status === 'complete' ? toSummary(session) : undefined), [session]);

  const restart = useCallback(() => {
    const newSession = createSession(mode);
    answerStartedAt.current = Date.now();
    setSession(newSession);
  }, [mode]);

  const finish = useCallback(() => {
    setSession((current) => current.status === 'complete' ? current : { ...current, status: 'complete' });
  }, []);

  const answer = useCallback((selectedCountryId: number) => {
    setSession((current) => {
      if (current.status !== 'playing' || !current.currentQuestion) return current;

      const responseTimeMs = Date.now() - answerStartedAt.current;
      const correct = current.currentQuestion.correctCountry.id === selectedCountryId;
      const fastBonusAwarded = correct && responseTimeMs < FAST_ANSWER_THRESHOLD_MS;
      const pointsAwarded = correct ? SCORE_PER_CORRECT_ANSWER + (fastBonusAwarded ? FAST_ANSWER_BONUS : 0) : 0;

      return {
        ...current,
        status: 'answered',
        score: current.score + pointsAwarded,
        correctAnswers: current.correctAnswers + Number(correct),
        wrongAnswers: current.wrongAnswers + Number(!correct),
        answerResult: { selectedCountryId, correct, pointsAwarded, fastBonusAwarded, responseTimeMs },
      };
    });
  }, []);

  const nextQuestion = useCallback(() => {
    setSession((current) => {
      if (current.status !== 'answered') return current;

      const reachedQuestionLimit = Boolean(rules.questionLimit && current.questionNumber >= rules.questionLimit);
      const endlessMistake = mode === 'endless' && !current.answerResult?.correct;
      if (reachedQuestionLimit || endlessMistake) return { ...current, status: 'complete' };

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
      };
    });
  }, [countries, mode, rules.questionLimit]);

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

  return { session, summary, answer, nextQuestion, restart, finish };
}
