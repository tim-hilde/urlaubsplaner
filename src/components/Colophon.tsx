import type { BundeslandCode, HolidayStatus } from '../lib/holidays/types';

interface ColophonProps {
  year: number;
  state: BundeslandCode;
  status: HolidayStatus;
}

export function Colophon({ year, state, status }: ColophonProps) {
  const source = status === 'fallback' ? 'lokal berechnet' : 'feiertage-api.de';
  return (
    <div className="colophon">
      <span>§ Daten lokal · Feiertage: {source}</span>
      <span>Urlaubsplaner · {year} · {state}</span>
    </div>
  );
}
