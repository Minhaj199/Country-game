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
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  popularityScore: number;
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
const DIFFICULTY_MAP_PATH = path.join(DATA_DIRECTORY, 'difficultyMap.json');
const PAGE_LIMIT = 100;
const PAGE_OFFSETS = [0, 100, 200];
const RETRY_ATTEMPTS = 3;

type DifficultyEntry = Pick<CountryRecord, 'difficulty' | 'popularityScore'>;
type DifficultyMap = Record<string, DifficultyEntry>;
let difficultyMap: DifficultyMap = {};

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

async function loadDifficultyMap(): Promise<DifficultyMap> {
  try {
    const raw = JSON.parse(await readFile(DIFFICULTY_MAP_PATH, 'utf8')) as Record<string, unknown>;
    const result: DifficultyMap = {};
    for (const [key, value] of Object.entries(raw)) {
      // Skip comment keys
      if (key.startsWith('_') || typeof value !== 'object' || value === null) continue;
      const entry = value as Record<string, unknown>;
      if (typeof entry.difficulty === 'string' && typeof entry.popularityScore === 'number') {
        result[key] = { difficulty: entry.difficulty as DifficultyEntry['difficulty'], popularityScore: entry.popularityScore };
      }
    }
    return result;
  } catch {
    console.warn('difficultyMap.json not found or invalid — using auto-classification.');
    return {};
  }
}

function stringValue(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value.trim() || fallback;
  if (Array.isArray(value)) return stringValue(value[0], fallback);
  return fallback;
}

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(stringList).filter(Boolean);
  if (typeof value === 'string') return value.trim() ? [value.trim()] : [];
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap(stringList).filter(Boolean);
  }
  return [];
}

// The REST Countries v5 API returns currencies as an object keyed by currency code:
// { "USD": { "name": "United States dollar", "symbol": "$" } }
function currencyName(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    const list = stringList(value);
    return list[0] ?? 'Not available';
  }
  const entries = Object.values(value as Record<string, unknown>);
  for (const entry of entries) {
    const obj = objectValue(entry);
    if (obj) {
      const name = stringValue(obj.name);
      if (name) return name;
    }
  }
  return 'Not available';
}

function languageNames(value: unknown): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return stringList(value);
  // REST Countries v5 returns languages as { "eng": "English", "hin": "Hindi" }
  return Object.values(value as Record<string, unknown>)
    .map((v) => stringValue(v))
    .filter(Boolean);
}

const expertIso2Codes = new Set([
  'AQ', 'AS', 'AI', 'AW', 'AX', 'BM', 'BQ', 'BV', 'IO', 'VG', 'KY', 'CX', 'CC', 'CK', 'CW', 'FK', 'FO', 'GF',
  'PF', 'TF', 'GI', 'GL', 'GP', 'GU', 'HK', 'IM', 'JE', 'MO', 'MQ', 'YT', 'MS', 'NC', 'NU', 'NF', 'MP', 'PN',
  'PR', 'RE', 'BL', 'SH', 'MF', 'PM', 'SX', 'GS', 'SJ', 'TK', 'TC', 'UM', 'VI', 'WF', 'EH',
]);

function getClassification(iso2: string, population: number): DifficultyEntry {
  const override = difficultyMap[iso2];
  if (override) return override;
  if (expertIso2Codes.has(iso2)) return { difficulty: 'expert', popularityScore: 8 };
  if (population >= 50_000_000) return { difficulty: 'easy', popularityScore: 90 };
  if (population >= 5_000_000) return { difficulty: 'medium', popularityScore: 60 };
  return { difficulty: 'hard', popularityScore: 30 };
}

function countryRows(payload: unknown): SourceCountry[] {
  if (Array.isArray(payload)) return payload as SourceCountry[];
  if (!payload || typeof payload !== 'object') return [];

  const container = payload as Record<string, unknown>;
  for (const key of ['data', 'countries', 'results', 'objects']) {
    const value = container[key];
    if (Array.isArray(value)) return value as SourceCountry[];
    if (value && typeof value === 'object') {
      const nested = countryRows(value);
      if (nested.length) return nested;
    }
  }
  return [];
}

function normalizeCountry(source: SourceCountry): NormalizedCountry | null {
  const nameObject = objectValue(source.names ?? source.name);
  const codeObject = objectValue(source.codes);
  const v5Capital = Array.isArray(source.capitals)
    ? stringValue(objectValue(source.capitals[0])?.name)
    : undefined;

  const name = stringValue(nameObject?.common ?? source.name);
  const officialName = stringValue(nameObject?.official ?? source.officialName, name);
  const iso2 = stringValue(codeObject?.alpha_2 ?? source.cca2 ?? source.iso2 ?? source.alpha2Code).toUpperCase();
  const iso3 = stringValue(codeObject?.alpha_3 ?? source.cca3 ?? source.iso3 ?? source.alpha3Code).toUpperCase();
  const capital = v5Capital || stringValue(source.capital, 'Not available');
  const continent = stringValue(
    Array.isArray(source.continents) ? source.continents[0] : (source.region ?? source.continent ?? source.continents),
    'Other',
  );
  const population = Number(source.population) || 0;
  const languages = languageNames(source.languages);
  const currency = currencyName(source.currencies ?? source.currency);

  const flags = objectValue(source.flags);
  const flagObj = objectValue(source.flag);
  const flagUrl = stringValue(
    flagObj?.url_png ?? flagObj?.url_svg ?? flags?.png ?? flags?.svg ?? source.flagUrl ?? source.flag,
  );

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
    ...getClassification(iso2, population),
    fact: capital && capital !== 'Not available'
      ? `${capital} is the capital of ${name}.`
      : `${name} is located in ${continent}.`,
    flagUrl,
  };
}

