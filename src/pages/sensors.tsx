import { useEffect, useMemo, useRef, useState } from 'react';
import { RESIPLE, MANTI, H2, SUBPAGE } from '../styles/theme';
import soilArchive from '../data/soil-archive.json';

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
  for (const [key, val] of Object.entries(obj)) {
    if (!Array.isArray(val)) continue;
    // the Egg reports ~every minute; charts show one sample per 5-minute bucket.
    // no averaging - the kept sample's noise is the instrument's real behaviour
    const points = (val as { t?: string; time?: string; date?: string; v?: unknown; value?: unknown }[])
      .map((p) => ({ t: Date.parse(p?.t ?? p?.time ?? p?.date ?? ''), v: Number(p?.v ?? p?.value) }))
      .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.v))
      .sort((a, b) => a.t - b.t)
      .filter((p, i, a) => i === 0 || Math.floor(p.t / 300_000) !== Math.floor(a[i - 1].t / 300_000));
    if (points.length > 1) out.push({ key: key.toLowerCase(), points });
  }
  return out;
}

// channels rendered in this order when present in the feed. PM readings in clean
// air sit near 0 and quantize in ~0.1 steps, so those charts pin the baseline to
// 0 with a minimum y-span instead of autoscaling the noise to full height.
const EGG_CHANNELS: { key: string; label: string; unit: string; scale?: (v: number) => number; y0?: number; minSpan?: number; epaBands?: boolean }[] = [
  { key: 'pm2p5', label: 'PM2.5', unit: 'µg/m³', epaBands: true },
  // pm10p0 isn't charted but still feeds the AQI badge via AQI_BP
  { key: 'pm1p0', label: 'PM1.0', unit: 'µg/m³', y0: 0, minSpan: 15 },
  // minSpan keeps a channel's ordinary wiggle from autoscaling to full height:
  // the plot only stretches when something actually happens
  { key: 'co2', label: 'CO2', unit: 'ppm', minSpan: 80 },
  { key: 'no2', label: 'NO2', unit: 'ppb', y0: 0, minSpan: 50 },
  { key: 'o3', label: 'O3', unit: 'ppb', y0: 0, minSpan: 50 },
  { key: 'so2', label: 'SO2', unit: 'ppb', y0: 0, minSpan: 30 },
  { key: 'co', label: 'CO', unit: 'ppm', y0: 0, minSpan: 4 },
  { key: 'temperature', label: 'Temperature', unit: '°C', minSpan: 6 },
  { key: 'humidity', label: 'Humidity', unit: '%', minSpan: 15 },
  // the Egg has reported pressure in Pa on older firmware and hPa on current, so pick
  // by magnitude: station pressure is ~1013 hPa at sea level and never near 10,000.
  { key: 'pressure', label: 'Pressure', unit: 'hPa', scale: (v) => (v > 10_000 ? v / 100 : v) },
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
const fmtDay = (t: number) => new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric' });
const fmtMoYr = (t: number) => new Date(t).toLocaleDateString([], { month: 'short', year: 'numeric' });
const fmtTick = (v: number) => (Math.abs(v % 1) < 1e-9 ? Math.round(v).toLocaleString() : v.toFixed(1));

// plain white figure plate inset into the dark page: the chrome wears the brand,
// the measurement is printed like a journal figure
const PLATE = { paper: '#ffffff', rule: '#333333', grid: '#e7e7e7', ink: '#111111', muted: '#555555' };
// the PM2.5 y-axis is anchored to the EPA health scale (top of the Moderate band);
// the 9 µg/m³ standard itself is explained in the plate's footnote
const PM_TOP = 35.4;

// round tick values on a 1-2-5 ladder, so the axis reads in numbers a person
// would choose, never in data-derived extremes
function niceTicks(lo: number, hi: number, n = 4): number[] {
  const span = hi - lo || 1;
  const mag = 10 ** Math.floor(Math.log10(span / n));
  const step = [1, 2, 5, 10].map((c) => c * mag).find((s) => span / s <= n) ?? 10 * mag;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-6; v += step) out.push(v);
  return out;
}

