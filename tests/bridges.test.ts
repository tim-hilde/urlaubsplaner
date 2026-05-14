import { describe, it, expect } from 'vitest';
import { computeBridges } from '../src/lib/bridges';
import { fallbackHolidays } from '../src/lib/holidays/fallback';

describe('computeBridges', () => {
  it('computes correct gain for Christi Himmelfahrt (Thursday) bridge on Friday', () => {
    const hols = fallbackHolidays(2026, 'NW');
    const bridges = computeBridges(2026, hols, {});
    // Christi Himmelfahrt 2026 = Thursday 14.05.2026. Bridge = Friday 15.05.
    // Left of Fr: Thursday (holiday) = 1. Right of Fr: Sa+So = 2.
    // withBridgeOff = 1+1+2 = 4. naturalOff = max(1,2) = 2. gain = 2.
    const b = bridges.find((x) => x.bridgeDays.includes('2026-05-15'));
    expect(b).toBeDefined();
    expect(b!.holidayName).toBe('Christi Himmelfahrt');
    expect(b!.gain).toBe(2);
  });

  it('Tag der Arbeit Friday bridge has gain=1 and is filtered out (gain < 2)', () => {
    const hols = fallbackHolidays(2026, 'NW');
    const bridges = computeBridges(2026, hols, {});
    // Tag der Arbeit 2026 = Friday 01.05. Bridge = Thursday 30.04.
    // Left of Thu: Wed = workday = 0. Right of Thu: Fr(holiday)+Sa+So = 3.
    // withBridgeOff = 0+1+3 = 4. naturalOff = max(0,3) = 3. gain = 1 → filtered.
    const b = bridges.find((x) => x.bridgeDays.includes('2026-04-30'));
    expect(b).toBeUndefined();
  });

  it('Christi Himmelfahrt bridge is present and has gain >= 2 (ranks above any filtered gain=1 bridge)', () => {
    const hols = fallbackHolidays(2026, 'NW');
    const bridges = computeBridges(2026, hols, {});
    expect(bridges.length).toBeGreaterThan(0);
    const himmelfahrtIdx = bridges.findIndex((b) => b.bridgeDays.includes('2026-05-15'));
    expect(himmelfahrtIdx).toBeGreaterThanOrEqual(0);
    expect(bridges[himmelfahrtIdx].gain).toBeGreaterThanOrEqual(2);
  });

  it('all returned suggestions have gain >= 2', () => {
    const hols = fallbackHolidays(2026, 'NW');
    const bridges = computeBridges(2026, hols, {});
    for (const b of bridges) {
      expect(b.gain).toBeGreaterThanOrEqual(2);
    }
  });

  it('returns sorted by leverage (gain/cost) descending', () => {
    const hols = fallbackHolidays(2026, 'NW');
    const bridges = computeBridges(2026, hols, {});
    expect(bridges.length).toBeGreaterThan(0);
    for (let i = 1; i < bridges.length; i++) {
      const prevLeverage = bridges[i - 1].gain / bridges[i - 1].bridgeDays.length;
      const curLeverage = bridges[i].gain / bridges[i].bridgeDays.length;
      expect(prevLeverage).toBeGreaterThanOrEqual(curLeverage);
    }
  });

  it('returns empty array when no eligible holidays', () => {
    const result = computeBridges(2026, new Map(), {});
    expect(result).toEqual([]);
  });
});
