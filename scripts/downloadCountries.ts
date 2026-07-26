import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface CountryRecord {
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
  difficulty: 'easy' | 'medium' | 'hard';
  fact: string;
}

interface SourceCountry {
  [key: string]: unknown;
}

interface NormalizedCountry extends Omit<CountryRecord, 'id' | 'flag'> {
  flagUrl: string;
}

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIRECTORY = path.join(PROJECT_ROOT, 'src', 'assets', 'data');
const FLAGS_DIRECTORY = path.join(PROJECT_ROOT, 'src', 'assets', 'flags');
const DATA_PATH = path.join(DATA_DIRECTORY, 'countries.json');
const FLAG_ASSETS_PATH = path.join(DATA_DIRECTORY, 'flagAssets.ts');
const PAGE_LIMIT = 100;
const PAGE_OFFSETS = [0, 100, 200];
const RETRY_ATTEMPTS = 3;

async function loadEnvironmentFile(): Promise<void> {
  const environmentPath = path.join(PROJECT_ROOT, '.env');
  if (!existsSync(environmentPath)) return;

  const lines = (await readFile(environmentPath, 'utf8')).split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (!match || process.env[match[1]]) continue;

    const value = match[2].replace(/^(?:"|')|(?:"|')$/g, '');
    process.env[match[1]] = value;
  }
}

function stringValue(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value.trim() || fallback;
  if (Array.isArray(value)) return stringValue(value[0], fallback);
  return fallback;
}

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(stringList).filter(Boolean);
  if (typeof value === 'string') return value.trim() ? [value.trim()] : [];
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap(stringList).filter(Boolean);
  }
  return [];
}

function currencyName(value: unknown): string {
  if (Array.isArray(value)) {
    const namedCurrency = objectValue(value[0]);
    if (namedCurrency) return stringValue(namedCurrency.name, 'Not available');
  }
  const currencies = stringList(value);
  return currencies[0] ?? 'Not available';
}

function languageNames(value: unknown): string[] {
  if (!Array.isArray(value)) return stringList(value);

  return value
    .map((language) => stringValue(objectValue(language)?.name ?? language))
    .filter(Boolean);
}

function getDifficulty(population: number): CountryRecord['difficulty'] {
  if (population >= 50_000_000) return 'easy';
  if (population >= 5_000_000) return 'medium';
  return 'hard';
}

function countryRows(payload: unknown): SourceCountry[] {
  if (Array.isArray(payload)) return payload as SourceCountry[];
  if (!payload || typeof payload !== 'object') return [];

  const container = payload as Record<string, unknown>;
  for (const key of ['data', 'countries', 'results', 'objects']) {
    const value = container[key];
    if (Array.isArray(value)) return value as SourceCountry[];
    if (value && typeof value === 'object') {
      const nestedRows = countryRows(value);
      if (nestedRows.length) return nestedRows;
    }
  }
  return [];
}

function normalizeCountry(source: SourceCountry): NormalizedCountry | null {
  const nameObject = objectValue(source.names ?? source.name);
  const codeObject = objectValue(source.codes);
  const v5Capital = Array.isArray(source.capitals) ? objectValue(source.capitals[0])?.name : undefined;
  const name = stringValue(nameObject?.common ?? source.name);
  const officialName = stringValue(nameObject?.official ?? source.officialName, name);
  const iso2 = stringValue(codeObject?.alpha_2 ?? source.cca2 ?? source.iso2 ?? source.alpha2Code).toUpperCase();
  const iso3 = stringValue(codeObject?.alpha_3 ?? source.cca3 ?? source.iso3 ?? source.alpha3Code).toUpperCase();
  const capital = stringValue(v5Capital ?? source.capital, 'Not available');
  const continent = stringValue(source.region ?? source.continent ?? source.continents, 'Other');
  const population = Number(source.population) || 0;
  const languages = languageNames(source.languages);
  const currency = currencyName(source.currencies ?? source.currency);
  const flags = source.flags as Record<string, unknown> | undefined;
  const flag = objectValue(source.flag);
  const flagUrl = stringValue(flag?.url_png ?? flag?.url_svg ?? flags?.png ?? flags?.svg ?? source.flagUrl ?? source.flag);

  if (!name || !iso2 || !iso3 || !flagUrl.startsWith('http')) return null;

  return {
    name,
    officialName,
    iso2,
    iso3,
    capital,
    continent,
    population,
    languages: languages.length ? languages : ['Not available'],
    currency,
    difficulty: getDifficulty(population),
    fact: capital === 'Not available' ? `${name} is in ${continent}.` : `${capital} is the capital of ${name}.`,
    flagUrl,
  };
}

