import type { BundeslandCode, HolidayMap } from './types';

interface RawHoliday {
  datum?: unknown;
  hinweis?: unknown;
}

export function parseFeiertageApiResponse(raw: unknown): HolidayMap {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Unexpected response shape: expected object');
  }
  const result: HolidayMap = new Map();
  for (const [name, entry] of Object.entries(raw as Record<string, RawHoliday>)) {
    if (!entry || typeof entry !== 'object') continue;
    const datum = (entry as RawHoliday).datum;
    if (typeof datum !== 'string') continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) continue;
    result.set(datum, name);
  }
  return result;
}

export async function fetchFromFeiertageApi(
  year: number,
  state: BundeslandCode,
  signal?: AbortSignal
): Promise<HolidayMap> {
  const url = `https://feiertage-api.de/api/?jahr=${year}&nur_land=${state}`;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from feiertage-api.de`);
  }
  const json = await response.json();
  return parseFeiertageApiResponse(json);
}
