import difficultyMap from '@/assets/data/difficultyMap.json';
import type { Country, CountryDifficulty, DifficultySelection } from '@/types/country';

export const DIFFICULTY_ORDER: readonly CountryDifficulty[] = ['easy', 'medium', 'hard', 'expert'];

export const DIFFICULTY_OPTIONS: ReadonlyArray<{ id: DifficultySelection; title: string; subtitle: string; icon: string }> = [
  { id: 'easy', title: 'Easy', subtitle: 'Familiar flags', icon: 'leaf' },
  { id: 'medium', title: 'Medium', subtitle: 'Easy + Medium', icon: 'compass-outline' },
  { id: 'hard', title: 'Hard', subtitle: 'Up to Hard', icon: 'mountain' },
  { id: 'expert', title: 'Expert', subtitle: 'All regions', icon: 'trophy-outline' },
  { id: 'random', title: 'Random', subtitle: 'Every country', icon: 'shuffle-variant' },
];

const EXPERT_ISO2_CODES = new Set([
  'AQ', 'AS', 'AI', 'AW', 'AX', 'BM', 'BQ', 'BV', 'IO', 'VG', 'KY', 'CX', 'CC', 'CK', 'CW', 'FK', 'FO', 'GF',
  'PF', 'TF', 'GI', 'GL', 'GP', 'GU', 'HK', 'IM', 'JE', 'MO', 'MQ', 'YT', 'MS', 'NC', 'NU', 'NF', 'MP', 'PN',
  'PR', 'RE', 'BL', 'SH', 'MF', 'PM', 'SX', 'GS', 'SJ', 'TK', 'TC', 'UM', 'VI', 'WF', 'EH',
]);

type DifficultyMapEntry = { difficulty: CountryDifficulty; popularityScore: number };
const overrides = difficultyMap as Record<string, DifficultyMapEntry>;

export function getCountryClassification(country: Pick<Country, 'iso2' | 'population'>): DifficultyMapEntry {
  const override = overrides[country.iso2.toUpperCase()];
  if (override) return override;
  if (EXPERT_ISO2_CODES.has(country.iso2.toUpperCase())) return { difficulty: 'expert', popularityScore: 8 };
  if (country.population >= 50_000_000) return { difficulty: 'easy', popularityScore: 90 };
  if (country.population >= 5_000_000) return { difficulty: 'medium', popularityScore: 60 };
  return { difficulty: 'hard', popularityScore: 30 };
}

export function difficultyForLevel(level: number): CountryDifficulty {
  return DIFFICULTY_ORDER[Math.min(Math.max(level, 1) - 1, DIFFICULTY_ORDER.length - 1)];
}

export function isDifficultyUnlocked(selection: DifficultySelection, level: number): boolean {
  if (selection === 'random') return level >= 4;
  return DIFFICULTY_ORDER.indexOf(selection) <= DIFFICULTY_ORDER.indexOf(difficultyForLevel(level));
}

export function countriesForDifficulty(countries: readonly Country[], selection: DifficultySelection): Country[] {
  if (selection === 'random') return [...countries];
  const maximumDifficulty = DIFFICULTY_ORDER.indexOf(selection);
  return countries.filter((country) => DIFFICULTY_ORDER.indexOf(country.difficulty) <= maximumDifficulty);
}
