import { useEffect, useMemo, useState } from 'react';
import { RESIPLE, MANTI } from './theme';

// ACTIVE SENSORS - the /api/aqi proxy (server.mjs) passes through the Egg API's
// reduced+grouped JSON. Shape-tolerant on purpose: a portal-side format tweak
// should degrade to "no chart", not a crash.
interface EggPoint { t: number; v: number }

function eggSeries(raw: unknown): { key: string; points: EggPoint[] }[] {
  let obj = raw as Record<string, unknown> | null;
  // unwrap single-key wrappers (e.g. keyed by serial number)
  while (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    const keys = Object.keys(obj);
    const inner = keys.length === 1 ? obj[keys[0]] : null;
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) obj = inner as Record<string, unknown>;
    else break;
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [];
  const out: { key: string; points: EggPoint[] }[] = [];
  const BUCKET = 15 * 60_000; // the API returns ~1-minute raw samples; average to the 15-minute readings the page promises
  for (const [key, val] of Object.entries(obj)) {
    if (!Array.isArray(val)) continue;
    const raw = (val as { t?: string; time?: string; date?: string; v?: unknown; value?: unknown }[])
      .map((p) => ({ t: Date.parse(p?.t ?? p?.time ?? p?.date ?? ''), v: Number(p?.v ?? p?.value) }))
      .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.v))
      .sort((a, b) => a.t - b.t);
    const buckets = new Map<number, { sum: number; n: number }>();
    for (const p of raw) {
      const b = Math.floor(p.t / BUCKET);
      const cur = buckets.get(b) ?? { sum: 0, n: 0 };
      cur.sum += p.v;
      cur.n += 1;
      buckets.set(b, cur);
    }
    const points = [...buckets.entries()].map(([b, { sum, n }]) => ({ t: b * BUCKET + BUCKET / 2, v: sum / n }));
    if (points.length > 1) out.push({ key: key.toLowerCase(), points });
  }
  return out;
}

// channels rendered in this order when present in the feed. PM readings in clean
// air sit near 0 and quantize in ~0.1 steps, so those charts pin the baseline to
// 0 with a minimum y-span instead of autoscaling the noise to full height.
const EGG_CHANNELS: { key: string; label: string; unit: string; scale?: number; y0?: number; minSpan?: number }[] = [
  { key: 'pm2p5', label: 'PM2.5', unit: 'µg/m³', y0: 0, minSpan: 5 },
  // pm10p0 isn't charted but still feeds the AQI badge via AQI_BP
  { key: 'pm1p0', label: 'PM1.0', unit: 'µg/m³', y0: 0, minSpan: 5 },
  { key: 'co2', label: 'CO2', unit: 'ppm' },
  { key: 'no2', label: 'NO2', unit: 'ppb' },
  { key: 'o3', label: 'O3', unit: 'ppb' },
  { key: 'so2', label: 'SO2', unit: 'ppb' },
  { key: 'co', label: 'CO', unit: 'ppm' },
  { key: 'temperature', label: 'Temperature', unit: '°C' },
  { key: 'humidity', label: 'Humidity', unit: '%' },
  { key: 'pressure', label: 'Pressure', unit: 'hPa', scale: 0.01 }, // Egg reports Pa
];

