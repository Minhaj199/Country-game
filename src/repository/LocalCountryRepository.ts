import countriesJson from '@/assets/data/countries.json';
import { flagAssets } from '@/assets/data/flagAssets';
import type { CountryRepository } from '@/repository/CountryRepository';
import type { Country } from '@/types/country';

export class LocalCountryRepository implements CountryRepository {
  private readonly countries = countriesJson as Country[];

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
