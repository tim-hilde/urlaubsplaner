import { describe, it, expect, beforeEach } from 'vitest';
import { readHolidayCache, writeHolidayCache, holidayCacheKey } from '../src/lib/holidays/cache';

beforeEach(() => {
  localStorage.clear();
});

describe('holidayCacheKey', () => {
  it('combines year and state', () => {
    expect(holidayCacheKey(2026, 'BY')).toBe('holidays:2026:BY');
  });
});

describe('write / read round trip', () => {
  it('returns null when nothing cached', () => {
    expect(readHolidayCache(2026, 'BY')).toBeNull();
  });

  it('persists and reads back a Map', () => {
    const map = new Map([
      ['2026-01-01', 'Neujahr'],
      ['2026-12-25', '1. Weihnachtstag'],
    ]);
    writeHolidayCache(2026, 'BY', map);
    const result = readHolidayCache(2026, 'BY');
    expect(result).not.toBeNull();
    expect(result!.data.get('2026-01-01')).toBe('Neujahr');
    expect(result!.data.get('2026-12-25')).toBe('1. Weihnachtstag');
    expect(result!.fetchedAt).toBeGreaterThan(0);
  });

  it('returns null on corrupted JSON', () => {
    localStorage.setItem('urlaubsplaner.v1.holidays:2026:BY', '{not-valid-json');
    expect(readHolidayCache(2026, 'BY')).toBeNull();
  });

  it('returns null when stored shape is invalid', () => {
    localStorage.setItem('urlaubsplaner.v1.holidays:2026:BY', JSON.stringify({ wrong: 'shape' }));
    expect(readHolidayCache(2026, 'BY')).toBeNull();
  });
});
