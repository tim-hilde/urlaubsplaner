/* global React, ReactDOM, HolidaysDE */
const { useState, useEffect, useMemo, useCallback } = React;

const MONTH_NAMES = [
"Januar", "Februar", "März", "April", "Mai", "Juni",
"Juli", "August", "September", "Oktober", "November", "Dezember"];

// Mon-first DOW labels
const DOW = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

const LS_PREFIX = "urlaubsplaner.v1.";

const todayISO = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
})();

function isoOf(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// Mon=0..Sun=6
function dowMonFirst(date) {
  return (date.getDay() + 6) % 7;
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}
function saveJSON(key, val) {
  try {localStorage.setItem(LS_PREFIX + key, JSON.stringify(val));} catch (e) {}
}

function App() {
  const [year, setYear] = useState(() => loadJSON("year", new Date().getFullYear()));
  const [state, setState] = useState(() => loadJSON("state", "BY"));
  const [quota, setQuota] = useState(() => loadJSON("quota", 30));
  // vacationByYear: { [year]: { "YYYY-MM-DD": true } }
  const [vacByYear, setVacByYear] = useState(() => loadJSON("vacByYear", {}));

  useEffect(() => saveJSON("year", year), [year]);
  useEffect(() => saveJSON("state", state), [state]);
  useEffect(() => saveJSON("quota", quota), [quota]);
  useEffect(() => saveJSON("vacByYear", vacByYear), [vacByYear]);

  const holidayMap = useMemo(
    () => HolidaysDE.holidays(year, state),
    [year, state]
  );

  const vac = vacByYear[year] || {};

  const toggleDay = useCallback((iso) => {
    setVacByYear((prev) => {
      const cur = { ...(prev[year] || {}) };
      if (cur[iso]) delete cur[iso];else
      cur[iso] = true;
      return { ...prev, [year]: cur };
    });
  }, [year]);

  // Stats
  const used = useMemo(
    () => Object.keys(vac).filter((iso) => iso.startsWith(`${year}-`)).length,
    [vac, year]
  );
  const remaining = Math.max(0, quota - used);
  const over = Math.max(0, used - quota);

  // Per-month urlaub count
  const monthUsed = useMemo(() => {
    const m = Array(12).fill(0);
    Object.keys(vac).forEach((iso) => {
      const [y, mm] = iso.split("-");
      if (Number(y) === year) m[Number(mm) - 1] += 1;
    });
    return m;
  }, [vac, year]);

  // Bridge-day suggestions: weekday neighbouring a holiday (skipping over weekends)
  // that would yield ≥ 4 consecutive non-work days.
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
        remaining={remaining}
        used={used} />
      

      <SectionTitle>Jahr · {year}</SectionTitle>

      <div className="year-grid">
        {MONTH_NAMES.map((name, mi) =>
        <Month
          key={mi}
          year={year}
          monthIndex={mi}
          name={name}
          holidayMap={holidayMap}
          vac={vac}
          onToggle={toggleDay}
          urlaubCount={monthUsed[mi]} />

        )}
      </div>

      <Stats
        used={used}
        quota={quota}
        remaining={remaining}
        over={over}
        monthUsed={monthUsed}
        holidayCount={holidayMap.size} />
      

      <Bridges bridges={bridges} onToggleDay={toggleDay} vac={vac} />

      <Legend onReset={() => {
        if (confirm(`Urlaubstage für ${year} löschen?`)) {
          setVacByYear((prev) => {
            const next = { ...prev };
            delete next[year];
            return next;
          });
        }
      }} />

      <Colophon year={year} state={state} />
    </div>);

}

