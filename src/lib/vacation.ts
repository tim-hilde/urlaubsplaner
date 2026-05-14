export type VacationValue = 'full' | 'half';
export type VacationMap = Record<string, VacationValue>;
export type VacationByYear = Record<string, VacationMap>;

export function normalizeVacationByYear(raw: unknown): VacationByYear {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: VacationByYear = {};
  for (const [year, days] of Object.entries(raw as Record<string, unknown>)) {
    if (!days || typeof days !== 'object' || Array.isArray(days)) continue;
    const inner: VacationMap = {};
    for (const [iso, value] of Object.entries(days as Record<string, unknown>)) {
      if (value === true || value === 'full') inner[iso] = 'full';
      else if (value === 'half') inner[iso] = 'half';
    }
    out[year] = inner;
  }
  return out;
}

export function countVacation(map: VacationMap): number {
  let total = 0;
  for (const v of Object.values(map)) {
    total += v === 'half' ? 0.5 : 1;
  }
  return total;
}

export function countVacationPerMonth(map: VacationMap, year: number): number[] {
  const result = new Array(12).fill(0) as number[];
  const prefix = `${year}-`;
  for (const [iso, value] of Object.entries(map)) {
    if (!iso.startsWith(prefix)) continue;
    const month = Number(iso.slice(5, 7)) - 1;
    if (month < 0 || month > 11) continue;
    result[month] += value === 'half' ? 0.5 : 1;
  }
  return result;
}

export function cycleVacation(current: VacationValue | undefined): VacationValue | undefined {
  if (current === undefined) return 'full';
  if (current === 'full') return 'half';
  return undefined;
}
