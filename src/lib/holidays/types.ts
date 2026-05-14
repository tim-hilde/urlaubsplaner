export type BundeslandCode =
  | 'BW' | 'BY' | 'BE' | 'BB' | 'HB' | 'HH' | 'HE' | 'MV'
  | 'NI' | 'NW' | 'RP' | 'SL' | 'SN' | 'ST' | 'SH' | 'TH';

export type HolidayMap = Map<string, string>;

export type HolidayStatus = 'loading' | 'fresh' | 'cached' | 'fallback' | 'error';

export interface HolidaysResult {
  data: HolidayMap;
  status: HolidayStatus;
  error?: Error;
  refresh: () => void;
}

export interface CacheEntry {
  fetchedAt: number;
  source: 'feiertage-api.de';
  data: Record<string, string>;
}