function Masthead({ year, setYear, state, setState, quota, setQuota, remaining, used }) {
  const stateName = (HolidaysDE.STATES.find(([c]) => c === state) || [, ""])[1];
  return (
    <header className="masthead">
      <div className="title-row" data-comment-anchor="ad780c67c2-div-150-7">
        <h1 className="title">Urlaubs<em>planer</em></h1>
      </div>

      <div className="strip">
        <div className="cell">
          <div className="label">Jahr</div>
          <div className="year-stepper">
            <button onClick={() => setYear(year - 1)} aria-label="Jahr zurück">←</button>
            <span className="num">{year}</span>
            <button onClick={() => setYear(year + 1)} aria-label="Jahr vor">→</button>
          </div>
        </div>

        <div className="cell indent">
          <div className="label">Bundesland</div>
          <select
            className="inline"
            value={state}
            onChange={(e) => setState(e.target.value)}>
            
            {HolidaysDE.STATES.map(([code, name]) =>
            <option key={code} value={code}>{name}</option>
            )}
          </select>
        </div>

        <div className="cell indent">
          <div className="label">Urlaubsanspruch · Tage</div>
          <input
            className="inline num"
            type="number"
            min="0"
            max="365"
            value={quota}
            onChange={(e) => setQuota(Math.max(0, Math.min(365, Number(e.target.value) || 0)))} />
          
        </div>

        <div className="cell indent">
          <div className="label">Resturlaub</div>
          <div className="value mono" style={{ color: remaining === 0 ? "var(--rot)" : "var(--gold)" }}>
            {remaining}<span style={{ fontSize: 14, color: "var(--ink-3)", marginLeft: 8 }}>von {quota}</span>
          </div>
        </div>
      </div>
    </header>);

}

function SectionTitle({ children }) {
  return <div className="grid-section-title">{children}</div>;
}

function Month({ year, monthIndex, name, holidayMap, vac, onToggle, urlaubCount }) {
  const first = new Date(year, monthIndex, 1);
  const lead = dowMonFirst(first); // empty cells before day 1
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push({ empty: true, key: `e${i}` });
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = isoOf(year, monthIndex, d);
    const dt = new Date(year, monthIndex, d);
    const dow = dowMonFirst(dt);
    const isWE = dow >= 5;
    const holName = holidayMap.get(iso);
    cells.push({
      key: iso,
      day: d,
      iso,
      weekend: isWE,
      holiday: holName || null,
      urlaub: !!vac[iso],
      today: iso === todayISO
    });
  }
  // pad tail to a multiple of 7 for tidy grid
  while (cells.length % 7 !== 0) cells.push({ empty: true, key: `t${cells.length}` });

  return (
    <div className="month">
      <div className="month-head">
        <div className="month-name">
          {name}<span className="num">{String(monthIndex + 1).padStart(2, "0")}</span>
        </div>
        <div className="month-stats">
          {urlaubCount > 0 ?
          <><span className="urlaub-count">{urlaubCount}</span> Urlaub</> :
          <span style={{ opacity: 0.5 }}>—</span>}
        </div>
      </div>

      <div className="dow-row">
        {DOW.map((d, i) =>
        <div key={d} className={"dow" + (i >= 5 ? " we" : "")}>{d}</div>
        )}
      </div>

      <div className="day-grid">
        {cells.map((c) => {
          if (c.empty) return <div key={c.key} className="day empty"></div>;
          const cls = [
          "day",
          c.weekend ? "weekend" : "",
          c.holiday ? "holiday" : "",
          c.urlaub ? "urlaub" : "",
          c.today ? "today" : ""].
          filter(Boolean).join(" ");
          const title = c.holiday ?
          `${c.iso} — ${c.holiday}` :
          c.weekend ?
          `${c.iso} — Wochenende` :
          c.urlaub ?
          `${c.iso} — Urlaub (klicken zum Entfernen)` :
          `${c.iso} — Klicken für Urlaub`;
          return (
            <div
              key={c.key}
              className={cls}
              title={title}
              onClick={() => {
                if (c.holiday || c.weekend) return;
                onToggle(c.iso);
              }}>
              
              {c.day}
            </div>);

        })}
      </div>
    </div>);

}

