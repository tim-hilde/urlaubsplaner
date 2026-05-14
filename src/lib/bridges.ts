import { addDays, dowMonFirst, isoOf } from './dates';
import type { HolidayMap } from './holidays/types';
import type { VacationMap } from './vacation';

export interface Bridge {
  id: string;
  holidayName: string;
  bridgeDays: string[];
  gain: number;
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
  const sorted = bridgeDates.slice().sort((a, b) => a.getTime() - b.getTime());

  // Count off-days stretching left from bridgeStart (not including bridge itself)
  let leftStretch = 0;
  let cursor = addDays(sorted[0], -1);
  while (isOff(cursor, holidayMap)) {
    leftStretch++;
    cursor = addDays(cursor, -1);
  }

  // Count off-days stretching right from bridgeEnd (not including bridge itself)
  let rightStretch = 0;
  cursor = addDays(sorted[sorted.length - 1], 1);
  while (isOff(cursor, holidayMap)) {
    rightStretch++;
    cursor = addDays(cursor, 1);
  }

  const withBridgeOff = leftStretch + bridgeDates.length + rightStretch;
  const naturalOff = Math.max(leftStretch, rightStretch);
  const gain = withBridgeOff - naturalOff;

  const label =
    bridgeDates.length === 1
      ? fmt(bridgeDates[0])
      : `${fmt(sorted[0])}–${fmt(sorted[sorted.length - 1])}`;

  return {
    id: `${holiday.iso}-${bridgeISOs.join('|')}`,
    holidayName: holiday.name,
    bridgeDays: bridgeISOs,
    gain,
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

  // Only show bridges where gain is meaningful (≥ 2: bridge days + at least one extra day off)
  const meaningful = results.filter((b) => b.gain >= 2);

  meaningful.sort((a, b) => {
    // Primary: leverage (gain per bridge day) descending
    const la = a.gain / a.bridgeDays.length;
    const lb = b.gain / b.bridgeDays.length;
    if (lb !== la) return lb - la;
    // Secondary: absolute gain descending
    if (b.gain !== a.gain) return b.gain - a.gain;
    // Tertiary: date ascending
    return a.bridgeDays[0].localeCompare(b.bridgeDays[0]);
  });

  return meaningful;
}
