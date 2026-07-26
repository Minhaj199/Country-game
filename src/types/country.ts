export type CountryDifficulty = 'easy' | 'medium' | 'hard';

export interface Country {
  id: number;
  name: string;
  officialName: string;
  iso2: string;
  iso3: string;
  capital: string;
  continent: string;
  population: number;
  languages: string[];
  currency: string;
  flag: string;
  difficulty: CountryDifficulty;
  fact: string;
}
