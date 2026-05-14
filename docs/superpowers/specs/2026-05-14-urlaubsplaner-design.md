# Urlaubsplaner — Design

**Status:** Draft for review
**Date:** 2026-05-14
**Scope:** Personal vacation planner for German employees, runs in browser, hosted on GitHub Pages.

## 1. Purpose & Constraints

A single-user, browser-only tool to plan annual vacation against German public holidays per Bundesland.

**Functional requirements**

- Year view (12 months) with all days visible
- Bundesland-aware public holidays (16 German states)
- Holidays come from a public API (`feiertage-api.de`) with local fallback
- User can enter total annual vacation entitlement (Urlaubsanspruch)
- User can mark workdays as vacation: full or half day
- Remaining days and overrun shown compactly in Masthead (negative value in red when over quota)
- Bridge-day (Brückentag) suggestions
- All state persists in localStorage; no backend, no account

**Non-functional requirements**

- Hostable as a static site on GitHub Pages
- Works offline once loaded (fallback holiday calculation; cached vacation data)
- Year, Bundesland and Urlaubsanspruch are user-editable at any time
- No build step required to run the source code mentally; familiar Vite/React/TS stack

**Explicitly out of scope (YAGNI)**

- Multi-user, cloud sync, accounts
- Export (iCal, CSV)
- Sick days, special leave, flex-time
- Multiple years side-by-side
- PWA / native mobile
- i18n (German-only)
- Dark mode
- E2E tests (Playwright); component tests only where interaction logic warrants it
- User-selectable holiday API

## 2. Architecture

### 2.1 Stack

- Vite 5
- React 18
- TypeScript 5, strict mode
- Vitest for unit tests
- No CSS framework — CSS ported from handoff prototype into `src/styles.css`
- No state library, no router
- GitHub Actions workflow deploys to GitHub Pages on push to `main`

### 2.2 File layout

```
.github/workflows/
  deploy.yml                  # build + deploy to GitHub Pages on push to main
docs/
  handoff/                    # extracted contents of urlaubsplaner-handoff.zip (reference)
  superpowers/specs/
    2026-05-14-urlaubsplaner-design.md
src/
  lib/
    holidays/
      types.ts                # HolidayMap, BundeslandCode, HolidayStatus, CacheEntry
      states.ts               # 16 Bundesländer (code + name)
      fallback.ts             # Easter algorithm + Buß-und-Bettag (from prototype)
      api.ts                  # fetchFromFeiertageApi(year, state) → HolidayMap
      cache.ts                # localStorage cache, key: `holidays:${year}:${state}`
      useHolidays.ts          # SWR hook: cache → fetch → fallback
    bridges.ts                # computeBridges (from prototype)
    dates.ts                  # isoOf, dowMonFirst, todayISO, addDays
    storage.ts                # typed loadJSON/saveJSON
    vacation.ts               # vacation value normalization + counting
  components/
    Masthead.tsx
    Month.tsx
    Stats.tsx
    Bridges.tsx
    Legend.tsx
    Colophon.tsx
    StatusBadge.tsx
  App.tsx
  main.tsx
  styles.css
tests/
  fallback.test.ts
  api.test.ts
  bridges.test.ts
  dates.test.ts
  cache.test.ts
  vacation.test.ts
urlaubsplaner-handoff.zip
vite.config.ts
tsconfig.json
package.json
README.md
.gitignore
```

### 2.3 Module boundaries

- `holidays/useHolidays.ts` is the only place that orchestrates API + cache + fallback.
- Components call `useHolidays(year, state)` and receive `{ data, status, error?, refresh }`. They know nothing about fetch/cache/CORS.
- `App.tsx` composes components and owns user input state (year, state, quota, vacation map).
- `lib/vacation.ts` owns vacation value semantics ('full' | 'half') so components don't reason about the enum.
- Bundesland names live in `states.ts` — static table used for the dropdown only. All holiday data comes from `useHolidays`.

## 3. Data model

### 3.1 Vacation entries

```ts
type VacationValue = 'full' | 'half';
type VacationMap = Record<string /* "YYYY-MM-DD" */, VacationValue>;
type VacationByYear = Record<string /* year, e.g. "2026" */, VacationMap>;
```

Year keys are strings because JSON serializes object keys as strings; storing them as strings avoids round-trip coercion bugs. Callers convert via `String(year)` when indexing.

Migration from legacy `true` values: on load, normalize `true → 'full'` transparently in the storage loader (handled in `lib/vacation.ts`).

### 3.2 Holidays

```ts
type HolidayMap = Map<string /* "YYYY-MM-DD" */, string /* name */>;
type BundeslandCode =
  | 'BW' | 'BY' | 'BE' | 'BB' | 'HB' | 'HH' | 'HE' | 'MV'
  | 'NI' | 'NW' | 'RP' | 'SL' | 'SN' | 'ST' | 'SH' | 'TH';
```