const CHART_H = 172;
const M = { l: 46, r: 18, t: 10, b: 24 };

function SensorChart({ label, unit, points, y0, minSpan, epaBands, rating, accent = '#6d9dcd' }: { label: string; unit: string; points: EggPoint[]; y0?: number; minSpan?: number; epaBands?: boolean; rating?: Rating; accent?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  // real pixel coordinates: the path is regenerated at the measured width, so the
  // geometry is never non-uniformly stretched and slope means rate of change
  const [w, setW] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setW(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const vs = points.map((p) => p.v);
  const dmin = Math.min(...vs);
  const dmax = Math.max(...vs);
  let lo: number, hi: number;
  if (epaBands) {
    // anchored to the health scale, expanding only if readings exceed Moderate
    lo = 0;
    hi = Math.max(PM_TOP, dmax * 1.05);
  } else if (y0 != null) {
    lo = y0;
    hi = y0 + (Math.max(dmax - y0, minSpan ?? 0) || 1) * 1.08;
  } else {
    const pad = Math.max((dmax - dmin) * 0.15, (minSpan ?? 0) / 2, 1e-9);
    lo = dmin - pad;
    hi = dmax + pad;
  }
  const t0 = points[0].t;
  const t1 = points[points.length - 1].t;
  const tspan = t1 - t0 || 1;
  const plotW = Math.max(w - M.l - M.r, 1);
  const plotH = CHART_H - M.t - M.b;
  const X = (t: number) => M.l + ((t - t0) / tspan) * plotW;
  const Y = (v: number) => M.t + (1 - (v - lo) / (hi - lo)) * plotH;
  // no line across a data gap: a step far beyond the series' own cadence starts
  // a new segment, so outages read as blank stretches
  const dts = points.slice(1).map((p, i) => p.t - points[i].t).sort((a, b) => a - b);
  const gapMs = 5 * (dts[Math.floor(dts.length / 2)] || Infinity);
  const path = points.map((p, i) => `${i && p.t - points[i - 1].t <= gapMs ? 'L' : 'M'}${X(p.t).toFixed(1)},${Y(p.v).toFixed(1)}`).join('');
  const cur = points[points.length - 1];
  const hp = hover != null ? points[hover] : null;
  const ticks = niceTicks(lo, hi);

  // x ticks on 6h boundaries; the midnight rule runs the full plot and carries the
  // date. Past ~3 days the 6h grid overcrowds, so ticks step in whole days instead.
  const xticks: { t: number; midnight: boolean }[] = [];
  const spanDays = tspan / 86_400_000;
  const first = new Date(t0);
  first.setMinutes(0, 0, 0);
  if (spanDays > 3) {
    const stepDays = Math.ceil(spanDays / 6);
    first.setHours(24); // next midnight
    for (let d = new Date(first); d.getTime() <= t1; d.setDate(d.getDate() + stepDays)) xticks.push({ t: d.getTime(), midnight: true });
  } else {
    const step6h = 6 * 3600_000;
    first.setHours(Math.ceil(first.getHours() / 6) * 6);
    for (let t = first.getTime(); t <= t1; t += step6h) xticks.push({ t, midnight: new Date(t).getHours() === 0 });
  }

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const t = t0 + ((e.clientX - rect.left - M.l) / plotW) * tspan;
    let best = 0;
    for (let i = 1; i < points.length; i++) if (Math.abs(points[i].t - t) < Math.abs(points[best].t - t)) best = i;
    setHover(best);
  };

  return (
    <div style={{ background: PLATE.paper, border: `3px solid ${accent}`, padding: '16px 18px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 }}>
          <div style={{ fontFamily: RESIPLE, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: PLATE.ink, whiteSpace: 'nowrap' }}>
            {subPM(label)} <span style={{ textTransform: 'none', letterSpacing: 0, color: PLATE.muted }}>({unit})</span>
          </div>
          {rating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: RESIPLE, fontSize: 11.5, color: PLATE.muted, whiteSpace: 'nowrap' }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: rating((hp ?? cur).v)[2], border: '1px solid rgba(0,0,0,0.2)', flexShrink: 0 }} />
              {rating((hp ?? cur).v)[1]}{epaBands && '*'}
            </div>
          )}
        </div>
        {hp && (
          <div style={{ fontFamily: RESIPLE, fontSize: 12, color: PLATE.muted, whiteSpace: 'nowrap' }}>
            {fmtVal(hp.v)} at {fmtTime(hp.t)}
          </div>
        )}
      </div>
      <div
        ref={wrapRef}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        style={{ position: 'relative', marginTop: 8, touchAction: 'pan-y' }}
      >
        <svg width={w || '100%'} height={CHART_H} style={{ display: 'block' }} aria-label={`${label} history`}>
          {w > 0 && (
            <>
              {ticks.map((v) => (
                <g key={v}>
                  <line x1={M.l} x2={M.l + plotW} y1={Y(v)} y2={Y(v)} stroke={PLATE.grid} strokeWidth={1} />
                  <text x={M.l - 7} y={Y(v)} fontSize={10.5} fill={PLATE.muted} textAnchor="end" dominantBaseline="middle" fontFamily="Resiple, sans-serif">{fmtTick(v)}</text>
                </g>
              ))}
              {xticks.map(({ t, midnight }) => (
                <g key={t}>
                  <line x1={X(t)} x2={X(t)} y1={M.t + plotH} y2={M.t + plotH + 4} stroke={PLATE.rule} strokeWidth={1} />
                  <text x={X(t)} y={CHART_H - 7} fontSize={10} fill={PLATE.muted} textAnchor="middle" fontFamily="Resiple, sans-serif">
                    {spanDays > 300 ? fmtMoYr(t) : midnight ? fmtDay(t) : fmtTime(t)}
                  </text>
                </g>
              ))}
              {/* the measurement frame: a real L-axis, not floating hairlines */}
              <line x1={M.l} x2={M.l} y1={M.t} y2={M.t + plotH} stroke={PLATE.rule} strokeWidth={1.2} />
              <line x1={M.l} x2={M.l + plotW} y1={M.t + plotH} y2={M.t + plotH} stroke={PLATE.rule} strokeWidth={1.2} />
              <path d={path} fill="none" stroke={PLATE.ink} strokeWidth={1.4} />
              {hp && (
                <>
                  <line x1={X(hp.t)} x2={X(hp.t)} y1={M.t} y2={M.t + plotH} stroke={PLATE.ink} strokeWidth={0.8} opacity={0.35} />
                  <circle cx={X(hp.t)} cy={Y(hp.v)} r={3.2} fill={PLATE.ink} stroke={PLATE.paper} strokeWidth={1.5} />
                </>
              )}
            </>
          )}
        </svg>
      </div>
      {epaBands && (
        <div style={{ fontFamily: RESIPLE, fontSize: 10.5, color: PLATE.muted, marginTop: 2 }}>
          * EPA 24-hour safety standard: 9 µg/m³
        </div>
      )}
    </div>
  );
}

