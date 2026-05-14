import { isoOf, dowMonFirst, todayISO } from '../lib/dates';
import type { HolidayMap } from '../lib/holidays/types';
import type { VacationMap } from '../lib/vacation';

interface MonthProps {
  year: number;
  monthIndex: number;
  name: string;
  holidayMap: HolidayMap;
  vac: VacationMap;
  onToggle: (iso: string) => void;
  urlaubCount: number;
}

const DOW = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const numberFormat = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });

type Cell =
  | { empty: true; key: string }
  | {
      empty: false;
      key: string;
      day: number;
      iso: string;
      weekend: boolean;
      holiday: string | null;
      urlaub: 'full' | 'half' | null;
      today: boolean;
    };

export function Month({ year, monthIndex, name, holidayMap, vac, onToggle, urlaubCount }: MonthProps) {
  const first = new Date(year, monthIndex, 1);
  const lead = dowMonFirst(first);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: Cell[] = [];

  for (let i = 0; i < lead; i++) cells.push({ empty: true, key: `e${i}` });
  const today = todayISO();
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = isoOf(year, monthIndex, d);
    const dt = new Date(year, monthIndex, d);
    const dow = dowMonFirst(dt);
    cells.push({
      empty: false,
      key: iso,
      day: d,
      iso,
      weekend: dow >= 5,
      holiday: holidayMap.get(iso) ?? null,
      urlaub: vac[iso] ?? null,
      today: iso === today,
    });
  }
  while (cells.length % 7 !== 0) cells.push({ empty: true, key: `t${cells.length}` });

  return (
    <div className="month">
      <div className="month-head">
        <div className="month-name">
          {name}<span className="num">{String(monthIndex + 1).padStart(2, '0')}</span>
        </div>
        <div className="month-stats">
          {urlaubCount > 0 ? (
            <><span className="urlaub-count">{numberFormat.format(urlaubCount)}</span> Urlaub</>
          ) : (
            <span style={{ opacity: 0.5 }}>—</span>
          )}
        </div>
      </div>

      <div className="dow-row">
        {DOW.map((d, i) => (
          <div key={d} className={'dow' + (i >= 5 ? ' we' : '')}>{d}</div>
        ))}
      </div>

      <div className="day-grid">
        {cells.map((c) => {
          if (c.empty) return <div key={c.key} className="day empty" />;
          const classes = [
            'day',
            c.weekend ? 'weekend' : '',
            c.holiday ? 'holiday' : '',
            c.urlaub ? `urlaub ${c.urlaub}` : '',
            c.today ? 'today' : '',
          ].filter(Boolean).join(' ');

          const title = c.holiday
            ? `${c.iso} — ${c.holiday}`
            : c.weekend
            ? `${c.iso} — Wochenende`
            : c.urlaub === 'full'
            ? `${c.iso} — Urlaub (ganzer Tag, klicken für halben Tag)`
            : c.urlaub === 'half'
            ? `${c.iso} — Urlaub (halber Tag, klicken zum Entfernen)`
            : `${c.iso} — Klicken für Urlaub`;

          return (
            <div
              key={c.key}
              className={classes}
              title={title}
              onClick={() => {
                if (c.holiday || c.weekend) return;
                onToggle(c.iso);
              }}
            >
              {c.day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