### 3.3 Cache

```ts
// localStorage key: `urlaubsplaner.v1.holidays:${year}:${state}`
interface CacheEntry {
  fetchedAt: number;              // unix ms
  source: 'feiertage-api.de';
  data: Record<string, string>;   // ISO date → holiday name
}
```

No TTL — public holidays do not change retroactively. `fetchedAt` is stored for display ("zuletzt am …") and for future invalidation if the schema changes.

### 3.4 localStorage keys

All keys prefixed `urlaubsplaner.v1.`:

- `year` — number
- `state` — BundeslandCode
- `quota` — number (0..365)
- `vacByYear` — VacationByYear
- `holidays:${year}:${state}` — CacheEntry

## 4. Holiday provider state machine

`useHolidays(year, state)` returns:

```ts
type HolidayStatus = 'loading' | 'fresh' | 'cached' | 'fallback' | 'error';

interface HolidaysResult {
  data: HolidayMap;
  status: HolidayStatus;
  error?: Error;
  refresh: () => void;
}
```

### 4.1 Transitions

On mount or whenever `(year, state)` changes:

1. Read cache.
   - **HIT** → `status = 'cached'`, `data = cache`, then fetch in background.
   - **MISS** → `status = 'loading'`, `data = fallback(year, state)` (computed synchronously), then fetch.
2. Fetch result:
   - **SUCCESS** → write cache, `status = 'fresh'`, `data = apiResponse`.
   - **NETWORK / CORS / HTTP error / parser error** → if cache exists, keep `cached`; else `status = 'fallback'`, `error` set. Never overwrite cache with fallback.

