import countriesJson from '@/assets/data/countries.json';
import { flagAssets } from '@/assets/data/flagAssets';
import { getCountryClassification } from '@/constants/difficulty';
import type { CountryRepository } from '@/repository/CountryRepository';
import type { Country } from '@/types/country';

export class LocalCountryRepository implements CountryRepository {
  // Normalizing here keeps installed builds compatible with datasets generated before Phase 7.
  private readonly countries: Country[] = (countriesJson as Array<Partial<Country> & Pick<Country, 'id' | 'iso2' | 'population'>>)
    .map((country) => ({
      ...country,
      ...getCountryClassification(country),
    })) as Country[];

  getAll(): Country[] {
    return this.countries;
  }

  getById(id: number): Country | undefined {
    return this.countries.find((country) => country.id === id);
  }

  getByIso2(iso2: string): Country | undefined {
    return this.countries.find((country) => country.iso2 === iso2.toUpperCase());
  }

  getFlagSource(country: Country) {
    return flagAssets[country.flag];
  }
}
