import type { Bridge } from '../lib/bridges';
import type { VacationMap } from '../lib/vacation';

interface BridgesProps {
  bridges: Bridge[];
  vac: VacationMap;
  onApply: (isos: string[], applied: boolean) => void;
}

export function Bridges({ bridges, vac, onApply }: BridgesProps) {
  if (!bridges.length) return null;
  return (
    <section className="bridges">
      <div className="bridges-title">Brückentage — empfohlen</div>
      <div className="bridges-list">
        {bridges.slice(0, 8).map((b) => {
          const applied = b.bridgeDays.every((iso) => vac[iso]);
          return (
            <div
              key={b.id}
              className={'bridge' + (applied ? ' applied' : '')}
              onClick={() => onApply(b.bridgeDays, applied)}
              title={applied ? 'Bereits eingetragen — Klick zum Entfernen' : 'Klick zum Eintragen'}
            >
              <span className="b-date">{b.label}</span>
              <span className="b-name">{b.holidayName}</span>
              <span className="b-ratio">
                {b.bridgeDays.length} Tag{b.bridgeDays.length > 1 ? 'e' : ''} → +{b.gain} frei
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
