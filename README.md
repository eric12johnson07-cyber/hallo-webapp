# Übung Webapplikation – Deployment-Anleitung

**Ziel:** Öffentlich über HTTPS erreichbar, Anzeige:
`Hallo von Eric – Besucher Nr. [aus DB] – DB: verbunden – Version: [Commit-Hash]`

## Architektur

| Baustein | Lösung |
|---|---|
| Code-Repository | GitHub (öffentlich oder privat) |
| Hosting | Render.com Web Service (Free) |
| Datenbank | Render PostgreSQL (Free) |
| HTTPS | automatisch durch Render (Let's Encrypt) |
| Version | Render setzt `RENDER_GIT_COMMIT` bei jedem Deploy |
| Infrastruktur als Code | `render.yaml` (Blueprint) |

Ablauf: Push auf GitHub → Render baut automatisch (`npm install`) → startet `node server.js` → prüft `/healthz` → schaltet die neue Version live.

## Dateien

- `server.js` – App: zählt jeden Aufruf von `/` mit einem INSERT in die Tabelle `visits`, liest den Commit-Hash aus der Umgebung
- `package.json` – einzige Abhängigkeit: `pg` (PostgreSQL-Treiber)
- `render.yaml` – legt Web Service + Datenbank an und verbindet sie über `DATABASE_URL`
- `.gitignore`

## Schritte (du klickst, du schreibst nichts)

1. **GitHub-Repo anlegen:** github.com → *New repository* → Name `hallo-webapp` → *Create*.
2. **Dateien hochladen:** im Repo *Add file → Upload files* → alle vier Dateien + README reinziehen → *Commit changes*.
3. **Render-Konto:** render.com → *Sign up with GitHub*.
4. **Blueprint deployen:** Render-Dashboard → *New → Blueprint* → Repo `hallo-webapp` wählen → Render liest `render.yaml` und zeigt **hallo-db** und **hallo-eric** → *Apply*.
5. **Warten**, bis beide grün sind (DB ca. 1–2 Min., Web Service ca. 2–4 Min.).
6. **URL öffnen:** beim Service *hallo-eric* oben die URL `https://hallo-eric-xxxx.onrender.com`.

## Abnahme (deine Prüfung)

| # | Prüfpunkt | Erwartung |
|---|---|---|
| 1 | URL beginnt mit `https://`, Schloss im Browser | ✔ |
| 2 | Text „Hallo von Eric“ | ✔ |
| 3 | Seite neu laden → Besucher-Nr. steigt um 1 | Zähler kommt aus der DB |
| 4 | „DB: verbunden“ | ✔ |
| 5 | Version = erste 7 Zeichen des letzten Commits auf GitHub | stimmt überein |
| 6 | `…/healthz` liefert `ok` | ✔ |
| 7 | Änderung committen (z. B. README) → Render deployt neu → Version wechselt, Zähler bleibt erhalten | beweist CI/CD + Persistenz |

## Bekannte Einschränkungen (Free-Plan)

- Web Service schläft nach 15 Min. ohne Zugriff; erster Aufruf dauert dann ca. 30–60 s.
- Free-PostgreSQL läuft nach 30 Tagen ab – für die Übung ausreichend.
- Fehlt die DB, zeigt die App „DB: nicht verbunden“ statt abzustürzen.
