import type { ImageSourcePropType } from 'react-native';

import type { Country } from '@/types/country';

export interface CountryRepository {
  getAll(): Country[];
  getById(id: number): Country | undefined;
  getByIso2(iso2: string): Country | undefined;
  getFlagSource(country: Country): ImageSourcePropType | undefined;
}