// US EPA AQI breakpoints [Clow, Chigh, Ilow, Ihigh] (2024 PM2.5 revision).
// Gas breakpoints are the EPA 8h (O3, CO) / 1h (NO2, SO2) tables applied to
// instantaneous readings, same simplification the PM badge already makes.
const AQI_BP: Record<string, number[][]> = {
  pm2p5: [[0, 9, 0, 50], [9.1, 35.4, 51, 100], [35.5, 55.4, 101, 150], [55.5, 125.4, 151, 200], [125.5, 225.4, 201, 300], [225.5, 325.4, 301, 500]],
  pm10p0: [[0, 54, 0, 50], [55, 154, 51, 100], [155, 254, 101, 150], [255, 354, 151, 200], [355, 424, 201, 300], [425, 604, 301, 500]],
  o3: [[0, 54, 0, 50], [55, 70, 51, 100], [71, 85, 101, 150], [86, 105, 151, 200], [106, 200, 201, 300], [201, 604, 301, 500]],
  no2: [[0, 53, 0, 50], [54, 100, 51, 100], [101, 360, 101, 150], [361, 649, 151, 200], [650, 1249, 201, 300], [1250, 2049, 301, 500]],
  so2: [[0, 35, 0, 50], [36, 75, 51, 100], [76, 185, 101, 150], [186, 304, 151, 200], [305, 604, 201, 300], [605, 1004, 301, 500]],
  co: [[0, 4.4, 0, 50], [4.5, 9.4, 51, 100], [9.5, 12.4, 101, 150], [12.5, 15.4, 151, 200], [15.5, 30.4, 201, 300], [30.5, 50.4, 301, 500]],
};

function aqiFrom(conc: number, bp: number[][]): number {
  const [cl, ch, il, ih] = bp.find(([lo, hi]) => conc >= lo && conc <= hi) ?? bp[bp.length - 1];
  return Math.round(il + ((Math.min(conc, ch) - cl) / (ch - cl)) * (ih - il));
}

const AQI_CATS: readonly (readonly [number, string, string])[] = [
  [50, 'Good', '#00e400'],
  [100, 'Moderate', '#ffff00'],
  [150, 'Unhealthy for Sensitive Groups', '#ff7e00'],
  [200, 'Unhealthy', '#ff0000'],
  [300, 'Very Unhealthy', '#8f3f97'],
  [Infinity, 'Hazardous', '#7e0023'],
];
const aqiCat = (aqi: number) => AQI_CATS.find(([max]) => aqi <= max)!;

type Rating = (v: number) => readonly [number, string, string];
// every channel with an EPA AQI standard gets a badge; PM1.0, CO2, and the
// weather channels have no standard, so they stay unrated
const RATINGS: Record<string, Rating> = Object.fromEntries(
  Object.keys(AQI_BP).map((k) => [k, (v: number) => aqiCat(aqiFrom(v, AQI_BP[k]))]),
);

const fmtVal = (v: number) => (Math.abs(v) >= 100 ? Math.round(v).toLocaleString() : v.toFixed(1));
// "PM2.5" -> PM₂.₅-style label; styled <sub>, since the custom fonts ship no subscript glyphs
const subPM = (label: string) => (label.startsWith('PM') ? <>PM<sub style={{ fontSize: '0.72em' }}>{label.slice(2)}</sub></> : label);
const fmtTime = (t: number) => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

