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