function Stats({ used, quota, remaining, over, monthUsed, holidayCount }) {
  const pct = quota > 0 ? Math.min(100, used / quota * 100) : 0;
  const peakMonth = monthUsed.reduce((acc, n, i) => n > acc.n ? { n, i } : acc, { n: 0, i: -1 });

  return (
    <section className="stats">
      <div className="cell">
        <div className="lbl">Bilanz</div>
        <div className="lede">
          Von <strong>{quota}</strong> Urlaubstagen sind{" "}
          <strong style={{ color: "var(--gold)" }}>{used}</strong> verplant.{" "}
          {over > 0 ?
          <span style={{ color: "var(--rot)" }}>Du liegst {over} {over === 1 ? "Tag" : "Tage"} über dem Anspruch.</span> :
          remaining === 0 ?
          <>Das Jahr ist exakt eingeteilt.</> :
          <>Es bleiben <strong>{remaining}</strong> {remaining === 1 ? "Tag" : "Tage"} zu planen.</>
          }
        </div>
        <div className="bar">
          <div className="fill" style={{ width: `${pct}%`, background: over > 0 ? "var(--rot)" : "var(--gold-fill)" }}></div>
        </div>
      </div>
      <div className="cell">
        <div className="lbl">Verplant</div>
        <div className="big gold">{String(used).padStart(2, "0")}</div>
        <div className="sub">Tage</div>
      </div>
      <div className="cell">
        <div className="lbl">Resturlaub</div>
        <div className={"big " + (over > 0 ? "rot" : "")}>{over > 0 ? `−${over}` : String(remaining).padStart(2, "0")}</div>
        <div className="sub">{over > 0 ? "über Anspruch" : "Tage übrig"}</div>
      </div>
      <div className="cell">
        <div className="lbl">Spitzenmonat</div>
        <div className="big">{peakMonth.i >= 0 && peakMonth.n > 0 ? String(peakMonth.n).padStart(2, "0") : "—"}</div>
        <div className="sub">{peakMonth.i >= 0 && peakMonth.n > 0 ? MONTH_NAMES[peakMonth.i] : "noch nichts geplant"}</div>
      </div>
      <div className="cell">
        <div className="lbl">Feiertage</div>
        <div className="big rot">{String(holidayCount).padStart(2, "0")}</div>
        <div className="sub">in deinem Bundesland</div>
      </div>
    </section>);

}

function Bridges({ bridges, onToggleDay, vac }) {
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
              className={"bridge" + (applied ? " applied" : "")}
              onClick={() => b.bridgeDays.forEach((iso) => {
                // toggle to applied state — only add if not present
                if (applied) onToggleDay(iso);else
                if (!vac[iso]) onToggleDay(iso);
              })}
              title={applied ? "Bereits eingetragen — Klick zum Entfernen" : "Klick zum Eintragen"}>
              
              <span className="b-date">{b.label}</span>
              <span className="b-name">{b.holidayName}</span>
              <span className="b-ratio">
                {b.bridgeDays.length}→{b.totalOff} Tage
              </span>
            </div>);

        })}
      </div>
    </section>);

}

function Legend({ onReset }) {
  return (
    <div className="legend">
      <span><span className="swatch sw-urlaub"></span>Urlaub</span>
      <span><span className="swatch sw-hol"></span>Feiertag</span>
      <span><span className="swatch sw-we"></span>Wochenende</span>
      <span><span className="swatch sw-today"></span>Heute</span>
      <div className="actions">
        <button onClick={onReset}>Jahr zurücksetzen</button>
        <button onClick={() => window.print()}>Drucken</button>
      </div>
    </div>);

}

function Colophon({ year, state }) {
  return (
    <div className="colophon">
      <span>§ Daten lokal im Browser gespeichert</span>
      <span>Urlaubsplaner · {year} · {state}</span>
    </div>);

}

// ===== Bridge-day computation =====

