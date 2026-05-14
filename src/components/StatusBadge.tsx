import type { HolidayStatus } from '../lib/holidays/types';

interface StatusBadgeProps {
  status: HolidayStatus;
  fetchedAt?: number;
  error?: Error;
  onRefresh: () => void;
}

const LABELS: Record<HolidayStatus, string> = {
  loading: 'lädt …',
  fresh: 'live',
  cached: 'cache',
  fallback: 'offline',
  error: 'fehler',
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function StatusBadge({ status, fetchedAt, error, onRefresh }: StatusBadgeProps) {
  let tooltip = '';
  switch (status) {
    case 'loading':
      tooltip = 'Feiertage werden geladen';
      break;
    case 'fresh':
      tooltip = 'Feiertage von heute geladen';
      break;
    case 'cached':
      tooltip = fetchedAt
        ? `Feiertage aus Cache — zuletzt am ${formatDate(fetchedAt)}`
        : 'Feiertage aus Cache';
      break;
    case 'fallback':
      tooltip = 'Feiertage berechnet (API nicht erreichbar)';
      break;
    case 'error':
      tooltip = error?.message ?? 'Unbekannter Fehler';
      break;
  }

  return (
    <button
      type="button"
      className="status-badge"
      onClick={onRefresh}
      title={tooltip}
      aria-label={tooltip}
    >
      <span className={`dot ${status}`} />
      <span>{LABELS[status]}</span>
    </button>
  );
}
