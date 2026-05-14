import type { BundeslandCode, HolidayStatus } from '../lib/holidays/types';
import { BundeslandSelect } from './BundeslandSelect';
import { StatusBadge } from './StatusBadge';

interface MastheadProps {
  year: number;
  setYear: (y: number) => void;
  state: BundeslandCode;
  setState: (s: BundeslandCode) => void;
  quota: number;
  setQuota: (q: number) => void;
  remaining: number;
  status: HolidayStatus;
  fetchedAt?: number;
  error?: Error;
  onRefresh: () => void;
}

const numberFormat = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });

export function Masthead(props: MastheadProps) {
  const { year, setYear, state, setState, quota, setQuota, remaining, status, fetchedAt, error, onRefresh } = props;
  return (
    <header className="masthead">
      <div className="title-row">
        <h1 className="title">Urlaubs<em>planer</em></h1>
        <StatusBadge status={status} fetchedAt={fetchedAt} error={error} onRefresh={onRefresh} />
      </div>

      <div className="strip">
        <div className="cell">
          <div className="label">Jahr</div>
          <div className="year-stepper">
            <button type="button" onClick={() => setYear(year - 1)} aria-label="Jahr zurück">←</button>
            <span className="num">{year}</span>
            <button type="button" onClick={() => setYear(year + 1)} aria-label="Jahr vor">→</button>
          </div>
        </div>

        <div className="cell indent">
          <div className="label">Bundesland</div>
          <BundeslandSelect value={state} onChange={setState} />
        </div>

        <div className="cell indent">
          <div className="label">Urlaubsanspruch · Tage</div>
          <input
            className="inline num"
            type="number"
            min={0}
            max={365}
            value={quota}
            onChange={(e) => setQuota(Math.max(0, Math.min(365, Number(e.target.value) || 0)))}
          />
        </div>

        <div className="cell indent">
          <div className="label">Resturlaub</div>
          <div className="value mono" style={{ color: remaining === 0 ? 'var(--rot)' : 'var(--gold)' }}>
            {numberFormat.format(remaining)}
            <span style={{ fontSize: 14, color: 'var(--ink-3)', marginLeft: 8 }}>
              von {numberFormat.format(quota)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