function computeBridges(year, holidayMap, vac) {
  // For each holiday that falls on Tue/Wed/Thu, suggest bridge day(s)
  // that connect to the weekend.
  const results = [];
  const holDates = [...holidayMap.entries()].map(([iso, name]) => {
    const [y, m, d] = iso.split("-").map(Number);
    return { iso, name, date: new Date(y, m - 1, d) };
  }).filter((h) => h.date.getFullYear() === year);

  function isOff(date) {
    const iso = isoOf(date.getFullYear(), date.getMonth(), date.getDate());
    const dow = dowMonFirst(date);
    return dow >= 5 || holidayMap.has(iso);
  }

  function addDays(date, n) {
    const r = new Date(date);
    r.setDate(r.getDate() + n);
    return r;
  }

  for (const h of holDates) {
    const dow = dowMonFirst(h.date); // Mon=0
    if (dow === 0) {
      // Monday holiday — already long weekend; suggest Tue bridge → 4 off if Wed isn't off
      const tue = addDays(h.date, 1);
      if (!isOff(tue)) {
        results.push(makeBridge(h, [tue], holidayMap));
      }
    } else if (dow === 4) {
      // Friday holiday — already long weekend; suggest Thu bridge
      const thu = addDays(h.date, -1);
      if (!isOff(thu)) {
        results.push(makeBridge(h, [thu], holidayMap));
      }
    } else if (dow === 1) {
      // Tuesday — bridge Mon
      const mon = addDays(h.date, -1);
      if (!isOff(mon)) results.push(makeBridge(h, [mon], holidayMap));
    } else if (dow === 3) {
      // Thursday — bridge Fri
      const fri = addDays(h.date, 1);
      if (!isOff(fri)) results.push(makeBridge(h, [fri], holidayMap));
    } else if (dow === 2) {
      // Wednesday — bridge Mon+Tue OR Thu+Fri (offer the shorter side as 2-bridge)
      const mon = addDays(h.date, -2);
      const tue = addDays(h.date, -1);
      const thu = addDays(h.date, 1);
      const fri = addDays(h.date, 2);
      if (!isOff(mon) && !isOff(tue)) results.push(makeBridge(h, [mon, tue], holidayMap));
      if (!isOff(thu) && !isOff(fri)) results.push(makeBridge(h, [thu, fri], holidayMap));
    }
  }

  // Sort by ratio (off-days gained / bridge days), then by date
  results.sort((a, b) => {
    const ra = a.totalOff / a.bridgeDays.length;
    const rb = b.totalOff / b.bridgeDays.length;
    if (rb !== ra) return rb - ra;
    return a.bridgeDays[0].localeCompare(b.bridgeDays[0]);
  });
  return results;
}

function makeBridge(holiday, bridgeDates, holidayMap) {
  const bridgeISOs = bridgeDates.map((d) => isoOf(d.getFullYear(), d.getMonth(), d.getDate()));
  // Compute consecutive off-stretch around the bridge days
  const all = new Set(bridgeISOs);
  // Walk backward and forward from min date counting off-days
  const dates = bridgeDates.slice().sort((a, b) => a - b);
  const minD = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxD = new Date(Math.max(...dates.map((d) => d.getTime())));

  function dowF(date) {return dowMonFirst(date);}
  function isoF(date) {return isoOf(date.getFullYear(), date.getMonth(), date.getDate());}
  function offWithBridge(date) {
    return all.has(isoF(date)) || dowF(date) >= 5 || holidayMap.has(isoF(date));
  }

  let count = 0;
  // include the bridge span itself + the holiday
  // we treat the holiday as off
  const holidayDate = new Date(holiday.iso.split("-")[0], Number(holiday.iso.split("-")[1]) - 1, Number(holiday.iso.split("-")[2]));
  // Combine all "off" days into a window
  const start = new Date(Math.min(minD.getTime(), holidayDate.getTime()));
  const end = new Date(Math.max(maxD.getTime(), holidayDate.getTime()));

  // Walk back from start
  let s = new Date(start);
  while (true) {
    const prev = new Date(s);prev.setDate(prev.getDate() - 1);
    if (offWithBridge(prev)) s = prev;else break;
  }
  let e = new Date(end);
  while (true) {
    const nxt = new Date(e);nxt.setDate(nxt.getDate() + 1);
    if (offWithBridge(nxt)) e = nxt;else break;
  }
  // Count days between s and e inclusive that are off
  let cursor = new Date(s);
  while (cursor <= e) {
    if (offWithBridge(cursor)) count++;
    cursor.setDate(cursor.getDate() + 1);
  }

  // Date label
  const fmt = (d) => `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.`;
  const label = bridgeDates.length === 1 ?
  fmt(bridgeDates[0]) :
  `${fmt(bridgeDates[0])}–${fmt(bridgeDates[bridgeDates.length - 1])}`;

  return {
    id: `${holiday.iso}-${bridgeISOs.join("|")}`,
    holidayName: holiday.name,
    bridgeDays: bridgeISOs,
    totalOff: count,
    label
  };
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);