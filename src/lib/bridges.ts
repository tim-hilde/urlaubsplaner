import { addDays, dowMonFirst, isoOf } from './dates';
import type { HolidayMap } from './holidays/types';
import type { VacationMap } from './vacation';

export interface Bridge {
  id: string;
  holidayName: string;
  bridgeDays: string[];
  totalOff: number;
  label: string;
}

interface HolidayEntry {
  iso: string;
  name: string;
  date: Date;
}

function fmt(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`;
}

function isOff(date: Date, holidayMap: HolidayMap): boolean {
  const iso = isoOf(date.getFullYear(), date.getMonth(), date.getDate());
  return dowMonFirst(date) >= 5 || holidayMap.has(iso);
}

function makeBridge(holiday: HolidayEntry, bridgeDates: Date[], holidayMap: HolidayMap): Bridge {
  const bridgeISOs = bridgeDates.map((d) => isoOf(d.getFullYear(), d.getMonth(), d.getDate()));
  const all = new Set(bridgeISOs);
  const offWithBridge = (date: Date): boolean => {
    const iso = isoOf(date.getFullYear(), date.getMonth(), date.getDate());
    return all.has(iso) || dowMonFirst(date) >= 5 || holidayMap.has(iso);
  };

  const sorted = bridgeDates.slice().sort((a, b) => a.getTime() - b.getTime());
  const minD = sorted[0];
  const maxD = sorted[sorted.length - 1];
  const start = new Date(Math.min(minD.getTime(), holiday.date.getTime()));
  const end = new Date(Math.max(maxD.getTime(), holiday.date.getTime()));

  let s = new Date(start);
  while (true) {
    const prev = addDays(s, -1);
    if (offWithBridge(prev)) s = prev;
    else break;
  }
  let e = new Date(end);
  while (true) {
    const nxt = addDays(e, 1);
    if (offWithBridge(nxt)) e = nxt;
    else break;
  }

  let count = 0;
  let cursor = new Date(s);
  while (cursor <= e) {
    if (offWithBridge(cursor)) count++;
    cursor = addDays(cursor, 1);
  }

  const label =
    bridgeDates.length === 1
      ? fmt(bridgeDates[0])
      : `${fmt(sorted[0])}–${fmt(sorted[sorted.length - 1])}`;

  return {
    id: `${holiday.iso}-${bridgeISOs.join('|')}`,
    holidayName: holiday.name,
    bridgeDays: bridgeISOs,
    totalOff: count,
    label,
  };
}

export function computeBridges(
  year: number,
  holidayMap: HolidayMap,
  _vac: VacationMap
): Bridge[] {
  const results: Bridge[] = [];
  const holDates: HolidayEntry[] = [];
  for (const [iso, name] of holidayMap) {
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() === year) {
      holDates.push({ iso, name, date });
    }
  }

  for (const h of holDates) {
    const dow = dowMonFirst(h.date);
    if (dow === 0) {
      // Monday holiday — suggest Tuesday bridge
      const tue = addDays(h.date, 1);
      if (!isOff(tue, holidayMap)) results.push(makeBridge(h, [tue], holidayMap));
    } else if (dow === 4) {
      // Friday holiday — suggest Thursday bridge
      const thu = addDays(h.date, -1);
      if (!isOff(thu, holidayMap)) results.push(makeBridge(h, [thu], holidayMap));
    } else if (dow === 1) {
      // Tuesday — bridge Monday
      const mon = addDays(h.date, -1);
      if (!isOff(mon, holidayMap)) results.push(makeBridge(h, [mon], holidayMap));
    } else if (dow === 3) {
      // Thursday — bridge Friday
      const fri = addDays(h.date, 1);
      if (!isOff(fri, holidayMap)) results.push(makeBridge(h, [fri], holidayMap));
    } else if (dow === 2) {
      // Wednesday — offer Mon+Tue or Thu+Fri
      const mon = addDays(h.date, -2);
      const tue = addDays(h.date, -1);
      const thu = addDays(h.date, 1);
      const fri = addDays(h.date, 2);
      if (!isOff(mon, holidayMap) && !isOff(tue, holidayMap)) {
        results.push(makeBridge(h, [mon, tue], holidayMap));
      }
      if (!isOff(thu, holidayMap) && !isOff(fri, holidayMap)) {
        results.push(makeBridge(h, [thu, fri], holidayMap));
      }
    }
  }

  results.sort((a, b) => {
    const ra = a.totalOff / a.bridgeDays.length;
    const rb = b.totalOff / b.bridgeDays.length;
    if (rb !== ra) return rb - ra;
    return a.bridgeDays[0].localeCompare(b.bridgeDays[0]);
  });
  return results;
}
