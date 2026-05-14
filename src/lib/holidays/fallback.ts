import { addDays, isoOf } from '../dates';
import type { BundeslandCode, HolidayMap } from './types';

// Anonymous Gregorian (Meeus) algorithm
function easterSunday(y: number): Date {
  const a = y % 19;
  const b = Math.floor(y / 100);
  const c = y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const L = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * L) / 451);
  const month = Math.floor((h + L - 7 * m + 114) / 31);
  const day = ((h + L - 7 * m + 114) % 31) + 1;
  return new Date(y, month - 1, day);
}

// Buß- und Bettag = Wednesday before Nov 23
function bussUndBettag(y: number): Date {
  const ref = new Date(y, 10, 23);
  const dow = ref.getDay();
  const diff = ((dow - 3 + 7) % 7) || 7;
  return addDays(ref, -diff);
}

function key(d: Date): string {
  return isoOf(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Local fallback. Covers the standard public holidays per Bundesland.
 * Does NOT cover municipal exceptions (e.g. Augsburger Friedensfest in Augsburg,
 * Mariä Himmelfahrt in BY-Gemeinden).
 */
export function fallbackHolidays(year: number, state: BundeslandCode): HolidayMap {
  const easter = easterSunday(year);
  const map: HolidayMap = new Map();
  const add = (d: Date, name: string) => map.set(key(d), name);

  add(new Date(year, 0, 1), 'Neujahr');
  add(addDays(easter, -2), 'Karfreitag');
  add(addDays(easter, 1), 'Ostermontag');
  add(new Date(year, 4, 1), 'Tag der Arbeit');
  add(addDays(easter, 39), 'Christi Himmelfahrt');
  add(addDays(easter, 50), 'Pfingstmontag');
  add(new Date(year, 9, 3), 'Tag der Deutschen Einheit');
  add(new Date(year, 11, 25), '1. Weihnachtstag');
  add(new Date(year, 11, 26), '2. Weihnachtstag');

  if (['BW', 'BY', 'ST'].includes(state)) {
    add(new Date(year, 0, 6), 'Heilige Drei Könige');
  }

  if (state === 'BE' && year >= 2019) {
    add(new Date(year, 2, 8), 'Internationaler Frauentag');
  }
  if (state === 'MV' && year >= 2023) {
    add(new Date(year, 2, 8), 'Internationaler Frauentag');
  }

  if (['BW', 'BY', 'HE', 'NW', 'RP', 'SL'].includes(state)) {
    add(addDays(easter, 60), 'Fronleichnam');
  }

  if (state === 'SL') {
    add(new Date(year, 7, 15), 'Mariä Himmelfahrt');
  }

  if (state === 'TH' && year >= 2019) {
    add(new Date(year, 8, 20), 'Weltkindertag');
  }

  if (
    ['BB', 'MV', 'SN', 'ST', 'TH'].includes(state) ||
    (['HB', 'HH', 'NI', 'SH'].includes(state) && year >= 2018) ||
    // 2017 was a federal one-off public holiday for the 500th anniversary of the Reformation
    year === 2017
  ) {
    add(new Date(year, 9, 31), 'Reformationstag');
  }

  if (['BW', 'BY', 'NW', 'RP', 'SL'].includes(state)) {
    add(new Date(year, 10, 1), 'Allerheiligen');
  }

  if (state === 'SN') {
    add(bussUndBettag(year), 'Buß- und Bettag');
  }

  return map;
}