async function requestWithRetry(url: string, headers: HeadersInit, label: string): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, { headers });
      if (response.ok) return response;
      lastError = new Error(`${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error;
    }

    if (attempt < RETRY_ATTEMPTS) {
      const delay = attempt * 750;
      console.warn(`${label} failed (attempt ${attempt}/${RETRY_ATTEMPTS}); retrying in ${delay}ms.`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(`${label} failed after ${RETRY_ATTEMPTS} attempts: ${String(lastError)}`);
}

async function alreadyDownloaded(filePath: string): Promise<boolean> {
  try {
    return (await stat(filePath)).size > 0;
  } catch {
    return false;
  }
}

async function downloadFlag(country: NormalizedCountry, headers: HeadersInit): Promise<{ fileName: string; downloaded: boolean }> {
  const fileName = `${country.iso2.toLowerCase()}.png`;
  const destination = path.join(FLAGS_DIRECTORY, fileName);
  if (await alreadyDownloaded(destination)) return { fileName, downloaded: false };

  const response = await requestWithRetry(country.flagUrl, headers, `Flag for ${country.name}`);
  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
  return { fileName, downloaded: true };
}

function createFlagAssetsFile(countries: CountryRecord[]): string {
  const entries = countries
    .map((country) => `  ${JSON.stringify(country.flag)}: require(${JSON.stringify(`../flags/${country.flag}`)}),`)
    .join('\n');

  return `/* This file is generated by scripts/downloadCountries.ts. Do not edit manually. */\n\nimport type { ImageSourcePropType } from 'react-native';\n\nexport const flagAssets: Record<string, ImageSourcePropType> = {\n${entries}\n};\n`;
}

async function main(): Promise<void> {
  const startedAt = Date.now();
  await loadEnvironmentFile();

  const apiKey = process.env.REST_COUNTRY_API_KEY;
  if (!apiKey) throw new Error('REST_COUNTRY_API_KEY is required in .env to download country data.');

  await Promise.all([mkdir(DATA_DIRECTORY, { recursive: true }), mkdir(FLAGS_DIRECTORY, { recursive: true })]);

  const baseUrl = (process.env.REST_COUNTRIES_BASE_URL ?? 'https://api.restcountries.com').replace(/\/$/, '');
  const headers = { Authorization: `Bearer ${apiKey}` };
  const pages = await Promise.all(
    PAGE_OFFSETS.map(async (offset) => {
      const response = await requestWithRetry(`${baseUrl}/countries/v5?limit=${PAGE_LIMIT}&offset=${offset}`, headers, `Country page at offset ${offset}`);
      const rows = countryRows(await response.json());
      console.log(`Fetched offset ${offset}: ${rows.length} countries.`);
      return rows;
    }),
  );

  const duplicates = new Set<string>();
  const countries = pages
    .flat()
    .map(normalizeCountry)
    .filter((country): country is NormalizedCountry => country !== null)
    .filter((country) => {
      const key = country.iso3 || country.iso2 || country.name.toLowerCase();
      if (duplicates.has(key)) return false;
      duplicates.add(key);
      return true;
    })
    .sort((first, second) => first.name.localeCompare(second.name));

  if (!countries.length) throw new Error('No valid countries were returned. Check REST_COUNTRIES_BASE_URL and API credentials.');

  let downloadedCount = 0;
  const failures: string[] = [];
  const completed: CountryRecord[] = [];

  for (const [index, country] of countries.entries()) {
    try {
      const { fileName, downloaded } = await downloadFlag(country, headers);
      if (downloaded) downloadedCount += 1;
      completed.push({ ...country, id: completed.length + 1, flag: fileName });
      console.log(`[${index + 1}/${countries.length}] ${country.name}`);
    } catch (error) {
      failures.push(`${country.name}: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`Could not save ${country.name}'s flag.`);
    }
  }

  await writeFile(DATA_PATH, `${JSON.stringify(completed, null, 2)}\n`);
  await writeFile(FLAG_ASSETS_PATH, createFlagAssetsFile(completed));

  const elapsedSeconds = ((Date.now() - startedAt) / 1_000).toFixed(1);
  console.log('\nCountry data generation complete');
  console.log(`Total countries fetched: ${countries.length}`);
  console.log(`Countries written: ${completed.length}`);
  console.log(`Flags downloaded: ${downloadedCount}`);
  console.log(`Failed downloads: ${failures.length}`);
  console.log(`Execution time: ${elapsedSeconds}s`);
  if (failures.length) console.log(`Failures:\n${failures.join('\n')}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
