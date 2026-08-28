import { useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import type { ReactNode } from 'react';
import type { GlobeEngine } from '../lib/globeEngine';
import type { GlobeSite } from '../lib/sites';
import { lonToX, latToY } from '../lib/mercator';
import TileMap, { type MapTarget } from './TileMap';
import { RESIPLE } from '../styles/theme';

// The whole network fits in about 3.3 km - a hundredth of a degree. There is no
// globe zoom at which those seven probes are separable, so the globe does not
// try: it carries one marker for the site, and the individual sensors exist
// only on the imagery below, where they sit at their true coordinates.
const WORLD_ZOOM = 1.45;
const DIVE_ZOOM = 2.6;
// the map opens wide and closes to the whole network, so the descent lands on
// something you can read rather than on one roof
const MAP_OPEN_Z = 12.4;
const MAP_NET_Z = 15.4;
const MAP_SITE_Z = 18;
const FADE_MS = 900;

// how far the card floats off its pin, and how close it may come to the edge
const GAP = 26;
const EDGE = 16;

const CTRL: React.CSSProperties = {
  appearance: 'none', cursor: 'pointer', padding: '7px 15px',
  border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(14,20,28,0.72)',
  color: '#a9bcc6', fontFamily: RESIPLE, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase',
};

export default function SensorGlobe({ sites, selectedId, onSelect, accent, card }: {
  sites: GlobeSite[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  accent: string;
  // the readings for the selected sensor; floated beside its pin on a leader line
  card?: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const leadRef = useRef<SVGLineElement>(null);
  const markerRef = useRef<HTMLButtonElement>(null);
  const mapViewRef = useRef<{ lat: number; lon: number; zoom: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GlobeEngine | null>(null);
  const [noWebGL, setNoWebGL] = useState(false);
  // phones get the plain list; three.js is never downloaded there
  const [isMobile] = useState(() => window.matchMedia('(max-width: 720px)').matches);

  const [mapMounted, setMapMounted] = useState(false);
  const [onMap, setOnMap] = useState(false);
  const nonce = useRef(0);
  const [mapTarget, setMapTarget] = useState<MapTarget | null>(null);

  const centre = useMemo(() => ({
    lat: sites.reduce((a, s) => a + s.lat, 0) / sites.length,
    lon: sites.reduce((a, s) => a + s.lon, 0) / sites.length,
  }), [sites]);
  const centreRef = useRef(centre);
  centreRef.current = centre;
  const sitesRef = useRef(sites);
  sitesRef.current = sites;

  useEffect(() => {
    if (isMobile) return;
    let cancelled = false;
    const canvasEl = canvasRef.current!;

    // the marker rides the globe, so it is repositioned against the frame that
    // was just drawn rather than through React state
    const onFrame = () => {
      const eng = engineRef.current;
      const el = markerRef.current;
      if (!eng || !el) return;
      const p = eng.project(centreRef.current.lat, centreRef.current.lon);
      if (!p || !p.visible) { el.style.opacity = '0'; el.style.pointerEvents = 'none'; return; }
      el.style.opacity = '1';
      el.style.pointerEvents = 'auto';
      el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
    };

    import('../lib/globeEngine').then((mod) => {
      if (cancelled) return;
      const e = new mod.GlobeEngine({
        aimLat: centreRef.current.lat,
        aimLon: centreRef.current.lon,
        yaw: 0, pitch: 0, zoom: WORLD_ZOOM,
        minZoom: 0.7, maxZoom: DIVE_ZOOM,
        sizeMode: 'element', cameraZ: 3.2,
        onFrame,
      });
      e.mount({ canvasEl, onNoWebGL: () => setNoWebGL(true) });
      engineRef.current = e;
    });
    return () => {
      cancelled = true;
      engineRef.current?.unmount();
      engineRef.current = null;
    };
  }, [isMobile]);

  // ---- the fall, and the climb back out ----
  const descend = (siteId?: string) => {
    const s = siteId ? sites.find((x) => x.id === siteId) : undefined;
    setMapTarget({
      lat: s?.lat ?? centre.lat,
      lon: s?.lon ?? centre.lon,
      zoom: s ? MAP_SITE_Z : MAP_NET_Z,
      nonce: ++nonce.current,
    });
    setMapMounted(true);
    // keep driving the globe in under the cross-fade so the motion never stalls
    engineRef.current?.flyTo(centre.lat, centre.lon, DIVE_ZOOM, FADE_MS);
    requestAnimationFrame(() => requestAnimationFrame(() => setOnMap(true)));
    window.setTimeout(() => engineRef.current?.pause(), FADE_MS + 120);
  };

  const ascend = () => {
    onSelect(null);
    engineRef.current?.resume();
    engineRef.current?.flyTo(centre.lat, centre.lon, WORLD_ZOOM, FADE_MS);
    setOnMap(false);
    window.setTimeout(() => setMapMounted(false), FADE_MS);
  };

  // picking a sensor on the imagery closes in on it
  useEffect(() => {
    if (!selectedId || !onMap) return;
    const s = sitesRef.current.find((x) => x.id === selectedId);
    if (!s) return;
    setMapTarget({ lat: s.lat, lon: s.lon, zoom: MAP_SITE_Z, nonce: ++nonce.current });
  }, [selectedId, onMap]);

  // WebGL blocked: there is no globe to fall from, so open on the imagery
  useEffect(() => {
    if (!noWebGL) return;
    setMapTarget({ lat: centre.lat, lon: centre.lon, zoom: MAP_NET_Z, nonce: ++nonce.current });
    setMapMounted(true);
    setOnMap(true);
  }, [noWebGL, centre.lat, centre.lon]);

  // The card is anchored, not parked: the map keeps panning and zooming under
  // it, so its position is recomputed every frame.
  const hasCard = !!card && !!selectedId && onMap;
  useEffect(() => {
    if (!hasCard) return;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const el = cardRef.current, box = rootRef.current, v = mapViewRef.current;
      const s = sitesRef.current.find((x) => x.id === selectedId);
      if (!el || !box || !v || !s) return;
      const w = box.clientWidth, h = box.clientHeight;
      const Z = Math.max(11, Math.min(20, Math.round(v.zoom)));
      const k = 2 ** (v.zoom - Z);
      const px = (lonToX(s.lon, Z) - lonToX(v.lon, Z)) * k + w / 2;
      const py = (latToY(s.lat, Z) - latToY(v.lat, Z)) * k + h / 2;
      const cw = el.offsetWidth, ch = el.offsetHeight;
      // sit on whichever side of the pin has room, and never leave the stage
      const right = px + GAP + cw <= w - EDGE;
      const cx = Math.max(EDGE, Math.min(w - cw - EDGE, right ? px + GAP : px - GAP - cw));
      const cy = Math.max(EDGE, Math.min(h - ch - EDGE, py - ch / 2));
      el.style.transform = `translate(${cx}px, ${cy}px)`;
      const line = leadRef.current;
      if (line) {
        const ex = right ? cx : cx + cw;
        const ey = Math.max(cy + 14, Math.min(cy + ch - 14, py));
        line.setAttribute('x1', String(px)); line.setAttribute('y1', String(py));
        line.setAttribute('x2', String(ex)); line.setAttribute('y2', String(ey));
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hasCard, selectedId]);

  const pinDot = (tone: string, on: boolean, retired?: boolean) => (
    <span style={{
      width: on ? 13 : 9, height: on ? 13 : 9, borderRadius: 999, flexShrink: 0,
      background: retired ? 'transparent' : tone,
      border: `2px solid ${tone}`,
      boxShadow: on ? `0 0 0 5px ${tone}33` : 'none',
      transition: 'width .18s, height .18s, box-shadow .18s',
    }} />
  );

  // no 3D on phones - the page is otherwise nothing but the globe, so without
  // this there would be no way to reach a sensor at all
  if (isMobile) {
    return (
      <div style={{ marginTop: 24, border: `1px solid ${accent}`, background: '#141c26' }}>
        {sites.map((s, i) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left',
              appearance: 'none', cursor: 'pointer', padding: '14px 18px',
              borderTop: i ? '1px solid rgba(255,255,255,0.09)' : 'none', borderLeft: 0, borderRight: 0, borderBottom: 0,
              background: s.id === selectedId ? 'rgba(255,255,255,0.06)' : 'transparent',
            }}
          >
            {pinDot(s.tone, s.id === selectedId, s.retired)}
            <span style={{ fontFamily: RESIPLE, fontSize: 14.5, color: '#e6ecf0' }}>{s.name}</span>
            <span style={{ fontFamily: RESIPLE, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7c909b', marginLeft: 'auto' }}>{s.sub}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div ref={rootRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* ---- globe stage ---- */}
      <div style={{
        position: 'absolute', inset: 0,
        opacity: onMap ? 0 : 1,
        transform: onMap ? 'scale(1.6)' : 'scale(1)',
        transition: `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`,
        pointerEvents: onMap ? 'none' : 'auto',
      }}>
        {!noWebGL && <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />}

        {!noWebGL && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <button
              ref={markerRef}
              onClick={() => descend()}
              style={{
                position: 'absolute', top: 0, left: 0, opacity: 0, display: 'inline-flex', alignItems: 'center', gap: 9,
                appearance: 'none', cursor: 'pointer', padding: '7px 15px 7px 11px', borderRadius: 999,
                background: 'rgba(14,20,28,0.82)', border: `1px solid ${accent}`, color: '#e6ecf0',
                fontFamily: RESIPLE, fontSize: 12.5, letterSpacing: '0.1em', textTransform: 'uppercase',
                whiteSpace: 'nowrap', boxShadow: '0 2px 14px rgba(0,0,0,0.5)',
              }}
            >
              {pinDot(accent, false)}
              Ithaca, NY - {sites.length} sensor{sites.length === 1 ? '' : 's'}
            </button>
          </div>
        )}
      </div>

      {/* ---- imagery stage ---- */}
      {mapMounted && mapTarget && (
        <div style={{
          position: 'absolute', inset: 0,
          opacity: onMap ? 1 : 0,
          transform: onMap ? 'scale(1)' : 'scale(1.35)',
          transition: `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`,
          pointerEvents: onMap ? 'auto' : 'none',
        }}>
          <TileMap
            sites={sites}
            selectedId={selectedId}
            onSelect={onSelect}
            target={mapTarget}
            initial={{ lat: centre.lat, lon: centre.lon, zoom: MAP_OPEN_Z }}
            onView={(v) => { mapViewRef.current = v; }}
            dur={FADE_MS + 500}
          />
        </div>
      )}

      {/* ---- the readings, floated beside their pin ---- */}
      {hasCard && (
        <>
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}>
            <line ref={leadRef} stroke={accent} strokeWidth={1.5} strokeDasharray="3 3" opacity={0.55} />
          </svg>
          <div ref={cardRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 6, willChange: 'transform' }}>
            {card}
          </div>
        </>
      )}

      {/* ---- controls, kept faint until wanted ---- */}
      <div
        style={{
          position: 'absolute', top: 24, right: 24, display: 'flex', gap: 8, zIndex: 7,
          opacity: 0.42, transition: 'opacity .2s',
        }}
        onPointerEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
        onPointerLeave={(e) => { e.currentTarget.style.opacity = '0.42'; }}
      >
        {([['−', -1], ['+', 1]] as const).map(([glyph, dir]) => (
          <button
            key={glyph}
            aria-label={dir > 0 ? 'Zoom in' : 'Zoom out'}
            onClick={() => {
              if (onMap) setMapTarget((t) => t && ({ ...t, zoom: Math.max(11, Math.min(20, t.zoom + dir)), nonce: ++nonce.current }));
              else { const e = engineRef.current; if (e) e.flyTo(centre.lat, centre.lon, e.zoom * (dir > 0 ? 1.35 : 1 / 1.35), 420); }
            }}
            style={{ ...CTRL, width: 34, padding: '7px 0', fontSize: 15 }}
          >
            {glyph}
          </button>
        ))}
        {onMap && !noWebGL && <button onClick={ascend} style={CTRL}>Back to orbit</button>}
      </div>
    </div>
  );
}
