import { describe, it, expect } from 'vitest';
import { fallbackHolidays } from '../src/lib/holidays/fallback';

describe('fallbackHolidays', () => {
  it('includes nationwide holidays for any state', () => {
    const m = fallbackHolidays(2026, 'NW');
    expect(m.get('2026-01-01')).toBe('Neujahr');
    expect(m.get('2026-05-01')).toBe('Tag der Arbeit');
    expect(m.get('2026-10-03')).toBe('Tag der Deutschen Einheit');
    expect(m.get('2026-12-25')).toBe('1. Weihnachtstag');
    expect(m.get('2026-12-26')).toBe('2. Weihnachtstag');
  });

  it('computes Easter-derived holidays correctly for 2026', () => {
    // Easter 2026 = 2026-04-05
    const m = fallbackHolidays(2026, 'NW');
    expect(m.get('2026-04-03')).toBe('Karfreitag');
    expect(m.get('2026-04-06')).toBe('Ostermontag');
    expect(m.get('2026-05-14')).toBe('Christi Himmelfahrt'); // Easter + 39
    expect(m.get('2026-05-25')).toBe('Pfingstmontag'); // Easter + 50
  });

  it('adds Heilige Drei Könige only for BW, BY, ST', () => {
    expect(fallbackHolidays(2026, 'BY').get('2026-01-06')).toBe('Heilige Drei Könige');
    expect(fallbackHolidays(2026, 'BW').get('2026-01-06')).toBe('Heilige Drei Könige');
    expect(fallbackHolidays(2026, 'ST').get('2026-01-06')).toBe('Heilige Drei Könige');
    expect(fallbackHolidays(2026, 'NW').get('2026-01-06')).toBeUndefined();
  });

  it('adds Fronleichnam for BW, BY, HE, NW, RP, SL', () => {
    // Easter 2026 + 60 = 2026-06-04
    expect(fallbackHolidays(2026, 'NW').get('2026-06-04')).toBe('Fronleichnam');
    expect(fallbackHolidays(2026, 'BE').get('2026-06-04')).toBeUndefined();
  });

  it('adds Reformationstag for north and east, plus historical rules', () => {
    expect(fallbackHolidays(2026, 'SN').get('2026-10-31')).toBe('Reformationstag');
    expect(fallbackHolidays(2026, 'NI').get('2026-10-31')).toBe('Reformationstag');
    expect(fallbackHolidays(2026, 'BY').get('2026-10-31')).toBeUndefined();
    expect(fallbackHolidays(2017, 'NI').get('2017-10-31')).toBe('Reformationstag');
    expect(fallbackHolidays(2017, 'HB').get('2017-10-31')).toBe('Reformationstag');
  });

  it('computes Buß- und Bettag for SN', () => {
    // Wed before Nov 23, 2026 = 2026-11-18
    expect(fallbackHolidays(2026, 'SN').get('2026-11-18')).toBe('Buß- und Bettag');
    expect(fallbackHolidays(2026, 'NW').get('2026-11-18')).toBeUndefined();
  });

  it('adds Internationaler Frauentag for BE from 2019 and MV from 2023', () => {
    expect(fallbackHolidays(2018, 'BE').get('2018-03-08')).toBeUndefined();
    expect(fallbackHolidays(2019, 'BE').get('2019-03-08')).toBe('Internationaler Frauentag');
    expect(fallbackHolidays(2022, 'MV').get('2022-03-08')).toBeUndefined();
    expect(fallbackHolidays(2023, 'MV').get('2023-03-08')).toBe('Internationaler Frauentag');
  });
});
