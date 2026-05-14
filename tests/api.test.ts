import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchFromFeiertageApi, parseFeiertageApiResponse } from '../src/lib/holidays/api';

describe('parseFeiertageApiResponse', () => {
  it('builds a Map<ISO, name> from happy-path response', () => {
    const raw = {
      Neujahrstag: { datum: '2026-01-01', hinweis: '' },
      Karfreitag: { datum: '2026-04-03', hinweis: '' },
    };
    const m = parseFeiertageApiResponse(raw);
    expect(m.size).toBe(2);
    expect(m.get('2026-01-01')).toBe('Neujahrstag');
    expect(m.get('2026-04-03')).toBe('Karfreitag');
  });

  it('skips entries without valid date string', () => {
    const raw = {
      Neujahrstag: { datum: '2026-01-01', hinweis: '' },
      Broken: { hinweis: 'no datum' },
      AlsoBroken: { datum: 12345 as unknown as string },
    };
    const m = parseFeiertageApiResponse(raw);
    expect(m.size).toBe(1);
    expect(m.get('2026-01-01')).toBe('Neujahrstag');
  });

  it('throws when input is not an object', () => {
    expect(() => parseFeiertageApiResponse(null)).toThrow();
    expect(() => parseFeiertageApiResponse('foo')).toThrow();
    expect(() => parseFeiertageApiResponse([])).toThrow();
  });
});

describe('fetchFromFeiertageApi', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls the correct URL', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ Neujahrstag: { datum: '2026-01-01', hinweis: '' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );
    await fetchFromFeiertageApi(2026, 'BY');
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://feiertage-api.de/api/?jahr=2026&nur_land=BY',
      expect.anything()
    );
  });

  it('throws on HTTP error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status: 500 }));
    await expect(fetchFromFeiertageApi(2026, 'BY')).rejects.toThrow();
  });

  it('throws on network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('network'));
    await expect(fetchFromFeiertageApi(2026, 'BY')).rejects.toThrow();
  });
});
