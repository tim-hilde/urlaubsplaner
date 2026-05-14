// German public holidays per Bundesland.
// Returns Map<"YYYY-MM-DD", "Holiday Name"> for a given year + state code.

(function () {
  const STATES = [
    ["BW", "Baden-Württemberg"],
    ["BY", "Bayern"],
    ["BE", "Berlin"],
    ["BB", "Brandenburg"],
    ["HB", "Bremen"],
    ["HH", "Hamburg"],
    ["HE", "Hessen"],
    ["MV", "Mecklenburg-Vorpommern"],
    ["NI", "Niedersachsen"],
    ["NW", "Nordrhein-Westfalen"],
    ["RP", "Rheinland-Pfalz"],
    ["SL", "Saarland"],
    ["SN", "Sachsen"],
    ["ST", "Sachsen-Anhalt"],
    ["SH", "Schleswig-Holstein"],
    ["TH", "Thüringen"],
  ];

  // Anonymous Gregorian / Meeus algorithm
  function easterSunday(y) {
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

  function addDays(d, n) {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  }

  function key(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  // Buß- und Bettag = Wednesday before Nov 23
  function bussUndBettag(y) {
    const ref = new Date(y, 10, 23); // Nov 23
    const dow = ref.getDay(); // 0=Sun..6=Sat
    // back to previous Wednesday
    const diff = ((dow - 3 + 7) % 7) || 7;
    return addDays(ref, -diff);
  }

  function holidays(year, state) {
    const easter = easterSunday(year);
    const map = new Map();
    const add = (d, name) => map.set(key(d), name);

    // Nationwide
    add(new Date(year, 0, 1), "Neujahr");
    add(addDays(easter, -2), "Karfreitag");
    add(addDays(easter, 1), "Ostermontag");
    add(new Date(year, 4, 1), "Tag der Arbeit");
    add(addDays(easter, 39), "Christi Himmelfahrt");
    add(addDays(easter, 50), "Pfingstmontag");
    add(new Date(year, 9, 3), "Tag der Deutschen Einheit");
    add(new Date(year, 11, 25), "1. Weihnachtstag");
    add(new Date(year, 11, 26), "2. Weihnachtstag");

    // Heilige Drei Könige: BW, BY, ST
    if (["BW", "BY", "ST"].includes(state)) {
      add(new Date(year, 0, 6), "Heilige Drei Könige");
    }

    // Internationaler Frauentag: BE (since 2019), MV (since 2023)
    if (state === "BE" && year >= 2019) {
      add(new Date(year, 2, 8), "Internationaler Frauentag");
    }
    if (state === "MV" && year >= 2023) {
      add(new Date(year, 2, 8), "Internationaler Frauentag");
    }

    // Fronleichnam: BW, BY, HE, NW, RP, SL (+ teilw. SN, TH)
    if (["BW", "BY", "HE", "NW", "RP", "SL"].includes(state)) {
      add(addDays(easter, 60), "Fronleichnam");
    }

    // Mariä Himmelfahrt: SL (BY teilweise — vereinfacht: nicht gesetzlich landesweit)
    if (state === "SL") {
      add(new Date(year, 7, 15), "Mariä Himmelfahrt");
    }

    // Weltkindertag: TH (ab 2019)
    if (state === "TH" && year >= 2019) {
      add(new Date(year, 8, 20), "Weltkindertag");
    }

    // Reformationstag: BB, MV, SN, ST, TH (immer); HB, HH, NI, SH (ab 2018)
    if (
      ["BB", "MV", "SN", "ST", "TH"].includes(state) ||
      (["HB", "HH", "NI", "SH"].includes(state) && year >= 2018)
    ) {
      add(new Date(year, 9, 31), "Reformationstag");
    }

    // Allerheiligen: BW, BY, NW, RP, SL
    if (["BW", "BY", "NW", "RP", "SL"].includes(state)) {
      add(new Date(year, 10, 1), "Allerheiligen");
    }

    // Buß- und Bettag: SN
    if (state === "SN") {
      add(bussUndBettag(year), "Buß- und Bettag");
    }

    return map;
  }

  window.HolidaysDE = { holidays, STATES };
})();