Rationale: cached API data is more authoritative than fallback (which is a simplified Easter-based computation that doesn't handle municipal exceptions). Loading users see plausible data immediately rather than a spinner.

### 4.2 `refresh()`

Bypasses cache check, sets `status = 'loading'` while keeping current `data`, then runs the fetch flow.

### 4.3 API parser

feiertage-api.de response shape:

```json
{
  "Neujahrstag": { "datum": "2026-01-01", "hinweis": "" },
  "Karfreitag":  { "datum": "2026-04-03", "hinweis": "" }
}
```

Parser iterates keys, returns `Map<ISO, name>`. Robust against extra/missing fields; throws on completely unrecognizable shape.

### 4.4 Fallback algorithm

Ported from `docs/handoff/urlaubsplaner/project/holidays.js`:

- Anonymous Gregorian (Meeus) Easter
- Buß- und Bettag = Wednesday before Nov 23
- Per-state rules for Heilige Drei Könige, Fronleichnam, Allerheiligen, Reformationstag, Internationaler Frauentag, Weltkindertag, Mariä Himmelfahrt

Known limitation: does not cover municipal exceptions (Augsburger Friedensfest, Mariä Himmelfahrt in BY-Gemeinden). Documented in code comment.

## 5. UI

### 5.1 Layout

Component tree:

```
App
├── Masthead
│   ├── Title
│   ├── Year stepper
│   ├── Bundesland dropdown (custom BundeslandSelect)
│   ├── Quota input
│   ├── Remaining readout (shows −N in red when over quota)
│   └── StatusBadge
├── Legend (with "Feiertage neu laden", "Jahr zurücksetzen", "Drucken")
├── SectionTitle "Jahr · YYYY"
├── YearGrid
│   └── Month × 12
└── Bridges
```

Visual design ported from `docs/handoff/urlaubsplaner/project/index.html` — newspaper / paper aesthetic, Newsreader + JetBrains Mono fonts via Google Fonts.

### 5.2 Vacation interaction — three-state click

Click cycle on a workday (not weekend, not holiday):

```
empty  →  full  →  half  →  empty
```

Visual states for `.day`:

- **full**: solid gold fill (existing `.day.urlaub` style)
- **half**: gold fill on the lower-right triangle via `clip-path` or linear-gradient at 135°. The day number stays readable. Mono fontweight unchanged.
- **empty**: standard

Title tooltip per state:

- `"YYYY-MM-DD — Klicken für Urlaub"`
- `"YYYY-MM-DD — Urlaub (ganzer Tag, klicken für halben Tag)"`
- `"YYYY-MM-DD — Urlaub (halber Tag, klicken zum Entfernen)"`

Clicks on weekend/holiday days remain ignored.

### 5.3 Counting and display

- `used` is the sum of `value === 'half' ? 0.5 : 1`
- `remaining = max(0, quota - used)`
- `over = max(0, used - quota)`
- `monthUsed[i]` is a sum, can be non-integer
- Display uses `Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 })`. Examples: `12,5`, `0,5`, `12`.
- Masthead Resturlaub cell: shows `remaining` in gold, `0` in red when exactly spent, `−over` in red when over quota.

### 5.4 StatusBadge

Lives in the masthead strip, replaces nothing.

| status     | dot color           | label    | tooltip                                          |
|------------|---------------------|----------|--------------------------------------------------|
| `loading`  | gray, pulsing       | `lädt …` | "Feiertage werden geladen"                       |
| `fresh`    | gold                | `live`   | "Feiertage von heute geladen"                    |
| `cached`   | gold (muted)        | `cache`  | "Feiertage aus Cache — zuletzt am {date}"        |
| `fallback` | rot-soft            | `offline`| "Feiertage berechnet (API nicht erreichbar)"    |
| `error`    | rot                 | `fehler` | Error message                                    |

Click → `refresh()`.

### 5.5 Loading behavior

| Scenario                             | What the user sees                                                                |
|--------------------------------------|------------------------------------------------------------------------------------|
| First visit, online                  | Brief fallback data + `loading` badge → ~200 ms later `fresh`                     |
| Repeat visit, online                 | Cached data + `cached` badge immediately, silent refresh to `fresh`               |
| Repeat visit, offline                | Cached data + `cached` badge, fetch fails silently                                 |
| First visit, offline                 | Fallback data + `fallback` badge                                                   |
| Year/state switch to unseen combo    | Same as "First visit"                                                              |

Never shows an empty grid or full-screen spinner.

### 5.6 Cleanup on holiday update

When holidays load (any status), iterate `vacByYear[currentYear]` and remove entries whose ISO is now a holiday or weekend. This prevents stale vacation days from being uncountable (since they wouldn't be clickable to remove). Runs in `App.tsx` as an effect after `useHolidays` data changes.

## 6. Bridges

Ported unchanged from `docs/handoff/urlaubsplaner/project/app.jsx`. Computed from `(year, holidayMap, vac)`. Half-day vacations count as "off" for bridge purposes (same as full days). Clicking a bridge suggestion applies full days to all listed dates (not halves). Already-applied bridges show muted styling.

## 7. Tests (Vitest)

Unit tests only, focused on logic that hurts when wrong:

- `tests/dates.test.ts` — isoOf, dowMonFirst, addDays edge cases (DST, year boundary, leap year)
- `tests/fallback.test.ts` — known holidays for a sample of years × states (e.g., BY 2025: Heilige Drei Könige present; NW 2025: not present; SN 2025: Buß- und Bettag = 2025-11-19)
- `tests/api.test.ts` — parser with happy-path response, extra fields, missing fields, unrecognizable shape (throws)
- `tests/cache.test.ts` — write/read round trip, key format, handling of corrupted JSON
- `tests/bridges.test.ts` — known cases (Christi Himmelfahrt always on Thursday → suggests Friday)
- `tests/vacation.test.ts` — sum of mixed full/half, legacy migration `true → 'full'`, counting per month

Component tests are used for interactive custom components with non-trivial state machines (e.g. BundeslandSelect). No component tests for pure display components. No fetch-mocking integration tests beyond the parser.

## 8. Build & deployment

### 8.1 Vite config

```ts
// vite.config.ts
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/urlaubsplaner/' : '/',
  plugins: [react()],
}));
```

Local `npm run dev` serves at `/`. Production build serves at `/urlaubsplaner/` (the repo name on GitHub Pages).

### 8.2 GitHub Actions workflow

`.github/workflows/deploy.yml` uses the official `actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages` chain. Triggers on push to `main`. Runs `npm ci && npm run build`, uploads `dist/`, deploys.

Repository settings (manual one-time step, documented in README): Pages → Build and deployment → Source: GitHub Actions.

### 8.3 README content

- What the app does
- How to run locally (`npm install && npm run dev`)
- How to test (`npm test`)
- How to deploy to GitHub Pages (push to main; one-time Settings step)
- Data privacy note (everything local, no backend)
- Holiday data source attribution (feiertage-api.de) and fallback note

## 9. Risks & accepted trade-offs

1. **CORS on feiertage-api.de**: if it disappears, app falls into fallback silently. StatusBadge surfaces this. Accepted.
2. **API schema drift**: parser throws → fallback. Cache survives because already normalized. Accepted.
3. **Fallback vs. API discrepancies on edge cases** (municipal exceptions): fresh-status disclaims fallback values. Accepted.
4. **localStorage quota**: <100 KB total expected, quota is typically 5 MB. No risk.
5. **Vite base path breaks dev**: mitigated by command-conditional base.
6. **Stale vacation entries after state change**: stale entries that became holidays are auto-cleaned (see §5.6).
7. **Bridges with fallback holidays**: bridges computed against whatever holidays are loaded. User can refresh. Accepted.

## 10. Open questions

None at spec time. Will track in implementation plan.
