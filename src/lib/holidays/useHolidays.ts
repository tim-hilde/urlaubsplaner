import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchFromFeiertageApi } from './api';
import { readHolidayCache, writeHolidayCache } from './cache';
import { fallbackHolidays } from './fallback';
import type {
  BundeslandCode,
  HolidayMap,
  HolidayStatus,
  HolidaysResult,
} from './types';

interface State {
  data: HolidayMap;
  status: HolidayStatus;
  error?: Error;
  fetchedAt?: number;
}

export function useHolidays(year: number, state: BundeslandCode): HolidaysResult & { fetchedAt?: number } {
  const [s, setS] = useState<State>(() => initState(year, state));
  const refreshTokenRef = useRef(0);

  useEffect(() => {
    setS(initState(year, state));
  }, [year, state]);

  useEffect(() => {
    const controller = new AbortController();
    const token = ++refreshTokenRef.current;

    fetchFromFeiertageApi(year, state, controller.signal)
      .then((apiData) => {
        if (token !== refreshTokenRef.current) return;
        writeHolidayCache(year, state, apiData);
        setS({ data: apiData, status: 'fresh', fetchedAt: Date.now() });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (token !== refreshTokenRef.current) return;
        setS((prev) => {
          if (prev.status === 'cached') {
            return { ...prev, error: err instanceof Error ? err : new Error(String(err)) };
          }
          return {
            data: fallbackHolidays(year, state),
            status: 'fallback',
            error: err instanceof Error ? err : new Error(String(err)),
          };
        });
      });

    return () => controller.abort();
  }, [year, state]);

  const refresh = useCallback(() => {
    const controller = new AbortController();
    const token = ++refreshTokenRef.current;
    setS((prev) => ({ ...prev, status: 'loading' }));
    fetchFromFeiertageApi(year, state, controller.signal)
      .then((apiData) => {
        if (token !== refreshTokenRef.current) return;
        writeHolidayCache(year, state, apiData);
        setS({ data: apiData, status: 'fresh', fetchedAt: Date.now() });
      })
      .catch((err: unknown) => {
        if (token !== refreshTokenRef.current) return;
        setS((prev) => ({
          ...prev,
          status: prev.data.size > 0 ? prev.status : 'fallback',
          error: err instanceof Error ? err : new Error(String(err)),
        }));
      });
  }, [year, state]);

  return { data: s.data, status: s.status, error: s.error, fetchedAt: s.fetchedAt, refresh };
}

function initState(year: number, state: BundeslandCode): State {
  const cached = readHolidayCache(year, state);
  if (cached) {
    return { data: cached.data, status: 'cached', fetchedAt: cached.fetchedAt };
  }
  return { data: fallbackHolidays(year, state), status: 'loading' };
}