async function requestWithRetry(url: string, headers: HeadersInit, label: string): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, { headers });
      if (response.ok) return response;
      lastError = new Error(`HTTP ${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error;
    }

    if (attempt < RETRY_ATTEMPTS) {
      const delay = attempt * 750;
      console.warn(`  ${label} failed (attempt ${attempt}/${RETRY_ATTEMPTS}), retrying in ${delay}ms…`);
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

async function downloadFlag(
  country: NormalizedCountry,
  headers: HeadersInit,
): Promise<{ fileName: string; downloaded: boolean }> {
  const fileName = `${country.iso2.toLowerCase()}.png`;
  const destination = path.join(FLAGS_DIRECTORY, fileName);
  if (await alreadyDownloaded(destination)) return { fileName, downloaded: false };

  const response = await requestWithRetry(country.flagUrl, headers, `Flag for ${country.name}`);
  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
  return { fileName, downloaded: true };
}

function createFlagAssetsFile(countries: CountryRecord[]): string {
  const entries = countries
    .map((c) => `  ${JSON.stringify(c.flag)}: require(${JSON.stringify(`../flags/${c.flag}`)}),`)
    .join('\n');

  return [
    '/* This file is generated by scripts/downloadCountries.ts. Do not edit manually. */',
    '/* eslint-disable @typescript-eslint/no-require-imports */',
    '',
    "import type { ImageSourcePropType } from 'react-native';",
    '',
    'export const flagAssets: Record<string, ImageSourcePropType> = {',
    entries,
    '};',
    '',
  ].join('\n');
}

async function main(): Promise<void> {
  const startedAt = Date.now();
  await loadEnvironmentFile();
  difficultyMap = await loadDifficultyMap();

  const apiKey = process.env.REST_COUNTRY_API_KEY;
  if (!apiKey) throw new Error('REST_COUNTRY_API_KEY is not set in .env');

  await Promise.all([
    mkdir(DATA_DIRECTORY, { recursive: true }),
    mkdir(FLAGS_DIRECTORY, { recursive: true }),
  ]);

  const baseUrl = (process.env.REST_COUNTRIES_BASE_URL ?? 'https://api.restcountries.com').replace(/\/$/, '');
  const headers = { Authorization: `Bearer ${apiKey}` };

  console.log('Fetching country data…');
  const pages = await Promise.all(
    PAGE_OFFSETS.map(async (offset) => {
      const url = `${baseUrl}/countries/v5?limit=${PAGE_LIMIT}&offset=${offset}`;
      const response = await requestWithRetry(url, headers, `Page offset=${offset}`);
      const rows = countryRows(await response.json());
      console.log(`  offset=${offset}: ${rows.length} rows`);
      return rows;
    }),
  );

  const seen = new Set<string>();
  const countries = pages
    .flat()
    .map(normalizeCountry)
    .filter((c): c is NormalizedCountry => c !== null)
    .filter((c) => {
      const key = c.iso3 || c.iso2 || c.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  if (!countries.length) {
    throw new Error('No valid countries returned. Check REST_COUNTRIES_BASE_URL and API key.');
  }

  console.log(`\nDownloading flags for ${countries.length} countries…`);
  let downloadedCount = 0;
  const failures: string[] = [];
  const completed: CountryRecord[] = [];

  for (const [index, country] of countries.entries()) {
    try {
      const { fileName, downloaded } = await downloadFlag(country, headers);
      if (downloaded) downloadedCount += 1;
      completed.push({ ...country, id: completed.length + 1, flag: fileName });
      const status = downloaded ? '↓' : '✓';
      process.stdout.write(`\r  [${index + 1}/${countries.length}] ${status} ${country.name.padEnd(40)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${country.name}: ${message}`);
      process.stdout.write(`\r  [${index + 1}/${countries.length}] ✗ ${country.name.padEnd(40)}\n`);
    }
  }

  process.stdout.write('\n');

  await writeFile(DATA_PATH, `${JSON.stringify(completed, null, 2)}\n`);
  await writeFile(FLAG_ASSETS_PATH, createFlagAssetsFile(completed));

  const elapsed = ((Date.now() - startedAt) / 1_000).toFixed(1);
  console.log('\n─────────────────────────────────');
  console.log(`Countries written : ${completed.length}`);
  console.log(`Flags downloaded  : ${downloadedCount} new, ${completed.length - downloadedCount} cached`);
  console.log(`Failed downloads  : ${failures.length}`);
  console.log(`Execution time    : ${elapsed}s`);
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach((f) => console.log(`  • ${f}`));
  }
  console.log('─────────────────────────────────');
}

main().catch((error: unknown) => {
  console.error('\n✗', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
