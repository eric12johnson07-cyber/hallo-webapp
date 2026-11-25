// Minimale Webapplikation: Begrüssung, Besucherzähler aus PostgreSQL, DB-Status, Commit-Hash
const http = require("http");
const { Pool } = require("pg");

const PORT = process.env.PORT || 3000;
const NAME = process.env.APP_NAME || "Eric";
// Render setzt RENDER_GIT_COMMIT automatisch; GIT_COMMIT als Fallback für andere Plattformen
const COMMIT = (process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || "unbekannt").slice(0, 7);

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
      max: 3,
    })
  : null;

async function initDb() {
  if (!pool) return;
  await pool.query(
    "CREATE TABLE IF NOT EXISTS visits (id SERIAL PRIMARY KEY, visited_at TIMESTAMPTZ NOT NULL DEFAULT now())"
  );
}

async function countVisit() {
  if (!pool) return { connected: false, nr: null };
  try {
    const r = await pool.query("INSERT INTO visits DEFAULT VALUES RETURNING id");
    return { connected: true, nr: r.rows[0].id };
  } catch (err) {
    console.error("DB-Fehler:", err.message);
    return { connected: false, nr: null };
  }
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const server = http.createServer(async (req, res) => {
  if (req.url === "/healthz") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    return res.end("ok");
  }
  if (req.url !== "/") {
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("Not found");
  }
  const { connected, nr } = await countVisit();
  const line = `Hallo von ${esc(NAME)} – Besucher Nr. ${nr ?? "–"} – DB: ${connected ? "verbunden" : "nicht verbunden"} – Version: ${esc(COMMIT)}`;
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(`<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Hallo von ${esc(NAME)}</title>
<style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#f4f4f4}p{font-size:1.4rem;background:#fff;padding:1.5rem 2rem;border-radius:8px;box-shadow:0 1px 4px #0002}</style>
</head><body><p>${line}</p></body></html>`);
});

initDb()
  .catch((err) => console.error("DB-Init fehlgeschlagen:", err.message))
  .finally(() => server.listen(PORT, () => console.log(`Läuft auf Port ${PORT}, Version ${COMMIT}`)));
