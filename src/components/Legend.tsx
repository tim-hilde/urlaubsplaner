interface LegendProps {
  onReset: () => void;
  onRefreshHolidays: () => void;
}

export function Legend({ onReset, onRefreshHolidays }: LegendProps) {
  return (
    <div className="legend">
      <span><span className="swatch sw-urlaub" />Urlaub</span>
      <span><span className="swatch sw-hol" />Feiertag</span>
      <span><span className="swatch sw-we" />Wochenende</span>
      <span><span className="swatch sw-today" />Heute</span>
      <div className="actions">
        <button type="button" onClick={onRefreshHolidays}>Feiertage neu laden</button>
        <button type="button" onClick={onReset}>Jahr zurücksetzen</button>
        <button type="button" onClick={() => window.print()}>Drucken</button>
      </div>
    </div>
  );
}
