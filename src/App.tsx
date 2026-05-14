import { useCallback, useEffect, useMemo, useState } from 'react';
import { Masthead } from './components/Masthead';
import { Month } from './components/Month';
import { Bridges } from './components/Bridges';
import { Legend } from './components/Legend';
import { useHolidays } from './lib/holidays/useHolidays';
import { computeBridges } from './lib/bridges';
import { dowMonFirst } from './lib/dates';
import {
  countVacation,
  countVacationPerMonth,
  cycleVacation,
  normalizeVacationByYear,
} from './lib/vacation';
import type { VacationByYear, VacationValue } from './lib/vacation';
import type { BundeslandCode } from './lib/holidays/types';
import { loadJSON, saveJSON } from './lib/storage';

const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

export function App() {
  const [year, setYear] = useState<number>(() => loadJSON('year', new Date().getFullYear()));
  const [state, setState] = useState<BundeslandCode>(() => loadJSON('state', 'BY' as BundeslandCode));
  const [quota, setQuota] = useState<number>(() => loadJSON('quota', 30));
  const [vacByYear, setVacByYear] = useState<VacationByYear>(() =>
    normalizeVacationByYear(loadJSON<unknown>('vacByYear', {}))
  );

  useEffect(() => saveJSON('year', year), [year]);
  useEffect(() => saveJSON('state', state), [state]);
  useEffect(() => saveJSON('quota', quota), [quota]);
  useEffect(() => saveJSON('vacByYear', vacByYear), [vacByYear]);

  const { data: holidayMap, status, error, fetchedAt, refresh } = useHolidays(year, state);

  const yearKey = String(year);
  const vac = vacByYear[yearKey] ?? {};

  // Cleanup: drop entries that are now weekends/holidays for the active year.
  useEffect(() => {
    setVacByYear((prev) => {
      const current = prev[yearKey];
      if (!current) return prev;
      let changed = false;
      const cleaned: typeof current = {};
      for (const [iso, value] of Object.entries(current)) {
        const [y, m, d] = iso.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        const isWE = dowMonFirst(dt) >= 5;
        if (isWE || holidayMap.has(iso)) {
          changed = true;
          continue;
        }
        cleaned[iso] = value;
      }
      if (!changed) return prev;
      return { ...prev, [yearKey]: cleaned };
    });
  }, [holidayMap, yearKey]);

  const toggleDay = useCallback((iso: string) => {
    setVacByYear((prev) => {
      const cur = { ...(prev[yearKey] ?? {}) };
      const next = cycleVacation(cur[iso]);
      if (next === undefined) delete cur[iso];
      else cur[iso] = next;
      return { ...prev, [yearKey]: cur };
    });
  }, [yearKey]);

  const applyBridge = useCallback((isos: string[], applied: boolean) => {
    setVacByYear((prev) => {
      const cur = { ...(prev[yearKey] ?? {}) };
      if (applied) {
        for (const iso of isos) delete cur[iso];
      } else {
        for (const iso of isos) {
          if (!cur[iso]) cur[iso] = 'full' as VacationValue;
        }
      }
      return { ...prev, [yearKey]: cur };
    });
  }, [yearKey]);

  const resetYear = useCallback(() => {
    if (!confirm(`Urlaubstage für ${year} löschen?`)) return;
    setVacByYear((prev) => {
      const next = { ...prev };
      delete next[yearKey];
      return next;
    });
  }, [year, yearKey]);

  const used = useMemo(() => countVacation(vac), [vac]);
  const remaining = Math.max(0, quota - used);
  const over = Math.max(0, used - quota);
  const monthUsed = useMemo(() => countVacationPerMonth(vac, year), [vac, year]);
  const bridges = useMemo(() => computeBridges(year, holidayMap, vac), [year, holidayMap, vac]);

  return (
    <div className="page">
      <Masthead
        year={year}
        setYear={setYear}
        state={state}
        setState={setState}
        quota={quota}
        setQuota={setQuota}
        remaining={remaining}
        over={over}
        status={status}
        fetchedAt={fetchedAt}
        error={error}
        onRefresh={refresh}
      />

      <Legend onReset={resetYear} onRefreshHolidays={refresh} />

      <div className="grid-section-title">Jahr · {year}</div>

      <div className="year-grid">
        {MONTH_NAMES.map((name, mi) => (
          <Month
            key={mi}
            year={year}
            monthIndex={mi}
            name={name}
            holidayMap={holidayMap}
            vac={vac}
            onToggle={toggleDay}
            urlaubCount={monthUsed[mi]}
          />
        ))}
      </div>

      <Bridges bridges={bridges} vac={vac} onApply={applyBridge} />
    </div>
  );
}
