import express from 'express';

// serves dist/ and proxies the Air Quality Egg API so the key stays server-side.
// EGG_SERIAL and EGG_API_KEY live in the host's environment (Railway), never in the repo.
const app = express();
const CACHE_MS = 5 * 60_000; // the Egg reports ~every minute; 15-min buckets make 5 min plenty
let cache = { t: 0, data: null };

app.get('/api/aqi', async (_req, res) => {
  if (!process.env.EGG_SERIAL || !process.env.EGG_API_KEY) {
    res.status(503).json({ error: 'sensor proxy not configured' });
    return;
  }
  try {
    if (!cache.data || Date.now() - cache.t > CACHE_MS) {
      // EGG_SERIAL may be a comma-separated list; the API batches them in one call.
      // dur is only valid with an anchor date (422 otherwise)
      const serials = process.env.EGG_SERIAL.split(',').map((x) => x.trim()).filter(Boolean);
      const url =
        `https://airqualityegg.com/api/v2/messages/device/${serials.join(',')}` +
        `?dur=P1D&end-date=${new Date().toISOString()}&reduced=1&grouped=1&apiKey=${process.env.EGG_API_KEY}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`upstream ${r.status}`);
      const raw = await r.json();
      // re-key each egg by its position in EGG_SERIAL (egg1, egg2, ...) so the
      // client references stable slots and never sees the serial numbers
      const data = Object.fromEntries(
        serials.map((sn, i) => {
          const k = Object.keys(raw ?? {}).find((x) => x.toLowerCase() === sn.toLowerCase());
          return [`egg${i + 1}`, k ? raw[k] : null];
        }),
      );
      cache = { t: Date.now(), data };
    }
    res.set('cache-control', 'public, max-age=60');
    res.json(cache.data);
  } catch (err) {
    if (cache.data) {
      res.json(cache.data); // stale beats nothing
      return;
    }
    res.status(502).json({ error: String(err) });
  }
});

app.use(express.static('dist', { etag: true }));
app.use((_req, res) => res.sendFile('index.html', { root: 'dist' }));

app.listen(process.env.PORT ?? 4173);
