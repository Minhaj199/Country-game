import { LocalCountryRepository } from '@/repository/LocalCountryRepository';
import type { Country } from '@/types/country';

const COUNTRIES_PER_LEVEL = 20;

export class CountryService {
  constructor(private readonly repository = new LocalCountryRepository()) {}

  getAll(): Country[] {
    return this.repository.getAll();
  }

  getUnlockedForLevel(level: number): Country[] {
    const unlockedCount = Math.max(1, level) * COUNTRIES_PER_LEVEL;
    return this.repository.getAll().slice(0, unlockedCount);
  }

  hasLocalDataset(): boolean {
    return this.repository.getAll().length > 0;
  }
}

export const countryService = new CountryService();
