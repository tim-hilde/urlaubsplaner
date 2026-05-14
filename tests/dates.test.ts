import { describe, it, expect } from 'vitest';
import { isoOf, dowMonFirst, addDays, todayISO } from '../src/lib/dates';

describe('isoOf', () => {
  it('pads month and day to two digits', () => {
    expect(isoOf(2026, 0, 1)).toBe('2026-01-01');
    expect(isoOf(2026, 11, 31)).toBe('2026-12-31');
    expect(isoOf(2026, 4, 9)).toBe('2026-05-09');
  });
});

describe('dowMonFirst', () => {
  it('returns Monday=0..Sunday=6', () => {
    expect(dowMonFirst(new Date(2026, 0, 5))).toBe(0); // Mon 2026-01-05
    expect(dowMonFirst(new Date(2026, 0, 11))).toBe(6); // Sun 2026-01-11
    expect(dowMonFirst(new Date(2026, 0, 10))).toBe(5); // Sat 2026-01-10
  });
});

describe('addDays', () => {
  it('adds positive and negative offsets', () => {
    const d = new Date(2026, 0, 1);
    expect(addDays(d, 5).getDate()).toBe(6);
    expect(addDays(d, -1).getDate()).toBe(31);
    expect(addDays(d, -1).getMonth()).toBe(11);
    expect(addDays(d, -1).getFullYear()).toBe(2025);
  });

  it('does not mutate input', () => {
    const d = new Date(2026, 0, 1);
    addDays(d, 5);
    expect(d.getDate()).toBe(1);
  });
});

describe('todayISO', () => {
  it('returns YYYY-MM-DD string', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