function SensorChart({ label, unit, points, y0, minSpan, rating }: { label: string; unit: string; points: EggPoint[]; y0?: number; minSpan?: number; rating?: Rating }) {
  const [hover, setHover] = useState<number | null>(null);
  const vs = points.map((p) => p.v);
  const min = y0 ?? Math.min(...vs);
  const max = Math.max(...vs);
  const span = Math.max(max - min, minSpan ?? 0) || 1;
  const t0 = points[0].t;
  const t1 = points[points.length - 1].t;
  const tspan = t1 - t0 || 1;
  const X = (p: EggPoint) => ((p.t - t0) / tspan) * 100;
  const Y = (p: EggPoint) => 96 - ((p.v - min) / span) * 88; // 4% pad top/bottom in a 0-100 viewBox
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${X(p).toFixed(2)},${Y(p).toFixed(2)}`).join('');
  const cur = points[points.length - 1];
  const hp = hover != null ? points[hover] : null;

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const t = t0 + ((e.clientX - rect.left) / rect.width) * tspan;
    let best = 0;
    for (let i = 1; i < points.length; i++) if (Math.abs(points[i].t - t) < Math.abs(points[best].t - t)) best = i;
    setHover(best);
  };

  return (
    <div style={{ background: '#141c26', padding: '18px 18px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 }}>
          <div style={{ fontFamily: RESIPLE, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7c909b' }}>{subPM(label)}</div>
          {rating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: RESIPLE, fontSize: 11.5, color: '#a9bcc6', whiteSpace: 'nowrap' }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: rating((hp ?? cur).v)[2], flexShrink: 0 }} />
              {rating((hp ?? cur).v)[1]}
            </div>
          )}
        </div>
        {/* Resiple, not Manti: Manti Sans has no period glyph, so decimals render as tofu */}
        <div style={{ fontFamily: RESIPLE, fontWeight: 700, fontSize: 19, color: '#e6ecf0', whiteSpace: 'nowrap' }}>
          {fmtVal((hp ?? cur).v)} <span style={{ fontSize: 12, fontWeight: 400, color: '#7c909b' }}>{unit}</span>
        </div>
      </div>
      <div
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        style={{ position: 'relative', marginTop: 12, touchAction: 'pan-y' }}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 96 }} aria-label={`${label}, last 24 hours`}>
          <line x1="0" y1="8" x2="100" y2="8" stroke="rgba(255,255,255,0.07)" vectorEffect="non-scaling-stroke" />
          <line x1="0" y1="96" x2="100" y2="96" stroke="rgba(255,255,255,0.07)" vectorEffect="non-scaling-stroke" />
          <path d={`${path}L${X(cur).toFixed(2)},100L${X(points[0]).toFixed(2)},100Z`} fill="rgba(79,174,125,0.12)" stroke="none" />
          <path d={path} fill="none" stroke="#4fae7d" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
          {hp && <line x1={X(hp)} y1="0" x2={X(hp)} y2="100" stroke="rgba(255,255,255,0.25)" vectorEffect="non-scaling-stroke" />}
        </svg>
        {hp && (
          <>
            <div style={{ position: 'absolute', left: `${X(hp)}%`, top: `${Y(hp)}%`, width: 8, height: 8, borderRadius: 999, background: '#4fae7d', border: '2px solid #141c26', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: `${Math.min(82, Math.max(18, X(hp)))}%`, bottom: '104%', transform: 'translateX(-50%)', background: '#1a2530', border: '1px solid rgba(255,255,255,0.12)', padding: '4px 10px', fontFamily: RESIPLE, fontSize: 11.5, color: '#c4d1d9', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
              {fmtVal(hp.v)} {unit} {fmtTime(hp.t)}
            </div>
          </>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: RESIPLE, fontSize: 10.5, letterSpacing: '0.08em', color: '#5f7078' }}>
        <span>{fmtTime(t0)}</span>
        <span>{fmtTime(t1)}</span>
      </div>
    </div>
  );
}

// one card per egg. Ids are the slot names /api/aqi assigns in EGG_SERIAL order,
// so adding an egg = append its serial to EGG_SERIAL on the server + an entry here.
const EGGS = [
  { id: 'egg1', name: 'Snee Egg', location: 'Snee Hall roof' },
  { id: 'egg2', name: 'ELL Egg', location: 'GeoData workbench' },
];

function EggCharts({ series, unit }: { series: { key: string; points: EggPoint[] }[]; unit: 'C' | 'F' }) {
  const newest = Math.max(...series.map((s) => s.points[s.points.length - 1].t));
  const live = Date.now() - newest < 45 * 60_000;
  const charts = EGG_CHANNELS.map((c) => ({ ...c, series: series.find((s) => s.key === c.key) })).filter((c) => c.series);
  // EPA AQI is defined on the 24h mean; take the worse of the PM2.5/PM10 sub-indices
  const aqis = (['pm2p5', 'pm10p0'] as const).flatMap((k) => {
    const s = series.find((x) => x.key === k);
    return s ? [aqiFrom(s.points.reduce((a, p) => a + p.v, 0) / s.points.length, AQI_BP[k])] : [];
  });
  const aqi = aqis.length ? Math.max(...aqis) : null;
  const cat = aqi != null ? aqiCat(aqi) : null;
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 22px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: RESIPLE, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: live ? '#4fae7d' : '#7c909b' }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: live ? '#4fae7d' : '#5f7078' }} />
          {live ? 'Live' : 'Offline'} updated {fmtTime(newest)}
        </div>
        {aqi != null && cat && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: RESIPLE, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c4d1d9' }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: cat[2] }} />
            US AQI {aqi} {cat[1]}
          </div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(280px,100%),1fr))', gap: 18, marginTop: 24 }}>
        {charts.map((c) => {
          let points = c.scale ? c.series!.points.map((p) => ({ t: p.t, v: p.v * c.scale! })) : c.series!.points;
          let chartUnit = c.unit;
          if (c.key === 'temperature' && unit === 'F') {
            points = points.map((p) => ({ t: p.t, v: (p.v * 9) / 5 + 32 }));
            chartUnit = '°F';
          }
          return <SensorChart key={c.key} label={c.label} unit={chartUnit} points={points} y0={c.y0} minSpan={c.minSpan} rating={RATINGS[c.key]} />;
        })}
      </div>
    </div>
  );
}

export function SensorsFeed() {
  const [state, setState] = useState<
    { status: 'loading' } | { status: 'error' } | { status: 'ready'; raw: Record<string, unknown> }
  >({ status: 'loading' });
  const [unit, setUnit] = useState<'C' | 'F'>('C');

  useEffect(() => {
    let alive = true;
    fetch('/api/aqi')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((raw) => alive && setState({ status: 'ready', raw: (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown> }))
      .catch(() => alive && setState({ status: 'error' }));
    return () => {
      alive = false;
    };
  }, []);

  // parsing the multi-MB feed is expensive - do it once per fetch, not per render
  const parsed = useMemo(
    () => Object.fromEntries(EGGS.map((egg) => [egg.id, state.status === 'ready' ? eggSeries(state.raw[egg.id]) : []])),
    [state],
  );

  return (
    <>
      {/* the °C/°F toggle sits OUTSIDE the <details>, overlaid on the summary
          row - inside it, a near-miss click collapses the whole section */}
      <div style={{ position: 'relative', marginTop: 32 }}>
      <details open>
        <summary style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minHeight: 37, fontFamily: RESIPLE, fontSize: 14, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6d9dcd' }}>
          Air Quality
        </summary>
        {EGGS.map((egg) => {
          const series = parsed[egg.id];
          return (
            <details key={egg.id} open style={{ background: '#141c26', border: '1px solid #6d9dcd', padding: 'clamp(20px,3.5vw,36px)', marginTop: 24 }}>
              <summary style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '8px 18px' }}>
                <span className="chev" style={{ color: '#7c909b', alignSelf: 'center' }} />
                <h3 style={{ fontFamily: MANTI, fontWeight: 700, fontSize: 'clamp(24px,3vw,32px)', letterSpacing: '-0.015em', margin: 0 }}>{egg.name}</h3>
                <span style={{ fontFamily: RESIPLE, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7c909b' }}>{egg.location}</span>
              </summary>
              <div style={{ marginTop: 28 }}>
                {state.status === 'loading' ? (
                  <div style={{ fontFamily: RESIPLE, fontSize: 14.5, color: '#7c909b' }}>Contacting the egg…</div>
                ) : series.length === 0 ? (
                  <div style={{ fontFamily: RESIPLE, fontSize: 14.5, color: '#7c909b' }}>The sensor feed is offline right now. Check back soon.</div>
                ) : (
                  <EggCharts series={series} unit={unit} />
                )}
              </div>
            </details>
          );
        })}
      </details>
      <div style={{ position: 'absolute', top: 0, right: 0, display: 'inline-flex', border: '2px solid rgba(255,255,255,0.3)', overflow: 'hidden' }}>
        {(['C', 'F'] as const).map((u) => (
          <button key={u} onClick={() => setUnit(u)} style={{ appearance: 'none', border: 'none', cursor: 'pointer', padding: '8px 18px', fontFamily: RESIPLE, fontSize: 14, letterSpacing: '0.1em', background: unit === u ? '#4fae7d' : 'transparent', color: unit === u ? '#0e141c' : '#7c909b' }}>
            °{u}
          </button>
        ))}
      </div>
      </div>
    </>
  );
}
