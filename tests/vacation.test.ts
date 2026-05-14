import { describe, it, expect } from 'vitest';
import {
  normalizeVacationByYear,
  countVacation,
  countVacationPerMonth,
  cycleVacation,
} from '../src/lib/vacation';

describe('normalizeVacationByYear', () => {
  it('migrates legacy true → full', () => {
    const raw = { '2026': { '2026-01-02': true, '2026-01-03': 'half' } };
    expect(normalizeVacationByYear(raw)).toEqual({
      '2026': { '2026-01-02': 'full', '2026-01-03': 'half' },
    });
  });

  it('drops unknown values', () => {
    const raw = { '2026': { '2026-01-02': 'banana', '2026-01-03': 'full' } };
    expect(normalizeVacationByYear(raw)).toEqual({
      '2026': { '2026-01-03': 'full' },
    });
  });

  it('returns empty object for non-object input', () => {
    expect(normalizeVacationByYear(null)).toEqual({});
    expect(normalizeVacationByYear('foo')).toEqual({});
  });
});

describe('countVacation', () => {
  it('counts full as 1 and half as 0.5', () => {
    const map = { '2026-01-01': 'full', '2026-01-02': 'half', '2026-01-03': 'half' } as const;
    expect(countVacation(map)).toBe(2);
  });

  it('returns 0 for empty map', () => {
    expect(countVacation({})).toBe(0);
  });
});

describe('countVacationPerMonth', () => {
  it('sums per month index 0..11', () => {
    const map = {
      '2026-01-05': 'full',
      '2026-01-06': 'half',
      '2026-03-10': 'full',
    } as const;
    const result = countVacationPerMonth(map, 2026);
    expect(result[0]).toBe(1.5);
    expect(result[2]).toBe(1);
    expect(result[5]).toBe(0);
  });

  it('ignores entries from other years', () => {
    const map = { '2025-12-31': 'full', '2026-01-01': 'full' } as const;
    const result = countVacationPerMonth(map, 2026);
    expect(result[0]).toBe(1);
    expect(result.reduce((a, b) => a + b, 0)).toBe(1);
  });
});

describe('cycleVacation', () => {
  it('empty → full → half → empty', () => {
    expect(cycleVacation(undefined)).toBe('full');
    expect(cycleVacation('full')).toBe('half');
    expect(cycleVacation('half')).toBe(undefined);
  });
});
