import { useEffect, useRef, useState } from 'react';
import { TILE, lonToX, latToY, xToLon, yToLat, metresPerPixel } from '../lib/mercator';
import type { GlobeSite } from '../lib/sites';
import { RESIPLE } from '../styles/theme';

// Esri World Imagery: keyless, and the only free source that actually reaches
// street level over Tompkins County - the USGS National Map is public domain
// but its imagery stops at z16 here (~1.8 m/px). Swap these two lines to change
// provider; the {z}/{y}/{x} path order is Esri's own.
const TILE_URL = (z: number, x: number, y: number) =>
  `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
const ATTRIBUTION = 'Imagery: Esri, Maxar, Earthstar Geographics';

const MIN_Z = 11;
const MAX_Z = 20;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export interface MapTarget { lat: number; lon: number; zoom: number; nonce: number }

export default function TileMap({ sites, selectedId, onSelect, target, initial, onView, dur = 1400 }: {
  sites: GlobeSite[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  // the map eases to this whenever `nonce` changes
  target: MapTarget;
  // where the map opens before easing to the first target - a wide framing, so
  // arriving from the globe continues the fall instead of cutting to the ground
  initial?: { lat: number; lon: number; zoom: number };
  // reports the live view, so an overlay anchored to a pin can follow it
  onView?: (v: { lat: number; lon: number; zoom: number }) => void;
  dur?: number;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState(initial ?? { lat: target.lat, lon: target.lon, zoom: target.zoom });
  const viewRef = useRef(view);
  viewRef.current = view;

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ease to each new target rather than jumping, so arriving from the globe and
  // moving between sensors read as the same continuous descent
  useEffect(() => {
    const from = { ...viewRef.current };
    const t0 = performance.now();
    let raf = 0;
    const step = () => {
      const k = easeInOut(Math.min(1, (performance.now() - t0) / dur));
      setView({
        lat: from.lat + (target.lat - from.lat) * k,
        lon: from.lon + (target.lon - from.lon) * k,
        zoom: from.zoom + (target.zoom - from.zoom) * k,
      });
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.nonce]);

  // ---- panning ----
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    let last: { x: number; y: number } | null = null;
    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('button')) return;
      last = { x: e.clientX, y: e.clientY };
      el.setPointerCapture(e.pointerId);
      el.style.cursor = 'grabbing';
    };
    const move = (e: PointerEvent) => {
      if (!last) return;
      const v = viewRef.current;
      const z = v.zoom;
      const cx = lonToX(v.lon, z) - (e.clientX - last.x);
      const cy = latToY(v.lat, z) - (e.clientY - last.y);
      last = { x: e.clientX, y: e.clientY };
      setView({ lat: yToLat(cy, z), lon: xToLon(cx, z), zoom: z });
    };
    const up = (e: PointerEvent) => {
      last = null;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      el.style.cursor = 'grab';
    };
    // same rule as the globe: a plain wheel belongs to the page, a pinch or
    // cmd/ctrl+wheel belongs to the map
    const wheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const v = viewRef.current;
      setView({ ...v, zoom: clamp(v.zoom - e.deltaY * 0.01, MIN_Z, MAX_Z) });
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', wheel, { passive: false });
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('wheel', wheel);
    };
  }, []);

  useEffect(() => { onView?.(view); }, [view, onView]);

  const { w, h } = size;
  const midX = w / 2;
  const Z = clamp(Math.round(view.zoom), MIN_Z, MAX_Z);
  const scale = 2 ** (view.zoom - Z);

  // one integer zoom level's worth of tiles, centred on the view
  const layer = (lvl: number) => {
    if (!w || !h) return null;
    const s = 2 ** (view.zoom - lvl);
    const cx = lonToX(view.lon, lvl);
    const cy = latToY(view.lat, lvl);
    const halfW = w / 2 / s + TILE;
    const halfH = h / 2 / s + TILE;
    const n = 2 ** lvl;
    const out = [];
    for (let x = Math.floor((cx - halfW) / TILE); x <= Math.floor((cx + halfW) / TILE); x++) {
      for (let y = Math.floor((cy - halfH) / TILE); y <= Math.floor((cy + halfH) / TILE); y++) {
        if (y < 0 || y >= n) continue;
        const wx = ((x % n) + n) % n;
        out.push(
          <img
            key={`${lvl}/${wx}/${y}`}
            src={TILE_URL(lvl, wx, y)}
            alt=""
            draggable={false}
            decoding="async"
            style={{ position: 'absolute', left: x * TILE - cx, top: y * TILE - cy, width: TILE, height: TILE, userSelect: 'none' }}
          />,
        );
      }
    }
    return (
      <div style={{ position: 'absolute', left: midX, top: h / 2, transform: `scale(${s})`, transformOrigin: '0 0' }}>
        {out}
      </div>
    );
  };

  const cx = lonToX(view.lon, Z);
  const cy = latToY(view.lat, Z);
  const screen = (s: GlobeSite) => ({
    x: (lonToX(s.lon, Z) - cx) * scale + midX,
    y: (latToY(s.lat, Z) - cy) * scale + h / 2,
  });

  // scale bar: widest 1-2-5 distance that fits in 140px
  const mpp = metresPerPixel(view.lat, view.zoom);
  const nice = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 2000, 5000];
  const barM = [...nice].reverse().find((m) => m / mpp <= 140) ?? 1;

  return (
    <div ref={boxRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', cursor: 'grab', background: '#0e141c', touchAction: 'pan-y' }}>
      {/* the parent level sits underneath so a zoom step never shows through to
          nothing while the finer tiles are still arriving */}
      {Z > MIN_Z && layer(Z - 1)}
      {layer(Z)}

      {sites.map((s) => {
        const p = screen(s);
        if (!w || p.x < -80 || p.y < -40 || p.x > w + 80 || p.y > h + 40) return null;
        const on = s.id === selectedId;
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            title={`${s.name} - ${s.sub}`}
            style={{
              position: 'absolute', left: p.x, top: p.y, transform: 'translate(-50%,-50%)',
              display: 'inline-flex', alignItems: 'center', gap: 8, appearance: 'none', cursor: 'pointer',
              padding: '6px 13px 6px 9px', borderRadius: 999, whiteSpace: 'nowrap',
              background: on ? s.tone : 'rgba(14,20,28,0.82)',
              border: `1px solid ${on ? s.tone : 'rgba(255,255,255,0.3)'}`,
              color: on ? '#0e141c' : s.retired ? '#8fa2ac' : '#e6ecf0',
              fontFamily: RESIPLE, fontSize: 12.5, letterSpacing: '0.08em', textTransform: 'uppercase',
              boxShadow: '0 2px 10px rgba(0,0,0,0.45)',
            }}
          >
            <span style={{ width: on ? 11 : 8, height: on ? 11 : 8, borderRadius: 999, flexShrink: 0, border: `2px solid ${on ? '#0e141c' : s.tone}`, background: s.retired ? 'transparent' : on ? '#0e141c' : s.tone }} />
            {s.name}
          </button>
        );
      })}

      <div style={{ position: 'absolute', left: 14, bottom: 12, display: 'flex', alignItems: 'center', gap: 9, pointerEvents: 'none' }}>
        <div style={{ width: barM / mpp, height: 6, borderLeft: '2px solid #e6ecf0', borderRight: '2px solid #e6ecf0', borderBottom: '2px solid #e6ecf0' }} />
        <span style={{ fontFamily: RESIPLE, fontSize: 11.5, color: '#e6ecf0', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
          {barM >= 1000 ? `${barM / 1000} km` : `${barM} m`}
        </span>
      </div>
      <span style={{ position: 'absolute', right: 12, bottom: 12, fontFamily: RESIPLE, fontSize: 10.5, color: 'rgba(230,236,240,0.75)', textShadow: '0 1px 3px rgba(0,0,0,0.9)', pointerEvents: 'none' }}>
        {ATTRIBUTION}
      </span>
    </div>
  );
}
