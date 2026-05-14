const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

const numberFormat = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });

interface StatsProps {
  used: number;
  quota: number;
  remaining: number;
  over: number;
  monthUsed: number[];
  holidayCount: number;
}

export function Stats({ used, quota, remaining, over, monthUsed, holidayCount }: StatsProps) {
  const pct = quota > 0 ? Math.min(100, (used / quota) * 100) : 0;
  const peakMonth = monthUsed.reduce(
    (acc, n, i) => (n > acc.n ? { n, i } : acc),
    { n: 0, i: -1 }
  );

  return (
    <section className="stats">
      <div className="cell">
        <div className="lbl">Bilanz</div>
        <div className="lede">
          Von <strong>{numberFormat.format(quota)}</strong> Urlaubstagen sind{' '}
          <strong style={{ color: 'var(--gold)' }}>{numberFormat.format(used)}</strong> verplant.{' '}
          {over > 0 ? (
            <span style={{ color: 'var(--rot)' }}>
              Du liegst {numberFormat.format(over)} {over === 1 ? 'Tag' : 'Tage'} über dem Anspruch.
            </span>
          ) : remaining === 0 ? (
            <>Das Jahr ist exakt eingeteilt.</>
          ) : (
            <>Es bleiben <strong>{numberFormat.format(remaining)}</strong> {remaining === 1 ? 'Tag' : 'Tage'} zu planen.</>
          )}
        </div>
        <div className="bar">
          <div
            className="fill"
            style={{ width: `${pct}%`, background: over > 0 ? 'var(--rot)' : 'var(--gold-fill)' }}
          />
        </div>
      </div>
      <div className="cell">
        <div className="lbl">Verplant</div>
        <div className="big gold">{numberFormat.format(used)}</div>
        <div className="sub">Tage</div>
      </div>
      <div className="cell">
        <div className="lbl">Resturlaub</div>
        <div className={'big ' + (over > 0 ? 'rot' : '')}>
          {over > 0 ? `−${numberFormat.format(over)}` : numberFormat.format(remaining)}
        </div>
        <div className="sub">{over > 0 ? 'über Anspruch' : 'Tage übrig'}</div>
      </div>
      <div className="cell">
        <div className="lbl">Spitzenmonat</div>
        <div className="big">
          {peakMonth.i >= 0 && peakMonth.n > 0 ? numberFormat.format(peakMonth.n) : '—'}
        </div>
        <div className="sub">
          {peakMonth.i >= 0 && peakMonth.n > 0 ? MONTH_NAMES[peakMonth.i] : 'noch nichts geplant'}
        </div>
      </div>
      <div className="cell">
        <div className="lbl">Feiertage</div>
        <div className="big rot">{String(holidayCount).padStart(2, '0')}</div>
        <div className="sub">in deinem Bundesland</div>
      </div>
    </section>
  );
}