// one Soilmote card: the same soilmoisture trace at three zooms. Month tells the
// story, day answers "is it wet right now". Battery voltage is in the feed too,
// deliberately not charted.
// a chart only needs ~1 point per plot pixel: keep the first sample per bucket,
// same idiom as eggSeries' 5-minute pass
function thin(pts: EggPoint[]): EggPoint[] {
  const b = (pts[pts.length - 1].t - pts[0].t) / 1500;
  return b <= 300_000 ? pts : pts.filter((p, i, a) => i === 0 || Math.floor(p.t / b) !== Math.floor(a[i - 1].t / b));
}

function SoilCharts({ points, lifetime }: { points: EggPoint[]; lifetime?: EggPoint[] }) {
  const newest = points[points.length - 1].t;
  const live = Date.now() - newest < 75 * 60_000; // ~30 min LoRa cadence, 2 missed reports = offline
  // lifetime pops in when the slow archive fetch lands
  const windows = [
    { label: 'Lifetime', pts: lifetime ?? [] },
    { label: 'Month', pts: points.filter((p) => p.t >= newest - 31 * 86_400_000) },
    { label: 'Week', pts: points.filter((p) => p.t >= newest - 7 * 86_400_000) },
    { label: 'Day', pts: points.filter((p) => p.t >= newest - 86_400_000) },
  ]
    .map((w) => ({ ...w, pts: w.pts.length > 1 ? thin(w.pts) : w.pts }))
    .filter((w) => w.pts.length > 1);
  return (
    <div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: RESIPLE, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: live ? '#4fae7d' : '#7c909b' }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: live ? '#4fae7d' : '#5f7078' }} />
        {live ? 'Live' : 'Offline'} updated {fmtTime(newest)}
      </div>
      <p style={{ fontFamily: RESIPLE, fontSize: 13.5, color: '#a9bcc6', lineHeight: 1.65, maxWidth: 640, margin: '18px 0 0' }}>
        The probe reports volumetric water content, the fraction of the soil volume that is
        water. Readings shift with soil compaction, so the trend matters more than any single number.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(400px,100%),1fr))', gap: 18, marginTop: 20 }}>
        {windows.map((w) => (
          <SensorChart key={w.label} label={w.label} unit="% VWC" points={w.pts} y0={0} minSpan={20} accent="#c1703f" />
        ))}
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

