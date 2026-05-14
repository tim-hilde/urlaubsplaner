# Urlaubsplaner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a German vacation planner as a Vite + React + TypeScript single-page app, hostable on GitHub Pages, with API-backed holidays (feiertage-api.de) and a local Easter-based fallback.

**Architecture:** Components call a single `useHolidays(year, state)` hook that orchestrates cache → fetch → fallback. State (year, Bundesland, quota, vacation map) lives in `App.tsx` and is persisted to localStorage. Vacation entries are `'full' | 'half'` with a three-click cycle (empty → full → half → empty). Static build deploys via GitHub Actions to GitHub Pages under `/urlaubsplaner/`.

**Tech Stack:** Vite 5, React 18, TypeScript 5 (strict), Vitest, no CSS framework, no state library.

**Spec:** `docs/superpowers/specs/2026-05-14-urlaubsplaner-design.md`

---

## Task 1: Scaffold project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx` (placeholder)
- Create: `src/vite-env.d.ts`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "urlaubsplaner",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "jsdom": "^25.0.1",
    "typescript": "^5.6.3",
    "vite": "^5.4.10",
    "vitest": "^2.1.4"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals"]
  },
  "include": ["src", "tests"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: Create `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/urlaubsplaner/' : '/',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
}));
```

- [ ] **Step 5: Create `index.html`**

```html
<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Urlaubsplaner</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=JetBrains+Mono:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `src/vite-env.d.ts`**

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 7: Create `src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 8: Create `src/App.tsx` (placeholder, will be filled in later)**

```tsx
export function App() {
  return <div className="page">Urlaubsplaner</div>;
}
```

- [ ] **Step 9: Create `src/styles.css` (minimal placeholder, filled in Task 2)**

```css
body { margin: 0; font-family: system-ui; }
```

- [ ] **Step 10: Install dependencies**

Run: `npm install`
Expected: dependencies installed, no errors.

- [ ] **Step 11: Verify dev server starts**

Run: `npm run dev -- --port 5173 &` then `sleep 3 && curl -s http://localhost:5173/ | head -5 && kill %1`
Expected: HTML with "Urlaubsplaner" in title.

- [ ] **Step 12: Commit**

```bash
git add .
git commit -m "Scaffold Vite + React + TS project"
```

---

## Task 2: Port CSS from prototype

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Copy CSS rules from prototype**

Read `docs/handoff/urlaubsplaner/project/index.html`, extract the `<style>` block contents (CSS variables, body, masthead, strip, year-grid, month, day, stats, bridges, legend, colophon, media queries — all of it).

Write to `src/styles.css` as a verbatim port (no JSX, just CSS).

After the existing rules, append a new block for half-day vacations:

```css
.day.urlaub.half {
  background: linear-gradient(135deg, transparent 0%, transparent 50%, var(--gold-fill) 50%, var(--gold-fill) 100%);
  color: var(--ink);
}
.day.urlaub.half:hover {
  background: linear-gradient(135deg, transparent 0%, transparent 50%, #c89d44 50%, #c89d44 100%);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-3);
  cursor: pointer;
  background: transparent;
  border: none;
  padding: 0;
}
.status-badge .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.status-badge .dot.loading { background: var(--ink-3); animation: pulse 1.2s ease-in-out infinite; }
.status-badge .dot.fresh    { background: var(--gold-fill); }
.status-badge .dot.cached   { background: var(--gold); opacity: 0.6; }
.status-badge .dot.fallback { background: var(--rot); opacity: 0.4; }
.status-badge .dot.error    { background: var(--rot); }
.status-badge:hover { color: var(--ink); }
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
```

- [ ] **Step 2: Verify CSS loads in dev server**

Run: `npm run dev -- --port 5173 &` then `sleep 3 && curl -s http://localhost:5173/src/styles.css | head -20 && kill %1`
Expected: see `--paper:` variable declaration in output.

- [ ] **Step 3: Commit**

```bash
git add src/styles.css
git commit -m "Port newspaper-aesthetic CSS from prototype, add half-day and status-badge styles"
```

---

## Task 3: Date helpers (lib/dates.ts)

**Files:**
- Create: `src/lib/dates.ts`
- Create: `tests/dates.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/dates.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { isoOf, dowMonFirst, addDays, todayISO } from '../src/lib/dates';

describe('isoOf', () => {
  it('pads month and day to two digits', () => {
    expect(isoOf(2026, 0, 1)).toBe('2026-01-01');
    expect(isoOf(2026, 11, 31)).toBe('2026-12-31');
    expect(isoOf(2026, 4, 9)).toBe('2026-05-09');
  });
});

describe('dowMonFirst', () => {
  it('returns Monday=0..Sunday=6', () => {
    expect(dowMonFirst(new Date(2026, 0, 5))).toBe(0); // Mon 2026-01-05
    expect(dowMonFirst(new Date(2026, 0, 11))).toBe(6); // Sun 2026-01-11
    expect(dowMonFirst(new Date(2026, 0, 10))).toBe(5); // Sat 2026-01-10
  });
});

describe('addDays', () => {
  it('adds positive and negative offsets', () => {
    const d = new Date(2026, 0, 1);
    expect(addDays(d, 5).getDate()).toBe(6);
    expect(addDays(d, -1).getDate()).toBe(31);
    expect(addDays(d, -1).getMonth()).toBe(11);
    expect(addDays(d, -1).getFullYear()).toBe(2025);
  });

  it('does not mutate input', () => {
    const d = new Date(2026, 0, 1);
    addDays(d, 5);
    expect(d.getDate()).toBe(1);
  });
});

describe('todayISO', () => {
  it('returns YYYY-MM-DD string', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/dates.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement `src/lib/dates.ts`**

```ts
export function isoOf(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function dowMonFirst(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function addDays(date: Date, n: number): Date {
  const r = new Date(date);
  r.setDate(r.getDate() + n);
  return r;
}

export function todayISO(): string {
  const d = new Date();
  return isoOf(d.getFullYear(), d.getMonth(), d.getDate());
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- tests/dates.test.ts`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/dates.ts tests/dates.test.ts
git commit -m "Add date helpers with tests"
```

---

## Task 4: Bundesland list (lib/holidays/states.ts and types.ts)

**Files:**
- Create: `src/lib/holidays/types.ts`
- Create: `src/lib/holidays/states.ts`

- [ ] **Step 1: Create `src/lib/holidays/types.ts`**

```ts
export type BundeslandCode =
  | 'BW' | 'BY' | 'BE' | 'BB' | 'HB' | 'HH' | 'HE' | 'MV'
  | 'NI' | 'NW' | 'RP' | 'SL' | 'SN' | 'ST' | 'SH' | 'TH';

export type HolidayMap = Map<string, string>;

export type HolidayStatus = 'loading' | 'fresh' | 'cached' | 'fallback' | 'error';

export interface HolidaysResult {
  data: HolidayMap;
  status: HolidayStatus;
  error?: Error;
  refresh: () => void;
}

export interface CacheEntry {
  fetchedAt: number;
  source: 'feiertage-api.de';
  data: Record<string, string>;
}
```

- [ ] **Step 2: Create `src/lib/holidays/states.ts`**

```ts
import type { BundeslandCode } from './types';

export const BUNDESLAENDER: ReadonlyArray<readonly [BundeslandCode, string]> = [
  ['BW', 'Baden-Württemberg'],
  ['BY', 'Bayern'],
  ['BE', 'Berlin'],
  ['BB', 'Brandenburg'],
  ['HB', 'Bremen'],
  ['HH', 'Hamburg'],
  ['HE', 'Hessen'],
  ['MV', 'Mecklenburg-Vorpommern'],
  ['NI', 'Niedersachsen'],
  ['NW', 'Nordrhein-Westfalen'],
  ['RP', 'Rheinland-Pfalz'],
  ['SL', 'Saarland'],
  ['SN', 'Sachsen'],
  ['ST', 'Sachsen-Anhalt'],
  ['SH', 'Schleswig-Holstein'],
  ['TH', 'Thüringen'],
];

export function stateName(code: BundeslandCode): string {
  const entry = BUNDESLAENDER.find(([c]) => c === code);
  return entry ? entry[1] : code;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/holidays/types.ts src/lib/holidays/states.ts
git commit -m "Add Bundesland list and holiday types"
```

---

## Task 5: Fallback holiday calculation (lib/holidays/fallback.ts)

**Files:**
- Create: `src/lib/holidays/fallback.ts`
- Create: `tests/fallback.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/fallback.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { fallbackHolidays } from '../src/lib/holidays/fallback';

describe('fallbackHolidays', () => {
  it('includes nationwide holidays for any state', () => {
    const m = fallbackHolidays(2026, 'NW');
    expect(m.get('2026-01-01')).toBe('Neujahr');
    expect(m.get('2026-05-01')).toBe('Tag der Arbeit');
    expect(m.get('2026-10-03')).toBe('Tag der Deutschen Einheit');
    expect(m.get('2026-12-25')).toBe('1. Weihnachtstag');
    expect(m.get('2026-12-26')).toBe('2. Weihnachtstag');
  });

  it('computes Easter-derived holidays correctly for 2026', () => {
    // Easter 2026 = 2026-04-05
    const m = fallbackHolidays(2026, 'NW');
    expect(m.get('2026-04-03')).toBe('Karfreitag');
    expect(m.get('2026-04-06')).toBe('Ostermontag');
    expect(m.get('2026-05-14')).toBe('Christi Himmelfahrt'); // Easter + 39
    expect(m.get('2026-05-25')).toBe('Pfingstmontag'); // Easter + 50
  });

  it('adds Heilige Drei Könige only for BW, BY, ST', () => {
    expect(fallbackHolidays(2026, 'BY').get('2026-01-06')).toBe('Heilige Drei Könige');
    expect(fallbackHolidays(2026, 'BW').get('2026-01-06')).toBe('Heilige Drei Könige');
    expect(fallbackHolidays(2026, 'ST').get('2026-01-06')).toBe('Heilige Drei Könige');
    expect(fallbackHolidays(2026, 'NW').get('2026-01-06')).toBeUndefined();
  });

  it('adds Fronleichnam for BW, BY, HE, NW, RP, SL', () => {
    // Easter 2026 + 60 = 2026-06-04
    expect(fallbackHolidays(2026, 'NW').get('2026-06-04')).toBe('Fronleichnam');
    expect(fallbackHolidays(2026, 'BE').get('2026-06-04')).toBeUndefined();
  });

  it('adds Reformationstag for north and east, plus historical rules', () => {
    expect(fallbackHolidays(2026, 'SN').get('2026-10-31')).toBe('Reformationstag');
    expect(fallbackHolidays(2026, 'NI').get('2026-10-31')).toBe('Reformationstag');
    expect(fallbackHolidays(2026, 'BY').get('2026-10-31')).toBeUndefined();
    expect(fallbackHolidays(2017, 'NI').get('2017-10-31')).toBe('Reformationstag');
    expect(fallbackHolidays(2017, 'HB').get('2017-10-31')).toBe('Reformationstag');
  });

  it('computes Buß- und Bettag for SN', () => {
    // Wed before Nov 23, 2026 = 2026-11-18
    expect(fallbackHolidays(2026, 'SN').get('2026-11-18')).toBe('Buß- und Bettag');
    expect(fallbackHolidays(2026, 'NW').get('2026-11-18')).toBeUndefined();
  });

  it('adds Internationaler Frauentag for BE from 2019 and MV from 2023', () => {
    expect(fallbackHolidays(2018, 'BE').get('2018-03-08')).toBeUndefined();
    expect(fallbackHolidays(2019, 'BE').get('2019-03-08')).toBe('Internationaler Frauentag');
    expect(fallbackHolidays(2022, 'MV').get('2022-03-08')).toBeUndefined();
    expect(fallbackHolidays(2023, 'MV').get('2023-03-08')).toBe('Internationaler Frauentag');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/fallback.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement `src/lib/holidays/fallback.ts`**

```ts
import { addDays, isoOf } from '../dates';
import type { BundeslandCode, HolidayMap } from './types';

// Anonymous Gregorian (Meeus) algorithm
function easterSunday(y: number): Date {
  const a = y % 19;
  const b = Math.floor(y / 100);
  const c = y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const L = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * L) / 451);
  const month = Math.floor((h + L - 7 * m + 114) / 31);
  const day = ((h + L - 7 * m + 114) % 31) + 1;
  return new Date(y, month - 1, day);
}

// Buß- und Bettag = Wednesday before Nov 23
function bussUndBettag(y: number): Date {
  const ref = new Date(y, 10, 23);
  const dow = ref.getDay();
  const diff = ((dow - 3 + 7) % 7) || 7;
  return addDays(ref, -diff);
}

function key(d: Date): string {
  return isoOf(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Local fallback. Covers the standard public holidays per Bundesland.
 * Does NOT cover municipal exceptions (e.g. Augsburger Friedensfest in Augsburg,
 * Mariä Himmelfahrt in BY-Gemeinden).
 */
export function fallbackHolidays(year: number, state: BundeslandCode): HolidayMap {
  const easter = easterSunday(year);
  const map: HolidayMap = new Map();
  const add = (d: Date, name: string) => map.set(key(d), name);

  add(new Date(year, 0, 1), 'Neujahr');
  add(addDays(easter, -2), 'Karfreitag');
  add(addDays(easter, 1), 'Ostermontag');
  add(new Date(year, 4, 1), 'Tag der Arbeit');
  add(addDays(easter, 39), 'Christi Himmelfahrt');
  add(addDays(easter, 50), 'Pfingstmontag');
  add(new Date(year, 9, 3), 'Tag der Deutschen Einheit');
  add(new Date(year, 11, 25), '1. Weihnachtstag');
  add(new Date(year, 11, 26), '2. Weihnachtstag');

  if (['BW', 'BY', 'ST'].includes(state)) {
    add(new Date(year, 0, 6), 'Heilige Drei Könige');
  }

  if (state === 'BE' && year >= 2019) {
    add(new Date(year, 2, 8), 'Internationaler Frauentag');
  }
  if (state === 'MV' && year >= 2023) {
    add(new Date(year, 2, 8), 'Internationaler Frauentag');
  }

  if (['BW', 'BY', 'HE', 'NW', 'RP', 'SL'].includes(state)) {
    add(addDays(easter, 60), 'Fronleichnam');
  }

  if (state === 'SL') {
    add(new Date(year, 7, 15), 'Mariä Himmelfahrt');
  }

  if (state === 'TH' && year >= 2019) {
    add(new Date(year, 8, 20), 'Weltkindertag');
  }

  if (
    ['BB', 'MV', 'SN', 'ST', 'TH'].includes(state) ||
    (['HB', 'HH', 'NI', 'SH'].includes(state) && year >= 2018)
  ) {
    add(new Date(year, 9, 31), 'Reformationstag');
  }

  if (['BW', 'BY', 'NW', 'RP', 'SL'].includes(state)) {
    add(new Date(year, 10, 1), 'Allerheiligen');
  }

  if (state === 'SN') {
    add(bussUndBettag(year), 'Buß- und Bettag');
  }

  return map;
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- tests/fallback.test.ts`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/holidays/fallback.ts tests/fallback.test.ts
git commit -m "Add Easter-based fallback holiday calculation"
```

---

## Task 6: API client (lib/holidays/api.ts)

**Files:**
- Create: `src/lib/holidays/api.ts`
- Create: `tests/api.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/api.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/api.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement `src/lib/holidays/api.ts`**

```ts
import type { BundeslandCode, HolidayMap } from './types';

interface RawHoliday {
  datum?: unknown;
  hinweis?: unknown;
}

export function parseFeiertageApiResponse(raw: unknown): HolidayMap {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Unexpected response shape: expected object');
  }
  const result: HolidayMap = new Map();
  for (const [name, entry] of Object.entries(raw as Record<string, RawHoliday>)) {
    if (!entry || typeof entry !== 'object') continue;
    const datum = (entry as RawHoliday).datum;
    if (typeof datum !== 'string') continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) continue;
    result.set(datum, name);
  }
  return result;
}

export async function fetchFromFeiertageApi(
  year: number,
  state: BundeslandCode,
  signal?: AbortSignal
): Promise<HolidayMap> {
  const url = `https://feiertage-api.de/api/?jahr=${year}&nur_land=${state}`;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from feiertage-api.de`);
  }
  const json = await response.json();
  return parseFeiertageApiResponse(json);
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- tests/api.test.ts`
Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/holidays/api.ts tests/api.test.ts
git commit -m "Add feiertage-api.de client with parser"
```

---

## Task 7: Generic storage helpers (lib/storage.ts)

**Files:**
- Create: `src/lib/storage.ts`

- [ ] **Step 1: Implement `src/lib/storage.ts`**

```ts
const PREFIX = 'urlaubsplaner.v1.';

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // quota exceeded or storage disabled — ignore
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/storage.ts
git commit -m "Add typed localStorage helpers"
```

---

## Task 8: Cache layer (lib/holidays/cache.ts)

**Files:**
- Create: `src/lib/holidays/cache.ts`
- Create: `tests/cache.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/cache.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { readHolidayCache, writeHolidayCache, holidayCacheKey } from '../src/lib/holidays/cache';

beforeEach(() => {
  localStorage.clear();
});

describe('holidayCacheKey', () => {
  it('combines year and state', () => {
    expect(holidayCacheKey(2026, 'BY')).toBe('holidays:2026:BY');
  });
});

describe('write / read round trip', () => {
  it('returns null when nothing cached', () => {
    expect(readHolidayCache(2026, 'BY')).toBeNull();
  });

  it('persists and reads back a Map', () => {
    const map = new Map([
      ['2026-01-01', 'Neujahr'],
      ['2026-12-25', '1. Weihnachtstag'],
    ]);
    writeHolidayCache(2026, 'BY', map);
    const result = readHolidayCache(2026, 'BY');
    expect(result).not.toBeNull();
    expect(result!.data.get('2026-01-01')).toBe('Neujahr');
    expect(result!.data.get('2026-12-25')).toBe('1. Weihnachtstag');
    expect(result!.fetchedAt).toBeGreaterThan(0);
  });

  it('returns null on corrupted JSON', () => {
    localStorage.setItem('urlaubsplaner.v1.holidays:2026:BY', '{not-valid-json');
    expect(readHolidayCache(2026, 'BY')).toBeNull();
  });

  it('returns null when stored shape is invalid', () => {
    localStorage.setItem('urlaubsplaner.v1.holidays:2026:BY', JSON.stringify({ wrong: 'shape' }));
    expect(readHolidayCache(2026, 'BY')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/cache.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement `src/lib/holidays/cache.ts`**

```ts
import { loadJSON, saveJSON } from '../storage';
import type { BundeslandCode, CacheEntry, HolidayMap } from './types';

export function holidayCacheKey(year: number, state: BundeslandCode): string {
  return `holidays:${year}:${state}`;
}

interface ReadResult {
  data: HolidayMap;
  fetchedAt: number;
}

export function readHolidayCache(year: number, state: BundeslandCode): ReadResult | null {
  const raw = loadJSON<unknown>(holidayCacheKey(year, state), null);
  if (!raw || typeof raw !== 'object') return null;
  const entry = raw as Partial<CacheEntry>;
  if (typeof entry.fetchedAt !== 'number') return null;
  if (!entry.data || typeof entry.data !== 'object') return null;
  const map: HolidayMap = new Map();
  for (const [iso, name] of Object.entries(entry.data as Record<string, unknown>)) {
    if (typeof name === 'string') map.set(iso, name);
  }
  return { data: map, fetchedAt: entry.fetchedAt };
}

export function writeHolidayCache(
  year: number,
  state: BundeslandCode,
  data: HolidayMap
): void {
  const entry: CacheEntry = {
    fetchedAt: Date.now(),
    source: 'feiertage-api.de',
    data: Object.fromEntries(data),
  };
  saveJSON(holidayCacheKey(year, state), entry);
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- tests/cache.test.ts`
Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/holidays/cache.ts tests/cache.test.ts
git commit -m "Add localStorage-backed holiday cache"
```

---

## Task 9: Holiday provider hook (lib/holidays/useHolidays.ts)

**Files:**
- Create: `src/lib/holidays/useHolidays.ts`

This task has no unit tests (it's a hook integrating other tested units). Smoke-tested in Task 17 (manual verification).

- [ ] **Step 1: Implement `src/lib/holidays/useHolidays.ts`**

```ts
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/holidays/useHolidays.ts
git commit -m "Add useHolidays hook: cache → fetch → fallback"
```

---

## Task 10: Vacation logic (lib/vacation.ts)

**Files:**
- Create: `src/lib/vacation.ts`
- Create: `tests/vacation.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/vacation.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  normalizeVacationByYear,
  countVacation,
  countVacationPerMonth,
  cycleVacation,
} from '../src/lib/vacation';

describe('normalizeVacationByYear', () => {
  it('migrates legacy true → full', () => {
    const raw = { '2026': { '2026-01-02': true, '2026-01-03': 'half' } };
    expect(normalizeVacationByYear(raw)).toEqual({
      '2026': { '2026-01-02': 'full', '2026-01-03': 'half' },
    });
  });

  it('drops unknown values', () => {
    const raw = { '2026': { '2026-01-02': 'banana', '2026-01-03': 'full' } };
    expect(normalizeVacationByYear(raw)).toEqual({
      '2026': { '2026-01-03': 'full' },
    });
  });

  it('returns empty object for non-object input', () => {
    expect(normalizeVacationByYear(null)).toEqual({});
    expect(normalizeVacationByYear('foo')).toEqual({});
  });
});

describe('countVacation', () => {
  it('counts full as 1 and half as 0.5', () => {
    const map = { '2026-01-01': 'full', '2026-01-02': 'half', '2026-01-03': 'half' } as const;
    expect(countVacation(map)).toBe(2);
  });

  it('returns 0 for empty map', () => {
    expect(countVacation({})).toBe(0);
  });
});

describe('countVacationPerMonth', () => {
  it('sums per month index 0..11', () => {
    const map = {
      '2026-01-05': 'full',
      '2026-01-06': 'half',
      '2026-03-10': 'full',
    } as const;
    const result = countVacationPerMonth(map, 2026);
    expect(result[0]).toBe(1.5);
    expect(result[2]).toBe(1);
    expect(result[5]).toBe(0);
  });

  it('ignores entries from other years', () => {
    const map = { '2025-12-31': 'full', '2026-01-01': 'full' } as const;
    const result = countVacationPerMonth(map, 2026);
    expect(result[0]).toBe(1);
    expect(result.reduce((a, b) => a + b, 0)).toBe(1);
  });
});

describe('cycleVacation', () => {
  it('empty → full → half → empty', () => {
    expect(cycleVacation(undefined)).toBe('full');
    expect(cycleVacation('full')).toBe('half');
    expect(cycleVacation('half')).toBe(undefined);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/vacation.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement `src/lib/vacation.ts`**

```ts
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
```

- [ ] **Step 4: Run tests**

Run: `npm test -- tests/vacation.test.ts`
Expected: 9 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/vacation.ts tests/vacation.test.ts
git commit -m "Add vacation value semantics: full/half, counting, click cycle"
```

---

## Task 11: Bridges algorithm (lib/bridges.ts)

**Files:**
- Create: `src/lib/bridges.ts`
- Create: `tests/bridges.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/bridges.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { computeBridges } from '../src/lib/bridges';
import { fallbackHolidays } from '../src/lib/holidays/fallback';

describe('computeBridges', () => {
  it('suggests Friday after Christi Himmelfahrt (always a Thursday)', () => {
    const hols = fallbackHolidays(2026, 'NW');
    const bridges = computeBridges(2026, hols, {});
    // Christi Himmelfahrt 2026 = 2026-05-14 (Thursday). Bridge candidate: 2026-05-15.
    const himmelfahrtBridge = bridges.find((b) => b.bridgeDays.includes('2026-05-15'));
    expect(himmelfahrtBridge).toBeDefined();
    expect(himmelfahrtBridge!.holidayName).toBe('Christi Himmelfahrt');
  });

  it('returns sorted suggestions, best ratio first', () => {
    const hols = fallbackHolidays(2026, 'NW');
    const bridges = computeBridges(2026, hols, {});
    expect(bridges.length).toBeGreaterThan(0);
    for (let i = 1; i < bridges.length; i++) {
      const prevRatio = bridges[i - 1].totalOff / bridges[i - 1].bridgeDays.length;
      const curRatio = bridges[i].totalOff / bridges[i].bridgeDays.length;
      expect(prevRatio).toBeGreaterThanOrEqual(curRatio);
    }
  });

  it('returns empty array when no eligible holidays', () => {
    const result = computeBridges(2026, new Map(), {});
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/bridges.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement `src/lib/bridges.ts`**

```ts
import { addDays, dowMonFirst, isoOf } from './dates';
import type { HolidayMap } from './holidays/types';
import type { VacationMap } from './vacation';

export interface Bridge {
  id: string;
  holidayName: string;
  bridgeDays: string[];
  totalOff: number;
  label: string;
}

interface HolidayEntry {
  iso: string;
  name: string;
  date: Date;
}

function fmt(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`;
}

function isOff(date: Date, holidayMap: HolidayMap): boolean {
  const iso = isoOf(date.getFullYear(), date.getMonth(), date.getDate());
  return dowMonFirst(date) >= 5 || holidayMap.has(iso);
}

function makeBridge(holiday: HolidayEntry, bridgeDates: Date[], holidayMap: HolidayMap): Bridge {
  const bridgeISOs = bridgeDates.map((d) => isoOf(d.getFullYear(), d.getMonth(), d.getDate()));
  const all = new Set(bridgeISOs);
  const offWithBridge = (date: Date): boolean => {
    const iso = isoOf(date.getFullYear(), date.getMonth(), date.getDate());
    return all.has(iso) || dowMonFirst(date) >= 5 || holidayMap.has(iso);
  };

  const sorted = bridgeDates.slice().sort((a, b) => a.getTime() - b.getTime());
  const minD = sorted[0];
  const maxD = sorted[sorted.length - 1];
  const start = new Date(Math.min(minD.getTime(), holiday.date.getTime()));
  const end = new Date(Math.max(maxD.getTime(), holiday.date.getTime()));

  let s = new Date(start);
  while (true) {
    const prev = addDays(s, -1);
    if (offWithBridge(prev)) s = prev;
    else break;
  }
  let e = new Date(end);
  while (true) {
    const nxt = addDays(e, 1);
    if (offWithBridge(nxt)) e = nxt;
    else break;
  }

  let count = 0;
  let cursor = new Date(s);
  while (cursor <= e) {
    if (offWithBridge(cursor)) count++;
    cursor = addDays(cursor, 1);
  }

  const label =
    bridgeDates.length === 1
      ? fmt(bridgeDates[0])
      : `${fmt(sorted[0])}–${fmt(sorted[sorted.length - 1])}`;

  return {
    id: `${holiday.iso}-${bridgeISOs.join('|')}`,
    holidayName: holiday.name,
    bridgeDays: bridgeISOs,
    totalOff: count,
    label,
  };
}

export function computeBridges(
  year: number,
  holidayMap: HolidayMap,
  _vac: VacationMap
): Bridge[] {
  const results: Bridge[] = [];
  const holDates: HolidayEntry[] = [];
  for (const [iso, name] of holidayMap) {
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() === year) {
      holDates.push({ iso, name, date });
    }
  }

  for (const h of holDates) {
    const dow = dowMonFirst(h.date);
    if (dow === 0) {
      const tue = addDays(h.date, 1);
      if (!isOff(tue, holidayMap)) results.push(makeBridge(h, [tue], holidayMap));
    } else if (dow === 4) {
      const thu = addDays(h.date, -1);
      if (!isOff(thu, holidayMap)) results.push(makeBridge(h, [thu], holidayMap));
    } else if (dow === 1) {
      const mon = addDays(h.date, -1);
      if (!isOff(mon, holidayMap)) results.push(makeBridge(h, [mon], holidayMap));
    } else if (dow === 3) {
      const fri = addDays(h.date, 1);
      if (!isOff(fri, holidayMap)) results.push(makeBridge(h, [fri], holidayMap));
    } else if (dow === 2) {
      const mon = addDays(h.date, -2);
      const tue = addDays(h.date, -1);
      const thu = addDays(h.date, 1);
      const fri = addDays(h.date, 2);
      if (!isOff(mon, holidayMap) && !isOff(tue, holidayMap)) {
        results.push(makeBridge(h, [mon, tue], holidayMap));
      }
      if (!isOff(thu, holidayMap) && !isOff(fri, holidayMap)) {
        results.push(makeBridge(h, [thu, fri], holidayMap));
      }
    }
  }

  results.sort((a, b) => {
    const ra = a.totalOff / a.bridgeDays.length;
    const rb = b.totalOff / b.bridgeDays.length;
    if (rb !== ra) return rb - ra;
    return a.bridgeDays[0].localeCompare(b.bridgeDays[0]);
  });
  return results;
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- tests/bridges.test.ts`
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/bridges.ts tests/bridges.test.ts
git commit -m "Port Brückentag suggestion algorithm to TS"
```

---

## Task 12: StatusBadge component

**Files:**
- Create: `src/components/StatusBadge.tsx`

- [ ] **Step 1: Implement `src/components/StatusBadge.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/StatusBadge.tsx
git commit -m "Add StatusBadge component"
```

---

## Task 13: Masthead component

**Files:**
- Create: `src/components/Masthead.tsx`

- [ ] **Step 1: Implement `src/components/Masthead.tsx`**

```tsx
import { BUNDESLAENDER } from '../lib/holidays/states';
import type { BundeslandCode, HolidayStatus } from '../lib/holidays/types';
import { StatusBadge } from './StatusBadge';

interface MastheadProps {
  year: number;
  setYear: (y: number) => void;
  state: BundeslandCode;
  setState: (s: BundeslandCode) => void;
  quota: number;
  setQuota: (q: number) => void;
  used: number;
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
          <select
            className="inline"
            value={state}
            onChange={(e) => setState(e.target.value as BundeslandCode)}
          >
            {BUNDESLAENDER.map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Masthead.tsx
git commit -m "Add Masthead component"
```

---

## Task 14: Month component

**Files:**
- Create: `src/components/Month.tsx`

- [ ] **Step 1: Implement `src/components/Month.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Month.tsx
git commit -m "Add Month component with three-state click and half-day rendering"
```

---

## Task 15: Stats, Bridges, Legend, Colophon components

**Files:**
- Create: `src/components/Stats.tsx`
- Create: `src/components/Bridges.tsx`
- Create: `src/components/Legend.tsx`
- Create: `src/components/Colophon.tsx`

- [ ] **Step 1: Implement `src/components/Stats.tsx`**

```tsx
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
```

- [ ] **Step 2: Implement `src/components/Bridges.tsx`**

```tsx
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
                {b.bridgeDays.length}→{b.totalOff} Tage
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Implement `src/components/Legend.tsx`**

```tsx
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
```

- [ ] **Step 4: Implement `src/components/Colophon.tsx`**

```tsx
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
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/Stats.tsx src/components/Bridges.tsx src/components/Legend.tsx src/components/Colophon.tsx
git commit -m "Add Stats, Bridges, Legend, Colophon components"
```

---

## Task 16: Wire it all up in App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace `src/App.tsx` with full implementation**

```tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Masthead } from './components/Masthead';
import { Month } from './components/Month';
import { Stats } from './components/Stats';
import { Bridges } from './components/Bridges';
import { Legend } from './components/Legend';
import { Colophon } from './components/Colophon';
import { useHolidays } from './lib/holidays/useHolidays';
import { computeBridges } from './lib/bridges';
import { dowMonFirst } from './lib/dates';
import {
  countVacation,
  countVacationPerMonth,
  cycleVacation,
  normalizeVacationByYear,
} from './lib/vacation';
import type { VacationByYear, VacationValue } from './lib/vacation';
import type { BundeslandCode } from './lib/holidays/types';
import { loadJSON, saveJSON } from './lib/storage';

const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

export function App() {
  const [year, setYear] = useState<number>(() => loadJSON('year', new Date().getFullYear()));
  const [state, setState] = useState<BundeslandCode>(() => loadJSON('state', 'BY' as BundeslandCode));
  const [quota, setQuota] = useState<number>(() => loadJSON('quota', 30));
  const [vacByYear, setVacByYear] = useState<VacationByYear>(() =>
    normalizeVacationByYear(loadJSON<unknown>('vacByYear', {}))
  );

  useEffect(() => saveJSON('year', year), [year]);
  useEffect(() => saveJSON('state', state), [state]);
  useEffect(() => saveJSON('quota', quota), [quota]);
  useEffect(() => saveJSON('vacByYear', vacByYear), [vacByYear]);

  const { data: holidayMap, status, error, fetchedAt, refresh } = useHolidays(year, state);

  const yearKey = String(year);
  const vac = vacByYear[yearKey] ?? {};

  // Cleanup: drop entries that are now weekends/holidays for the active year.
  useEffect(() => {
    setVacByYear((prev) => {
      const current = prev[yearKey];
      if (!current) return prev;
      let changed = false;
      const cleaned: typeof current = {};
      for (const [iso, value] of Object.entries(current)) {
        const [y, m, d] = iso.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        const isWE = dowMonFirst(dt) >= 5;
        if (isWE || holidayMap.has(iso)) {
          changed = true;
          continue;
        }
        cleaned[iso] = value;
      }
      if (!changed) return prev;
      return { ...prev, [yearKey]: cleaned };
    });
  }, [holidayMap, yearKey]);

  const toggleDay = useCallback((iso: string) => {
    setVacByYear((prev) => {
      const cur = { ...(prev[yearKey] ?? {}) };
      const next = cycleVacation(cur[iso]);
      if (next === undefined) delete cur[iso];
      else cur[iso] = next;
      return { ...prev, [yearKey]: cur };
    });
  }, [yearKey]);

  const applyBridge = useCallback((isos: string[], applied: boolean) => {
    setVacByYear((prev) => {
      const cur = { ...(prev[yearKey] ?? {}) };
      if (applied) {
        for (const iso of isos) delete cur[iso];
      } else {
        for (const iso of isos) {
          if (!cur[iso]) cur[iso] = 'full' as VacationValue;
        }
      }
      return { ...prev, [yearKey]: cur };
    });
  }, [yearKey]);

  const resetYear = useCallback(() => {
    if (!confirm(`Urlaubstage für ${year} löschen?`)) return;
    setVacByYear((prev) => {
      const next = { ...prev };
      delete next[yearKey];
      return next;
    });
  }, [year, yearKey]);

  const used = useMemo(() => countVacation(vac), [vac]);
  const remaining = Math.max(0, quota - used);
  const over = Math.max(0, used - quota);
  const monthUsed = useMemo(() => countVacationPerMonth(vac, year), [vac, year]);
  const bridges = useMemo(() => computeBridges(year, holidayMap, vac), [year, holidayMap, vac]);

  return (
    <div className="page">
      <Masthead
        year={year}
        setYear={setYear}
        state={state}
        setState={setState}
        quota={quota}
        setQuota={setQuota}
        used={used}
        remaining={remaining}
        status={status}
        fetchedAt={fetchedAt}
        error={error}
        onRefresh={refresh}
      />

      <div className="grid-section-title">Jahr · {year}</div>

      <div className="year-grid">
        {MONTH_NAMES.map((name, mi) => (
          <Month
            key={mi}
            year={year}
            monthIndex={mi}
            name={name}
            holidayMap={holidayMap}
            vac={vac}
            onToggle={toggleDay}
            urlaubCount={monthUsed[mi]}
          />
        ))}
      </div>

      <Stats
        used={used}
        quota={quota}
        remaining={remaining}
        over={over}
        monthUsed={monthUsed}
        holidayCount={holidayMap.size}
      />

      <Bridges bridges={bridges} vac={vac} onApply={applyBridge} />

      <Legend onReset={resetYear} onRefreshHolidays={refresh} />

      <Colophon year={year} state={state} status={status} />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Run all tests**

Run: `npm test`
Expected: all suites pass.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "Wire components together in App with vacation state and persistence"
```

---

## Task 17: Build + smoke test

**Files:**
- None (verification only)

- [ ] **Step 1: Build production bundle**

Run: `npm run build`
Expected: `dist/` directory created, no TypeScript errors, no Vite errors.

- [ ] **Step 2: Run preview server and curl the built HTML**

Run: `npm run preview -- --port 4173 &` then `sleep 3 && curl -s http://localhost:4173/urlaubsplaner/ | grep -o '<title>[^<]*</title>' && kill %1`
Expected: `<title>Urlaubsplaner</title>`.

- [ ] **Step 3: Verify built JS contains expected strings**

Run: `grep -r "Urlaubs" dist/assets/ | head -3`
Expected: at least one match in a JS file.

- [ ] **Step 4: Run all tests one more time**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 5: Commit nothing — this task verifies only.**

---

## Task 18: GitHub Pages deployment

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `README.md`

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Create `README.md`**

```markdown
# Urlaubsplaner

Einfacher Urlaubsplaner für Arbeitnehmer in Deutschland. Jahresansicht mit Feiertagen je Bundesland, halben und ganzen Urlaubstagen, Brückentag-Vorschlägen und Statistik. Läuft komplett im Browser, speichert lokal, keine Anmeldung.

## Lokal entwickeln

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # Vitest unit tests
npm run build     # baut nach dist/
npm run preview   # served den Build lokal
```

## Auf GitHub Pages deployen

Einmalig in den Repository-Einstellungen:

1. Settings → Pages
2. Build and deployment → Source: **GitHub Actions**

Danach: jeder Push auf `main` triggert den Workflow (`.github/workflows/deploy.yml`), der baut, testet und auf `https://<user>.github.io/urlaubsplaner/` deployed.

## Daten

Alle Eingaben (Jahr, Bundesland, Urlaubsanspruch, geplante Urlaubstage) werden lokal im Browser unter dem `localStorage`-Prefix `urlaubsplaner.v1.` gespeichert. Kein Server, kein Account, keine Cookies.

## Feiertage

- Primäre Quelle: [feiertage-api.de](https://feiertage-api.de/) (kostenlos, JSON, deutsche Namen)
- Fallback bei API-Ausfall: lokale Berechnung über den Meeus/Easter-Algorithmus plus Bundesland-spezifische Regeln
- Cache: pro `(Jahr, Bundesland)` in `localStorage`. Stale-while-revalidate. Manueller Refresh über den Status-Badge oder den "Feiertage neu laden"-Button

## Bedienung

- **Klick** auf einen Werktag: ganzer Urlaubstag (gold gefüllt)
- **Erneuter Klick**: halber Urlaubstag (gold-Dreieck)
- **Dritter Klick**: leer
- Feiertage und Wochenenden sind nicht klickbar
- **Brückentage**: Klick auf einen Vorschlag setzt alle dazugehörigen Tage als ganze Urlaubstage; erneuter Klick entfernt sie wieder

## Lizenz

Privates Projekt. Quellen für Feiertage gemäß deren Lizenzbestimmungen.
```

- [ ] **Step 3: Verify workflow syntax**

Run: `cat .github/workflows/deploy.yml | head -5`
Expected: workflow file is readable.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml README.md
git commit -m "Add GitHub Pages deploy workflow and README"
```

---

## Self-Review checklist (filled before plan was finalized)

1. **Spec coverage:**
   - §1 (Purpose) — covered by Tasks 1, 13–16
   - §2 (Architecture / files) — Tasks 1–16
   - §3 (Data model) — Tasks 4 (types), 10 (vacation), 8 (cache)
   - §4 (Provider state machine) — Task 9
   - §5 (UI) — Tasks 12–15; three-state click in Task 14; half rendering in Task 2 (CSS) + Task 14
   - §5.6 (Cleanup) — Task 16, App effect
   - §6 (Bridges) — Task 11, Task 15 component, Task 16 wiring
   - §7 (Tests) — Tasks 3, 5, 6, 8, 10, 11
   - §8 (Build & deployment) — Tasks 1 (vite.config), 17 (build verify), 18 (workflow + README)
   - §9 (Risks) — surfaced via StatusBadge (Task 12) and Colophon (Task 15)

2. **Placeholder scan:** none — every step has either exact code, exact commands, or both.

3. **Type consistency:**
   - `HolidayMap = Map<string, string>` — used consistently
   - `BundeslandCode` literal union — used consistently
   - `VacationValue = 'full' | 'half'` — used consistently
   - `HolidayStatus` — same 5 values in types.ts, StatusBadge, Colophon
   - `useHolidays` return shape matches `HolidaysResult` plus `fetchedAt`
