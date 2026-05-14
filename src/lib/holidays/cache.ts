import { loadJSON, saveJSON } from '../storage';
import type { BundeslandCode, CacheEntry, HolidayMap } from './types';

export function holidayCacheKey(year: number, state: BundeslandCode): string {
  return `holidays:${year}:${state}`;
}

interface ReadResult {
  data: HolidayMap;
  fetchedAt: number;
}

export function readHolidayCache(year: number, state: BundeslandCode): ReadResult | null {
  const raw = loadJSON<unknown>(holidayCacheKey(year, state), null);
  if (!raw || typeof raw !== 'object') return null;
  const entry = raw as Partial<CacheEntry>;
  if (typeof entry.fetchedAt !== 'number') return null;
  if (!entry.data || typeof entry.data !== 'object') return null;
  const map: HolidayMap = new Map();
  for (const [iso, name] of Object.entries(entry.data as Record<string, unknown>)) {
    if (typeof name === 'string') map.set(iso, name);
  }
  return { data: map, fetchedAt: entry.fetchedAt };
}

export function writeHolidayCache(
  year: number,
  state: BundeslandCode,
  data: HolidayMap
): void {
  const entry: CacheEntry = {
    fetchedAt: Date.now(),
    source: 'feiertage-api.de',
    data: Object.fromEntries(data),
  };
  saveJSON(holidayCacheKey(year, state), entry);
}
