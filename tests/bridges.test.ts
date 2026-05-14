import { describe, it, expect } from 'vitest';
import { computeBridges } from '../src/lib/bridges';
import { fallbackHolidays } from '../src/lib/holidays/fallback';

describe('computeBridges', () => {
  it('suggests Friday after Christi Himmelfahrt (always a Thursday)', () => {
    const hols = fallbackHolidays(2026, 'NW');
    const bridges = computeBridges(2026, hols, {});
    // Christi Himmelfahrt 2026 = 2026-05-14 (Thursday). Bridge candidate: 2026-05-15.
    const himmelfahrtBridge = bridges.find((b) => b.bridgeDays.includes('2026-05-15'));
    expect(himmelfahrtBridge).toBeDefined();
    expect(himmelfahrtBridge!.holidayName).toBe('Christi Himmelfahrt');
  });

  it('returns sorted suggestions, best ratio first', () => {
    const hols = fallbackHolidays(2026, 'NW');
    const bridges = computeBridges(2026, hols, {});
    expect(bridges.length).toBeGreaterThan(0);
    for (let i = 1; i < bridges.length; i++) {
      const prevRatio = bridges[i - 1].totalOff / bridges[i - 1].bridgeDays.length;
      const curRatio = bridges[i].totalOff / bridges[i].bridgeDays.length;
      expect(prevRatio).toBeGreaterThanOrEqual(curRatio);
    }
  });

  it('returns empty array when no eligible holidays', () => {
    const result = computeBridges(2026, new Map(), {});
    expect(result).toEqual([]);
  });
});
