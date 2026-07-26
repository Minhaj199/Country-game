import type { Country } from '@/types/country';
import type { QuizQuestion } from '@/types/quiz';

export function shuffle<T>(items: readonly T[]): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

export function createQuestion(countries: readonly Country[], usedCountryIds: readonly number[]): QuizQuestion | undefined {
  if (countries.length < 4) return undefined;

  const unusedCountries = countries.filter((country) => !usedCountryIds.includes(country.id));
  const correctCountry = shuffle(unusedCountries)[0];
  if (!correctCountry) return undefined;

  const distractors = shuffle(countries.filter((country) => country.id !== correctCountry.id)).slice(0, 3);
  if (distractors.length !== 3) return undefined;

  return {
    id: `${correctCountry.id}-${usedCountryIds.length + 1}`,
    correctCountry,
    options: shuffle([correctCountry, ...distractors]),
  };
}
