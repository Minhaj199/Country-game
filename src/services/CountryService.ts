import { LocalCountryRepository } from '@/repository/LocalCountryRepository';
import { countriesForDifficulty, difficultyForLevel } from '@/constants/difficulty';
import type { Country, DifficultySelection } from '@/types/country';

export class CountryService {
  constructor(private readonly repository = new LocalCountryRepository()) {}

  getAll(): Country[] {
    return this.repository.getAll();
  }

  getUnlockedForLevel(level: number): Country[] {
    const highestDifficulty = difficultyForLevel(level);
    return countriesForDifficulty(this.repository.getAll(), highestDifficulty);
  }

  getAvailableForLevel(level: number, selection: DifficultySelection): Country[] {
    const unlockedCountries = this.getUnlockedForLevel(level);
    return countriesForDifficulty(unlockedCountries, selection);
  }

  hasLocalDataset(): boolean {
    return this.repository.getAll().length > 0;
  }
}

export const countryService = new CountryService();