// Zynect Soilmotes ride the same Wicked Device API as the eggs, but the grouped
// feed is keyed by internal serial (the portal name, e.g. GRASP, is an alias).
// That API needs no key and allows any origin, so the client fetches it directly.
const SOILMOTES = [
  { id: 'egge82d1055169daf2b', name: 'GRASP', location: 'Gamefarm', lifeFrom: Date.parse('2025-05-14T00:00:00Z'), coords: "N 42\u00b0 27.060' W 76\u00b0 26.863'" },
];
// retired probes: their history never changes, so it's cataloged once into
// soil-archive.json (thinned to ~900 pts each) instead of refetched from the
// slow archive API. NINJA's range set by the team; the rest are as probed.
const ARCHIVE: Record<string, EggPoint[]> = Object.fromEntries(
  // a 0% reading means the probe wasn't reading, not dry soil - drop them
  Object.entries(soilArchive as unknown as Record<string, [number, number][]>).map(([k, v]) => [k, v.map(([t, x]) => ({ t, v: x })).filter((p) => p.v !== 0)]),
);
const RETIRED = [
  { coords: "N 42\u00b0 26.924' W 76\u00b0 26.812'", name: 'CENSE', from: '3/18/25', to: '6/18/26' },
  { coords: "N 42\u00b0 26.926' W 76\u00b0 26.757'", name: 'NINJA', from: '3/21/26', to: '6/3/26' },
  { coords: "N 42\u00b0 27.032' W 76\u00b0 26.729'", name: 'CAMPS', from: '4/18/25', to: '4/19/26' },
  { coords: "N 42\u00b0 26.949' W 76\u00b0 26.816'", name: 'GLITZ', from: '3/18/25', to: '4/13/26' },
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
      {/* the authored sentence: a person explaining the figure, not a widget emitting one */}
      <p style={{ fontFamily: RESIPLE, fontSize: 13.5, color: '#a9bcc6', lineHeight: 1.65, maxWidth: 640, margin: '18px 0 0' }}>
        Each panel is drawn to its own physical scale. Particulate matter is plotted against
        the EPA health scale, so a clean day sits low in the panel rather than filling it.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(400px,100%),1fr))', gap: 18, marginTop: 20 }}>
        {charts.map((c) => {
          let points = c.scale ? c.series!.points.map((p) => ({ t: p.t, v: c.scale!(p.v) })) : c.series!.points;
          let chartUnit = c.unit;
          let minSpan = c.minSpan;
          if (c.key === 'temperature' && unit === 'F') {
            points = points.map((p) => ({ t: p.t, v: (p.v * 9) / 5 + 32 }));
            chartUnit = '°F';
            minSpan = minSpan != null ? (minSpan * 9) / 5 : undefined;
          }
          return <SensorChart key={c.key} label={c.label} unit={chartUnit} points={points} y0={c.y0} minSpan={minSpan} epaBands={c.epaBands} rating={RATINGS[c.key]} />;
        })}
      </div>
    </div>
  );
}

export function SensorsPage() {
  const [state, setState] = useState<
    { status: 'loading' } | { status: 'error' } | { status: 'ready'; raw: Record<string, unknown> }
  >({ status: 'loading' });
  const [unit, setUnit] = useState<'C' | 'F'>('F');
  const [tab, setTab] = useState<'air' | 'soil'>(() => {
    try { return sessionStorage.getItem('sensor-tab') === 'soil' ? 'soil' : 'air'; } catch { return 'air'; }
  });
  const pickTab = (t: 'air' | 'soil') => {
    setTab(t);
    try { sessionStorage.setItem('sensor-tab', t); } catch { /* storage blocked: tab just won't persist */ }
  };
  const [soil, setSoil] = useState<
    { status: 'loading' } | { status: 'error' } | { status: 'ready'; raw: Record<string, unknown> }
  >({ status: 'loading' });

  useEffect(() => {
    let alive = true;
    const url =
      `https://zynect.com/api/v2/messages/device/${SOILMOTES.map((m) => m.id).join(',')}` +
      `?dur=P1M&end-date=${new Date().toISOString()}&reduced=1&grouped=1`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((raw) => alive && setSoil({ status: 'ready', raw: (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown> }))
      .catch(() => alive && setSoil({ status: 'error' }));
    return () => {
      alive = false;
    };
  }, []);

  const [soilLife, setSoilLife] = useState<Record<string, unknown>>({});
  useEffect(() => {
    let alive = true;
    // the lifetime archive takes Zynect ~a minute to assemble, so it comes through
    // the server proxy (long cache) and the charts pop in when it lands
    fetch('/api/soil-lifetime')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .catch(() => {
        // no proxy running (plain vite dev): fetch the slow archive straight from
        // Zynect. Takes upstream ~a minute; the chart pops in when it lands.
        const url =
          `https://zynect.com/api/v2/messages/device/${SOILMOTES.map((m) => m.id).join(',')}` +
          `?dur=P2Y&end-date=${new Date().toISOString()}&reduced=1&grouped=1`;
        return fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))));
      })
      .then((raw) => alive && setSoilLife((raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

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
  const soilParsed = useMemo(
    () => Object.fromEntries(SOILMOTES.map((m) => [m.id, soil.status === 'ready' ? eggSeries(soil.raw[m.id]) : []])),
    [soil],
  );
  const soilLifeParsed = useMemo(
    () => Object.fromEntries(SOILMOTES.map((m) => [m.id, eggSeries(soilLife[m.id])])),
    [soilLife],
  );

  return (
    <section style={SUBPAGE}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
      <h2 style={H2}>Active Sensors</h2>
      {/* the °C/°F toggle overlays the tab row; it only applies to the egg
          temperature panels, so it rides the air tab */}
      <div style={{ position: 'relative', marginTop: 32 }}>
      <div style={{ display: 'inline-flex', border: '2px solid rgba(255,255,255,0.3)', overflow: 'hidden' }}>
        {([['air', 'Air Quality'], ['soil', 'Soil Moisture']] as const).map(([id, label]) => (
          <button key={id} onClick={() => pickTab(id)} style={{ appearance: 'none', border: 'none', cursor: 'pointer', padding: '10px 22px', fontFamily: RESIPLE, fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', background: tab === id ? (id === 'soil' ? '#c1703f' : '#6d9dcd') : 'transparent', color: tab === id ? '#0e141c' : '#7c909b' }}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'air' && EGGS.map((egg) => {
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
      {tab === 'soil' && SOILMOTES.map((mote) => {
        // 0% is a non-reading (probe out of soil), not data
        const pts = soilParsed[mote.id].find((s) => s.key === 'soilmoisture')?.points.filter((p) => p.v !== 0);
        return (
          <details key={mote.id} open style={{ background: '#141c26', border: '1px solid #c1703f', padding: 'clamp(20px,3.5vw,36px)', marginTop: 24 }}>
            <summary style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '8px 18px' }}>
              <span className="chev" style={{ color: '#7c909b', alignSelf: 'center' }} />
              <h3 style={{ fontFamily: MANTI, fontWeight: 700, fontSize: 'clamp(24px,3vw,32px)', letterSpacing: '-0.015em', margin: 0 }}>{mote.name}</h3>
              <span style={{ fontFamily: RESIPLE, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7c909b' }}>{mote.location} {mote.coords}</span>
            </summary>
            <div style={{ marginTop: 28 }}>
              {soil.status === 'loading' ? (
                <div style={{ fontFamily: RESIPLE, fontSize: 14.5, color: '#7c909b' }}>Contacting the probe…</div>
              ) : !pts || pts.length < 2 ? (
                <div style={{ fontFamily: RESIPLE, fontSize: 14.5, color: '#7c909b' }}>The sensor feed is offline right now. Check back soon.</div>
              ) : (
                <SoilCharts points={pts} lifetime={soilLifeParsed[mote.id].find((s) => s.key === 'soilmoisture')?.points.filter((p) => p.v !== 0 && p.t >= mote.lifeFrom)} />
              )}
            </div>
          </details>
        );
      })}
      {tab === 'soil' && (
        <div style={{ marginTop: 40 }}>
          <div style={{ fontFamily: RESIPLE, fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7c909b' }}>Inactive Sensors</div>
          {RETIRED.map((r) => (
            <details key={r.name} open style={{ background: '#141c26', border: '1px solid rgba(193,112,63,0.5)', padding: 'clamp(20px,3.5vw,36px)', marginTop: 24 }}>
              <summary style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '8px 18px' }}>
                <span className="chev" style={{ color: '#7c909b', alignSelf: 'center' }} />
                <h3 style={{ fontFamily: MANTI, fontWeight: 700, fontSize: 'clamp(24px,3vw,32px)', letterSpacing: '-0.015em', margin: 0 }}>{r.name}</h3>
                <span style={{ fontFamily: RESIPLE, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7c909b' }}>Active: ({r.from} - {r.to}) | Coords: {r.coords}</span>
              </summary>
              <div style={{ marginTop: 28 }}>
                <SensorChart label="Lifetime" unit="% VWC" points={ARCHIVE[r.name]} y0={0} minSpan={20} accent="#c1703f" />
              </div>
            </details>
          ))}
        </div>
      )}
      {tab === 'air' && (
        <div style={{ position: 'absolute', top: 0, right: 0, display: 'inline-flex', border: '2px solid rgba(255,255,255,0.3)', overflow: 'hidden' }}>
          {(['F', 'C'] as const).map((u) => (
            <button key={u} onClick={() => setUnit(u)} style={{ appearance: 'none', border: 'none', cursor: 'pointer', padding: '8px 18px', fontFamily: RESIPLE, fontSize: 14, letterSpacing: '0.1em', background: unit === u ? '#6d9dcd' : 'transparent', color: unit === u ? '#0e141c' : '#7c909b' }}>
              °{u}
            </button>
          ))}
        </div>
      )}
      </div>
      </div>
    </section>
  );
}
