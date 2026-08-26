import type React from 'react';
import { Fragment, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Globe from './Globe';
import { RESIPLE, MANTI, H2, BODY, PILL, PILL_PRIMARY } from './theme';
import { PROJECTS, PARTNERS, LEGAL_PAGES, POSTS, SPONSOR_PACKET_PDF, TIERS, ALUMNI } from './content';
import { SensorsFeed } from './sensors';
import { MembersPage } from './members';

// "Tech x Air" -> smaller x between team names
const fmtTag = (tag: string) => tag.split(/( x )/).map((p, i) => (p === ' x ' ? <span key={i} style={{ fontSize: '0.72em' }}> x </span> : p));

// renders **text** in post paragraphs as bold
const emphasize = (text: string) =>
  text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <strong key={i} style={{ color: '#e6ecf0' }}>{part}</strong> : part));

// the packet renders as pre-baked page images (public/sponsorship/) instead of
// a browser <object> PDF embed - consistent styling, works on phones, and
// avoids downloading the 29MB PDF just to preview it. Regenerate after
// updating the packet:
//   pdftoppm -jpeg -jpegopt quality=78 -scale-to-x 1400 -scale-to-y -1 public/sponsorship-packet.pdf public/sponsorship/page
const PACKET_PAGE_COUNT = 12;
const packetPageSrc = (n: number) => `/sponsorship/page-${String(n + 1).padStart(2, '0')}.jpg`;

// Cornell project-team recruiting dates, fall 2026, from the Engineering
// project teams recruiting calendar. `end` (Ithaca local time) is when the
// event stops being "upcoming" - past events grey out, the next one is green.
// rows: each inner array renders as one line of the path; a continuation
// arrow leads into every row after the first
const RECRUITING_TRACKS = [
  {
    track: 'Upperclassmen',
    rows: [[
      { name: 'Project Teams Fest', when: 'Sept 1, 4-6 p.m.\nDuffield Atrium', end: '2026-09-01T18:00:00-04:00', icon: 'fest' },
      { name: 'Coffee Chats', when: 'Aug 27 -- Sept 4', end: '2026-09-04T23:59:59-04:00', icon: 'coffee' },
      { name: 'Applications Due', when: 'Sept 3, 11:59 p.m.', end: '2026-09-03T23:59:00-04:00', icon: 'apps' },
      { name: 'Interviews', when: 'Sept 4 -- 15', end: '2026-09-15T23:59:59-04:00', icon: 'interview' },
      { name: 'First Offer Date', when: 'Sept 16', end: '2026-09-16T23:59:59-04:00', icon: 'offer' },
      { name: 'Add Deadline', when: 'Sept 25, 5 p.m.', end: '2026-09-25T17:00:00-04:00', icon: 'deadline' },
    ]],
  },
  {
    track: 'First-Year + Transfer',
    rows: [[
      { name: 'Project Teams Fest', when: 'Sept 1, 4-6 p.m.\nDuffield Atrium', end: '2026-09-01T18:00:00-04:00', icon: 'fest' },
      { name: 'Coffee Chats', when: 'Aug 27 -- Oct 14', end: '2026-10-14T23:59:59-04:00', icon: 'coffee' },
      { name: 'Applications Due', when: 'Oct 15, 11:59 p.m.', end: '2026-10-15T23:59:00-04:00', icon: 'apps' },
      { name: 'Interviews', when: 'Oct 16 -- Nov 1', end: '2026-11-01T23:59:59-05:00', icon: 'interview' },
      { name: 'First Offer Date', when: 'Nov 2', end: '2026-11-02T23:59:59-05:00', icon: 'offer' },
      { name: 'Onboarding Begins', when: 'Nov 4', end: '2026-11-04T23:59:59-05:00', icon: 'onboard' },
    ]],
  },
];

// hand-drawn-style line icons for the timeline stops, same stroke language as
// the tethersonde balloon in the join heading
function EventIcon({ kind, color, bob }: { kind: string; color: string; bob: boolean }) {
  const s = { fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg className={bob ? 'balloon-bob' : undefined} width="26" height="26" viewBox="0 0 24 24" style={{ display: 'block', margin: '0 auto' }} aria-hidden="true">
      {kind === 'fest' && <g {...s}><path d="M6 21V3" /><path d="M6 4h12l-3.5 3.5L18 11H6" /></g>}
      {kind === 'coffee' && <g {...s}><path d="M5 10h11v7a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-7Z" /><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16" /><path d="M8.5 7c0-1.4 1-1.6 1-3" /><path d="M12.5 7c0-1.4 1-1.6 1-3" /></g>}
      {kind === 'apps' && <g {...s}><path d="M7 3h7l4 4v14H7V3Z" /><path d="M14 3v4h4" /><path d="M10 12h5M10 16h5" /></g>}
      {kind === 'interview' && <g {...s}><path d="M4 5h16v11h-9l-4 4v-4H4V5Z" /><path d="M8 9.5h8M8 12.5h5" /></g>}
      {kind === 'offer' && <g {...s}><path d="M4 6h16v12H4V6Z" /><path d="m4 7 8 6 8-6" /></g>}
      {kind === 'deadline' && <g {...s}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l3 2" /><path d="M9 2.5h6" /></g>}
      {kind === 'onboard' && <g {...s}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></g>}
    </svg>
  );
}

function RecruitingTimeline() {
  const now = Date.now();
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 720px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px)');
    const onChange = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return (
    <section style={{ position: 'relative', zIndex: 2, background: '#0e141c', padding: '0 clamp(24px,5vw,72px) 130px' }}>
      <h2 style={{ fontFamily: MANTI, fontWeight: 700, fontSize: 'clamp(42px,6.2vw,80px)', letterSpacing: '-0.03em', lineHeight: 1, margin: 0 }}>Recruiting <span style={{ color: '#4fae7d' }}>Timeline</span></h2>
      <div style={{ marginTop: 44, border: '2px solid #4fae7d', borderRadius: 16, padding: '0 34px 42px', overflowX: 'auto' }}>
      {RECRUITING_TRACKS.map(({ track, rows }) => {
        const next = rows.flat().find((e) => now <= new Date(e.end).getTime());
        return (
          <div key={track} style={{ marginTop: 40 }}>
            <div style={{ fontFamily: RESIPLE, fontSize: 14, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4fae7d' }}>{track}</div>
            {mobile ? (
              // single vertical column on phones instead of the snaking rows
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 24 }}>
                {rows.flat().map((e, i) => {
                  const past = now > new Date(e.end).getTime();
                  const active = e === next;
                  const arrowColor = past || active ? '#086727' : '#243140';
                  return (
                    <Fragment key={e.name}>
                      {i > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '10px 0' }}>
                          <div style={{ width: 2, height: 20, borderRadius: 2, background: arrowColor }} />
                          <svg width="14" height="11" viewBox="0 0 14 11" aria-hidden="true"><path d="m2 2 5 6 5-6" fill="none" stroke={arrowColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                      )}
                      <div style={{ textAlign: 'center', width: 200 }}>
                        <EventIcon kind={e.icon} color={past ? '#4d5b63' : active ? '#4fae7d' : '#a9bcc6'} bob={active} />
                        <div style={{ fontFamily: RESIPLE, fontWeight: 700, fontSize: 13.5, marginTop: 10, color: past ? '#4d5b63' : active ? '#4fae7d' : '#e6ecf0' }}>{e.name}</div>
                        <div style={{ fontFamily: RESIPLE, fontSize: 12, color: past ? '#4d5b63' : '#a9bcc6', marginTop: 4, whiteSpace: 'pre-line' }}>{e.when}</div>
                      </div>
                    </Fragment>
                  );
                })}
              </div>
            ) : (
            <>
            {/* ox path: even rows run left-to-right, odd rows run right-to-left,
                joined by a curve down the right edge */}
            {rows.map((events, r) => {
              const reversed = r % 2 === 1;
              const first = events[0];
              const curveColor = now > new Date(first.end).getTime() || first === next ? '#086727' : '#243140';
              return (
              <Fragment key={r}>
                {r > 0 && (
                  // the ox-turn: continues right off the row above, arcs down,
                  // and points left into the first stop of the row below
                  <svg width="150" height="60" viewBox="0 0 150 60" style={{ display: 'block', margin: '6px 0 0 auto' }} aria-hidden="true">
                    <path d="M85 8h25a22 22 0 0 1 0 44H95" fill="none" stroke={curveColor} strokeWidth="2" />
                    <path d="m103 47-8 5 8 5" fill="none" stroke={curveColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              <div style={{ display: 'flex', flexDirection: reversed ? 'row-reverse' : 'row', alignItems: 'flex-start', marginTop: r === 0 ? 24 : 4 }}>
                {events.map((e, i) => {
                  const past = now > new Date(e.end).getTime();
                  const active = e === next;
                  const arrowColor = past || active ? '#086727' : '#243140';
                  return (
                    <Fragment key={e.name}>
                      {i > 0 && (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', margin: '7px 14px 0', minWidth: 24, height: 14 }}>
                          {reversed && <svg width="11" height="14" viewBox="0 0 11 14" style={{ flexShrink: 0 }} aria-hidden="true"><path d="M9 2 3 7l6 5" fill="none" stroke={arrowColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                          <div style={{ flex: 1, height: 2, borderRadius: 2, background: arrowColor }} />
                          {!reversed && <svg width="11" height="14" viewBox="0 0 11 14" style={{ flexShrink: 0 }} aria-hidden="true"><path d="m2 2 6 5-6 5" fill="none" stroke={arrowColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        </div>
                      )}
                      {/* fixed width so the two tracks' stops line up in columns */}
                      <div style={{ textAlign: 'center', width: 140, flexShrink: 0 }}>
                        <EventIcon kind={e.icon} color={past ? '#4d5b63' : active ? '#4fae7d' : '#a9bcc6'} bob={active} />
                        <div style={{ fontFamily: RESIPLE, fontWeight: 700, fontSize: 13.5, marginTop: 10, color: past ? '#4d5b63' : active ? '#4fae7d' : '#e6ecf0' }}>{e.name}</div>
                        <div style={{ fontFamily: RESIPLE, fontSize: 12, color: past ? '#4d5b63' : '#a9bcc6', marginTop: 4, whiteSpace: 'pre-line' }}>{e.when}</div>
                      </div>
                    </Fragment>
                  );
                })}
              </div>
              </Fragment>
              );
            })}
            </>
            )}
          </div>
        );
      })}
      </div>
    </section>
  );
}

function PacketViewer() {
  const [page, setPage] = useState(0);
  // fixed-overlay "fullscreen" rather than the Fullscreen API - iPhones don't
  // support requestFullscreen on elements, the overlay works everywhere
  const [full, setFull] = useState(false);
  // fetch the next page ahead of the click so turning feels instant
  useEffect(() => {
    if (page < PACKET_PAGE_COUNT - 1) new Image().src = packetPageSrc(page + 1);
  }, [page]);
  // arrow keys page through while the sponsors page is up; Esc exits fullscreen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setPage((p) => Math.min(p + 1, PACKET_PAGE_COUNT - 1));
      else if (e.key === 'ArrowLeft') setPage((p) => Math.max(p - 1, 0));
      else if (e.key === 'Escape') setFull(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    document.body.style.overflow = full ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [full]);
  const arrowStyle = (enabled: boolean): React.CSSProperties => ({ padding: '7px 22px', border: '1px solid rgba(255,255,255,0.18)', background: 'transparent', color: enabled ? '#e6ecf0' : '#4d5b63', fontFamily: RESIPLE, fontWeight: 700, fontSize: 17, cursor: enabled ? 'pointer' : 'default', lineHeight: 1.2 });
  const cornerBtn: React.CSSProperties = { padding: '5px 12px', fontFamily: RESIPLE, fontWeight: 700, fontSize: 11, boxShadow: '0 2px 10px rgba(0,0,0,0.45)', lineHeight: 1.4 };
  const viewer = (
    <div
      className="team-photo-frame"
      style={full
        ? { position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,20,28,0.98)', padding: 14 }
        : { width: 'fit-content', maxWidth: '100%', margin: '0 auto', padding: 14, border: '2px solid #086727', boxShadow: '10px 10px 0 rgba(8,103,39,0.35)' }}
    >
      <div style={{ position: 'relative' }}>
        {/* sized by height so the whole page fits on screen without scrolling */}
        <img key={page} src={packetPageSrc(page)} alt={`Sponsorship packet, page ${page + 1} of ${PACKET_PAGE_COUNT}`} style={{ display: 'block', height: full ? 'calc(100vh - 110px)' : 'min(56vh, 520px)', maxWidth: '100%', aspectRatio: '1400/1812', objectFit: 'contain', background: '#1a2430' }} />
        <div style={{ position: 'absolute', right: 10, bottom: 10, display: 'flex', gap: 8 }}>
          <button
            type="button"
            title={full ? 'Exit fullscreen (Esc)' : 'View fullscreen'}
            onClick={() => setFull(!full)}
            style={{ ...cornerBtn, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(14,20,28,0.75)', color: '#e6ecf0', cursor: 'pointer' }}
          >
            {full ? 'Exit' : 'Fullscreen'}
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, paddingTop: 14 }}>
        <button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => setPage(page - 1)} style={arrowStyle(page > 0)}>←</button>
        <span style={{ fontFamily: RESIPLE, fontSize: 12.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#a9bcc6', minWidth: '9ch', textAlign: 'center' }}>Page <span style={{ fontWeight: 700, color: '#e6ecf0' }}>{page + 1}</span> of <span style={{ fontWeight: 700, color: '#e6ecf0' }}>{PACKET_PAGE_COUNT}</span></span>
        <button type="button" aria-label="Next page" disabled={page === PACKET_PAGE_COUNT - 1} onClick={() => setPage(page + 1)} style={arrowStyle(page < PACKET_PAGE_COUNT - 1)}>→</button>
      </div>
    </div>
  );
  // portal escapes the sponsors section's z-index stacking context, which
  // otherwise leaves the fixed site header painted over the overlay
  return full ? createPortal(viewer, document.body) : viewer;
}

function CopyEmailButton({ label }: { label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText('cugeodata@cornell.edu');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      style={{ display: 'inline-block', padding: '13px 28px', borderRadius: 999, border: 0, cursor: 'pointer', background: '#086727', color: '#eaf2ee', fontWeight: 700, fontSize: 17, fontFamily: RESIPLE }}
    >
      {copied ? 'Copied cugeodata@cornell.edu' : label}
    </button>
  );
}

// draggable "ball pit" of alumni destination logos. Entries without a logo
// render as initials. Physics state lives outside React - balls render once
// and every frame writes transforms directly, same reasoning as the globe
// engine's rAF loop.
function AlumniPit({ alumni }: { alumni: typeof ALUMNI }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const R = window.innerWidth < 720 ? 50 : 60;
    interface Ball { el: HTMLElement; x: number; y: number; vx: number; vy: number; sleep: number; rx: number; ry: number }
    const balls: Ball[] = Array.from(wrap.children as HTMLCollectionOf<HTMLElement>).map((el, i) => {
      el.style.width = el.style.height = `${R * 2}px`;
      // spawn stacked above the pit so they rain in on arrival
      const x = R + Math.random() * Math.max(1, wrap.clientWidth - 2 * R);
      const y = -R - i * R * 2.4;
      return { el, x, y, vx: (Math.random() - 0.5) * 120, vy: 0, sleep: 0, rx: x, ry: y };
    });
    let W = wrap.clientWidth;
    let H = wrap.clientHeight;
    // wake everyone on resize - the walls/floor moved out from under sleepers
    const onResize = () => { W = wrap.clientWidth; H = wrap.clientHeight; for (const b of balls) b.sleep = 0; };
    window.addEventListener('resize', onResize);

    let dragged: Ball | null = null;
    const pointAt = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      return { px: e.clientX - r.left, py: e.clientY - r.top };
    };
    const onDown = (e: PointerEvent) => {
      const { px, py } = pointAt(e);
      for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i];
        if ((px - b.x) ** 2 + (py - b.y) ** 2 <= R * R) {
          dragged = b;
          b.vx = b.vy = 0;
          wrap.setPointerCapture(e.pointerId);
          break;
        }
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!dragged) return;
      const { px, py } = pointAt(e);
      // velocity from how far the ball chased the pointer this frame, so a
      // fast flick releases as a throw
      dragged.vx = (px - dragged.x) * 18;
      dragged.vy = (py - dragged.y) * 18;
      dragged.x = px;
      dragged.y = py;
    };
    const onUp = () => { dragged = null; };
    wrap.addEventListener('pointerdown', onDown);
    wrap.addEventListener('pointermove', onMove);
    wrap.addEventListener('pointerup', onUp);
    wrap.addEventListener('pointercancel', onUp);

    const G = 1800;
    const REST = 0.78;
    // frames (~0.5s) below ~30px/s before a ball naps: napping balls skip
    // integration entirely, so a settled pile is rock still instead of
    // trading gravity-fed micro-impulses through the stack forever
    const SLEEP_AT = 30;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.033);
      last = now;
      for (const b of balls) {
        if (b === dragged || b.sleep >= SLEEP_AT) continue;
        b.vy += G * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x < R) { b.x = R; b.vx = -b.vx * REST; }
        else if (b.x > W - R) { b.x = W - R; b.vx = -b.vx * REST; }
        // no ceiling - a hard throw arcs out the top and falls back in
        // slow floor contacts don't rebound, otherwise gravity feeds a
        // tiny bounce every frame and the pile vibrates forever
        if (b.y > H - R) { b.y = H - R; b.vy = -b.vy * REST; b.vx *= 0.96; if (-b.vy < 60) b.vy = 0; }
      }
      // ponytail: O(n²) pair collisions - fine for a few dozen logos, grid-hash if the list ever gets big
      // two solver passes stiffen the stack so balls don't sink and re-push each frame
      for (let iter = 0; iter < 2; iter++) {
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          const a = balls[i];
          const b = balls[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d2 = dx * dx + dy * dy;
          const min = 2 * R;
          if (d2 === 0 || d2 >= min * min) continue;
          const d = Math.sqrt(d2);
          const nx = dx / d;
          const ny = dy / d;
          const rvn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          // wake nappers only on a real disturbance: the dragged ball, or a
          // neighbor arriving fast (real impacts come in at 300+px/s; the
          // settling pile's velocity churn stays under ~100). Never touch an
          // awake ball's counter here - drift alone decides who falls asleep.
          if (a === dragged || b === dragged || Math.abs(rvn) > 150) {
            if (a !== dragged && a.sleep >= SLEEP_AT) a.sleep = 0;
            if (b !== dragged && b.sleep >= SLEEP_AT) b.sleep = 0;
          }
          const aStill = a === dragged || a.sleep >= SLEEP_AT;
          const bStill = b === dragged || b.sleep >= SLEEP_AT;
          if (aStill && bStill) continue;
          const push = (min - d) / 2;
          if (!aStill) { a.x -= nx * push; a.y -= ny * push; }
          if (!bStill) { b.x += nx * push; b.y += ny * push; }
          if (rvn < 0) {
            // restitution only on fast impacts; slow contacts resolve dead
            const imp = (-(1 + (rvn < -80 ? REST : 0)) * rvn) / 2;
            if (!aStill) { a.vx -= imp * nx; a.vy -= imp * ny; }
            if (!bStill) { b.vx += imp * nx; b.vy += imp * ny; }
          }
        }
      }
      }
      for (const b of balls) {
        if (b === dragged) { b.sleep = 0; b.rx = b.x; b.ry = b.y; continue; }
        if (b.sleep >= SLEEP_AT) continue;
        // collision pushes can shove past the wall/floor clamp - re-clamp so
        // nobody falls asleep poking out of the pit
        if (b.x < R) b.x = R;
        else if (b.x > W - R) b.x = W - R;
        if (b.y > H - R) b.y = H - R;
        // sleep on net drift, not instantaneous speed - resting balls trade
        // micro-impulses every frame that never take them anywhere
        if (Math.hypot(b.x - b.rx, b.y - b.ry) < 2) { if (++b.sleep >= SLEEP_AT) { b.vx = 0; b.vy = 0; } }
        else { b.rx = b.x; b.ry = b.y; b.sleep = 0; }
      }
      for (const b of balls) b.el.style.transform = `translate(${b.x - R}px, ${b.y - R}px)`;
      raf = requestAnimationFrame(step);
    };
    // hold the drop until the pit scrolls into view so the rain-in isn't wasted off-screen
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      last = performance.now();
      raf = requestAnimationFrame(step);
    }, { threshold: 0.3 });
    io.observe(wrap);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      wrap.removeEventListener('pointerdown', onDown);
      wrap.removeEventListener('pointermove', onMove);
      wrap.removeEventListener('pointerup', onUp);
      wrap.removeEventListener('pointercancel', onUp);
    };
  }, []);

  return (
    <div ref={wrapRef} className="alumni-pit" style={{ position: 'relative', height: 'clamp(340px,48vw,500px)', overflow: 'hidden', touchAction: 'none', cursor: 'grab', background: '#121a23', WebkitTapHighlightColor: 'transparent', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}>
      {alumni.map((a, i) => (
        <div key={i} title={a.place} style={{ position: 'absolute', top: 0, left: 0, transform: 'translate(-100vw,0)', borderRadius: 999, background: '#e6ecf0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', willChange: 'transform' }}>
          {a.logo ? (
            <img src={a.logo} alt={a.place} draggable={false} style={{ width: '68%', height: '68%', objectFit: 'contain', pointerEvents: 'none' }} />
          ) : (
            <span style={{ fontFamily: MANTI, fontWeight: 700, fontSize: 26, color: '#0e141c', pointerEvents: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}>{a.place.split(' ').map((w) => w[0]).join('').slice(0, 3)}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState(window.location.hash);
  const [menuOpen, setMenuOpen] = useState(false);
  // recruiting banner shows only while the hero/globe is in view
  const [pastHero, setPastHero] = useState(false);
  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const [postFilter, setPostFilter] = useState<'all' | 'project' | 'blog'>('all');

  const onPostsPage = route === '#/posts';
  const onSponsorsPage = route === '#/sponsors';
  const onSensorsPage = route === '#/sensors';
  const onMembersPage = route === '#/members';
  const legalPage = LEGAL_PAGES[route];
  const activePost = POSTS.find((p) => route === `#/posts/${p.slug}`);
  const onSubPage = onPostsPage || !!activePost || onSponsorsPage || onSensorsPage || onMembersPage || !!legalPage;
  // group consecutive paragraphs so each run gets one card while images sit outside on the page
  const postChunks: (string[] | { img: string; max?: number })[] = [];
  for (const para of activePost?.body ?? []) {
    const last = postChunks[postChunks.length - 1];
    if (typeof para === 'string' && Array.isArray(last)) last.push(para);
    else postChunks.push(typeof para === 'string' ? [para] : para);
  }

  useEffect(() => {
    const onHash = () => {
      setRoute(window.location.hash);
      setMenuOpen(false);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (onSubPage) {
      window.scrollTo(0, 0);
      return;
    }
    // returning from a sub-page, the anchor target doesn't exist until
    // after this render - scroll to it manually
    const el = document.getElementById(route.slice(1));
    if (el) el.scrollIntoView();
  }, [route, onSubPage]);

  return (
    <div style={{ position: 'relative', width: '100%', overflowX: 'clip', background: '#0e141c' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
      <a href="https://docs.google.com/forms/d/e/1FAIpQLSfI87dxinWPeDd9aevwKjwfP0NtWR8uJDhHeD9qjdQPXV9oiA/viewform?usp=dialog" target="_blank" rel="noopener noreferrer" style={{ display: 'block', overflow: 'hidden', textAlign: 'center', maxHeight: pastHero ? 0 : 44, padding: pastHero ? '0 16px' : '8px 16px', transition: 'max-height 0.3s, padding 0.3s', background: '#086727', color: '#eaf2ee', fontWeight: 700, fontSize: 14, fontFamily: RESIPLE }}>Upperclassmen Recruiting is Open until 9/3! →</a>
      <header className="site-header" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 42px', background: 'rgba(14,20,28,0.85)', fontFamily: RESIPLE }}>
        <a href="#top" className="logo-link" style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#e6ecf0', flexShrink: 0 }}>
          <img src="/logo.png" alt="" style={{ width: 78, height: 78, flexShrink: 0 }} />
          <span className="logo-text" style={{ fontFamily: "'Intan',sans-serif", fontWeight: 700, fontSize: 33, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>GeoData</span>
        </a>
        <nav className="site-nav" style={{ display: 'flex', alignItems: 'center', gap: 30, fontSize: 17.5, flexShrink: 0 }}>
          <div className="site-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
            <a href="#projects" style={{ color: '#a9bcc6' }}>Projects</a>
            <a href="#/members" style={{ color: '#a9bcc6' }}>Members</a>
            <a href="#/sponsors" style={{ color: '#a9bcc6' }}>Sponsors</a>
            <a href="#/posts" style={{ color: '#a9bcc6' }}>Posts</a>
            <a href="#/sensors" style={{ color: '#a9bcc6' }}>Sensors</a>
          </div>
          <a href="#join" className="nav-join-btn" style={{ display: 'inline-block', padding: '9px 20px', borderRadius: 999, background: '#086727', color: '#eaf2ee', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0, fontFamily: RESIPLE }}>Join the team</a>
          <button
            type="button"
            className="nav-burger"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            style={{ display: 'none', flexShrink: 0, padding: 8, border: 'none', background: 'transparent', color: '#e6ecf0', cursor: 'pointer' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {menuOpen ? <><line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" /></> : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>}
            </svg>
          </button>
        </nav>
        {menuOpen && (
          // hashchange closes the menu on navigation; this onClick covers taps
          // on the link matching the current hash, which fire no hashchange
          <nav className="nav-menu" onClick={() => setMenuOpen(false)} style={{ position: 'absolute', top: '100%', left: 0, right: 0, display: 'none', flexDirection: 'column', background: 'rgba(14,20,28,0.97)', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '6px 24px 18px', fontFamily: RESIPLE }}>
            {[['#projects', 'Projects'], ['#/members', 'Members'], ['#/sponsors', 'Sponsors'], ['#/posts', 'Posts'], ['#/sensors', 'Sensors'], ['#join', 'Join the team']].map(([href, label]) => (
              <a key={href} href={href} style={{ color: '#e6ecf0', fontSize: 17, fontWeight: 700, padding: '13px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>{label}</a>
            ))}
          </nav>
        )}
      </header>
      </div>

      <span id="top" />

      {activePost ? (
      <section style={{ position: 'relative', zIndex: 2, background: '#0e141c', padding: '150px clamp(24px,5vw,72px) 110px', minHeight: '100vh' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <a href="#/posts" style={{ fontFamily: RESIPLE, fontSize: 14.5 }}>← All posts</a>
          <div style={{ fontFamily: RESIPLE, fontSize: 13, letterSpacing: '0.16em', textTransform: 'uppercase', color: activePost.tagColor, marginTop: 30 }}>{fmtTag(activePost.tag)}</div>
          <h2 style={{ fontFamily: MANTI, fontWeight: 700, fontSize: 'clamp(34px,4.6vw,56px)', letterSpacing: '-0.02em', lineHeight: 1.05, margin: '16px 0 0' }}>{activePost.title}</h2>
          <div style={{ fontFamily: RESIPLE, fontSize: 12.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7c909b', marginTop: 18 }}>{activePost.date}</div>
          <div className="team-photo-frame" style={{ padding: 14, border: `2px solid ${activePost.tagColor}`, marginTop: 56 }}>
            {activePost.photo ? (
              <img decoding="async" src={activePost.photo} alt="" style={{ display: 'block', width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
            ) : (
              <div style={{ aspectRatio: '16/9', background: '#1a2430' }} />
            )}
          </div>
          {/* text runs get lifted cards for readability; images sit on the page between them */}
          {postChunks.map((chunk, i) => (
            Array.isArray(chunk) ? (
              <div key={i} style={{ background: '#17212c', border: '1px solid rgba(255,255,255,0.07)', padding: 'clamp(24px,5vw,56px)', maxWidth: 760, margin: `${i === 0 ? 56 : 48}px auto 0` }}>
                {chunk.map((para, j) => (
                  <p key={j} style={{ fontFamily: "'Source Serif 4',Georgia,serif", fontSize: 17.5, lineHeight: 1.85, color: '#c4d1d9', margin: j === 0 ? 0 : '36px 0 0' }}>{emphasize(para)}</p>
                ))}
              </div>
            ) : (
              <div key={i} className="team-photo-frame" style={{ padding: 14, border: `2px solid ${activePost.tagColor}`, maxWidth: chunk.max ?? 640, margin: `${i === 0 ? 56 : 48}px auto 0` }}>
                <img loading="lazy" decoding="async" src={chunk.img} alt="" style={{ display: 'block', width: '100%', height: 'auto' }} />
              </div>
            )
          ))}
          {(activePost.links.length > 0 || activePost.credit) && (
            <div style={{ background: '#17212c', border: '1px solid rgba(255,255,255,0.07)', padding: 'clamp(24px,5vw,56px)', maxWidth: 760, margin: '48px auto 0' }}>
              {activePost.links.length > 0 && (
                <>
                  <div style={{ fontFamily: RESIPLE, fontSize: 13, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4fae7d' }}>Links</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
                    {activePost.links.map((link) => (
                      <a key={link.label} href={link.href} target={link.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" style={{ fontSize: 16.5, alignSelf: 'flex-start', color: '#4fae7d' }}>{link.label} ↗</a>
                    ))}
                  </div>
                </>
              )}
              {activePost.credit && (
                <div style={{ marginTop: activePost.links.length > 0 ? 28 : 0, fontFamily: RESIPLE, fontSize: 12.5, letterSpacing: '0.06em', color: '#7c909b' }}>{activePost.credit}</div>
              )}
            </div>
          )}
        </div>
      </section>
      ) : onPostsPage ? (
      <section style={{ position: 'relative', zIndex: 2, background: '#0e141c', padding: '150px clamp(24px,5vw,72px) 110px', minHeight: '100vh' }}>
        <div style={{ maxWidth: 940, margin: '0 auto' }}>
          <h2 style={H2}>Posts</h2>
          <div style={{ display: 'flex', gap: 26, marginTop: 36 }}>
            {([['all', 'All'], ['project', 'Projects'], ['blog', 'Blogs']] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPostFilter(value)}
                style={{ appearance: 'none', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 0 6px', fontFamily: RESIPLE, fontSize: 17, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: postFilter === value ? '#e6ecf0' : '#7c909b', borderBottom: `2px solid ${postFilter === value ? '#4fae7d' : 'transparent'}` }}
              >
                {label}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 48 }}>
            {POSTS.filter((post) => postFilter === 'all' || post.kind === postFilter).map((post, i) => (
              <article key={post.slug} style={i === 0 ? undefined : { borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 44, paddingTop: 44 }}>
                <a href={`#/posts/${post.slug}`} className="post-link post-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) clamp(130px,30vw,300px)', gap: 'clamp(18px,3.5vw,44px)', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: RESIPLE, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7c909b' }}>
                      {post.date} <span style={{ color: post.tagColor }}>{fmtTag(post.tag)}</span>
                    </div>
                    <h3 style={{ fontFamily: MANTI, fontWeight: 700, fontSize: 'clamp(24px,3.2vw,34px)', letterSpacing: '-0.015em', lineHeight: 1.12, margin: '14px 0 0' }}>{post.title}</h3>
                    <p style={{ fontSize: 16, lineHeight: 1.6, color: '#a9bcc6', margin: '14px 0 0' }}>{post.dek}</p>
                  </div>
                  <div style={{ padding: 10, border: `2px solid ${post.tagColor}` }}>
                    {post.photo ? (
                      <img loading="lazy" decoding="async" src={post.photo} alt="" style={{ display: 'block', width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ aspectRatio: '4/3', background: '#1a2430' }} />
                    )}
                  </div>
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>
      ) : onSensorsPage ? (
      <section style={{ position: 'relative', zIndex: 2, background: '#0e141c', padding: '150px clamp(24px,5vw,72px) 110px', minHeight: '100vh' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <h2 style={H2}>Active Sensors</h2>
          <SensorsFeed />
        </div>
      </section>
      ) : onSponsorsPage ? (
      <section style={{ position: 'relative', zIndex: 2, background: '#0e141c', padding: '150px clamp(24px,5vw,72px) 110px', minHeight: '100vh' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 'clamp(32px,4vw,64px)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ flex: '0 1 560px', minWidth: 300 }}>
              <h2 style={H2}>Sponsorships &amp; Donations</h2>
              <p style={{ ...BODY, maxWidth: 620, margin: '26px 0 0' }}>Every instrument we deploy is designed, built, and tested by students. Sponsor support directly funds the hardware, fieldwork, and research that make our projects possible.</p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 34 }}>
                <CopyEmailButton label="Become a sponsor" />
                <a href={SPONSOR_PACKET_PDF} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '13px 28px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.18)', color: '#e6ecf0', fontWeight: 700, fontSize: 17, fontFamily: RESIPLE }}>Download the packet (PDF)</a>
              </div>
            </div>
            {/* PACKET BOARD */}
            <PacketViewer />
          </div>

          {/* TIERS */}
          <div style={{ marginTop: 110 }}>
            <h3 style={{ fontFamily: MANTI, fontWeight: 700, fontSize: 'clamp(28px,3.4vw,40px)', letterSpacing: '-0.02em', margin: '16px 0 0' }}>Sponsorship tiers</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(240px,100%),1fr))', gap: 26, marginTop: 44 }}>
              {TIERS.map((tier) => (
                <div key={tier.name} style={{ background: '#141c26', borderTop: `3px solid ${tier.color}`, padding: '26px 24px' }}>
                  <div style={{ fontFamily: RESIPLE, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: tier.color }}>{tier.name}</div>
                  <div style={{ fontFamily: MANTI, fontWeight: 700, fontSize: 34, marginTop: 12 }}>{tier.amount}</div>
                  <ul style={{ margin: '18px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {tier.perks.map((perk) => (
                      <li key={perk} style={{ position: 'relative', paddingLeft: 18, fontSize: 14.5, lineHeight: 1.5, color: '#a9bcc6' }}>
                        <span style={{ position: 'absolute', left: 0, color: tier.color }}>▸</span>{perk}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* ALUMNI */}
          <div style={{ marginTop: 130 }}>
            <h2 style={H2}>Alumni Ball Pit</h2>
            <div className="team-photo-frame" style={{ padding: 14, border: '2px solid #086727', boxShadow: '10px 10px 0 rgba(8,103,39,0.35)', marginTop: 40 }}>
              <AlumniPit alumni={ALUMNI} />
            </div>
            <div style={{ marginTop: 36 }}>
              <CopyEmailButton label="Contact us for more info" />
            </div>
          </div>
        </div>
      </section>
      ) : onMembersPage ? (
      <MembersPage />
      ) : legalPage ? (
      <section style={{ position: 'relative', zIndex: 2, background: '#0e141c', padding: '150px clamp(24px,5vw,72px) 110px', minHeight: '100vh' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <div style={{ fontFamily: RESIPLE, fontSize: 13, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4fae7d' }}>CU GeoData</div>
          <h2 style={H2}>{legalPage.title}</h2>
          <div style={{ fontFamily: RESIPLE, fontSize: 13, color: '#7c909b', marginTop: 14 }}>Last updated: {legalPage.updated}</div>
          {legalPage.sections.map((s) => (
            <div key={s.h} style={{ marginTop: 44 }}>
              <h3 style={{ fontFamily: MANTI, fontWeight: 600, fontSize: 22, letterSpacing: '-0.01em', margin: 0 }}>{s.h}</h3>
              {s.body.map((para, i) => (
                <p key={i} style={{ fontSize: 15.5, lineHeight: 1.65, color: '#a9bcc6', margin: '12px 0 0', maxWidth: 680 }}>{para}</p>
              ))}
            </div>
          ))}
        </div>
      </section>
      ) : (
      <>
      <Globe />

      {/* PROJECTS */}
      <section id="projects" style={{ position: 'relative', zIndex: 2, background: '#0e141c', padding: '120px clamp(24px,5vw,72px) 48px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <h2 style={{ ...H2, maxWidth: '16ch' }}>Instruments built by students, deployed in the field</h2>
          <p style={{ ...BODY, margin: '26px 0 0' }}>We are a Student Project Team at the intersection of the Earth Sciences, Engineering, Data Science, and beyond, focused on monitoring the world around us. We are the only Cornell project team affiliated with both the College of Engineering and the Department of Earth and Atmospheric Sciences, giving our members a unique opportunity to pursue true scientific research, experience hands-on engineering prototyping, and initiate, manage, and lead their own projects.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(420px,100%),1fr))', gap: 26, marginTop: 56 }}>
            {PROJECTS.map((proj) => (
              <article key={proj.title} style={{ gridColumn: proj.photo2 ? '1 / -1' : undefined }}>
                {proj.photo && proj.photo2 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(280px,100%),1fr))', gap: 26 }}>
                    <img loading="lazy" decoding="async" src={proj.photo} alt={proj.title} style={{ display: 'block', width: '100%', aspectRatio: '16/10', objectFit: 'cover', objectPosition: proj.photoPosition }} />
                    <img loading="lazy" decoding="async" src={proj.photo2} alt="" style={{ display: 'block', width: '100%', aspectRatio: '16/10', objectFit: 'cover' }} />
                  </div>
                ) : proj.photo ? (
                  <img loading="lazy" decoding="async" src={proj.photo} alt={proj.title} style={{ display: 'block', width: '100%', aspectRatio: proj.photoAspect ?? '16/10', objectFit: 'cover', objectPosition: proj.photoPosition }} />
                ) : (
                  <div style={{ aspectRatio: '16/10', background: '#1a2430' }} />
                )}
                <div style={{ padding: '20px 0 0' }}>
                  <div style={{ fontFamily: RESIPLE, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: proj.tagColor }}>{fmtTag(proj.tag)}</div>
                  <h3 style={{ fontFamily: MANTI, fontWeight: 600, fontSize: 25, margin: '12px 0 0', letterSpacing: '-0.01em' }}>
                    {proj.slug ? (
                      <a href={`#/posts/${proj.slug}`} className="post-link" aria-label={`Read the ${proj.title} post`}>{proj.title} <span aria-hidden="true" style={{ fontSize: 19, color: '#4fae7d' }}>→</span></a>
                    ) : (
                      proj.title
                    )}
                  </h3>
                  {proj.body && <p style={{ fontSize: 15, lineHeight: 1.6, color: '#a9bcc6', margin: '12px 0 0' }}>{proj.body}</p>}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM PHOTO */}
      <section id="team" style={{ position: 'relative', zIndex: 2, background: '#0e141c', padding: '48px clamp(24px,5vw,72px) 96px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <figure style={{ margin: 0 }}>
            <div className="team-photo-frame" style={{ position: 'relative', padding: 14, border: '2px solid #086727', boxShadow: '10px 10px 0 rgba(8,103,39,0.35)' }}>
              <img loading="lazy" decoding="async" src="/team.jpg" alt="The GeoData team on the stairs of Upson Hall" style={{ display: 'block', width: '100%', height: 'auto', aspectRatio: '1600/1066' }} />
              <figcaption className="team-photo-caption" style={{ position: 'absolute', bottom: 30, left: 30, background: '#086727', color: '#eaf2ee', fontFamily: "'Intan',sans-serif", fontSize: 'clamp(16px,2.2vw,24px)', letterSpacing: '0.04em', padding: '10px 22px', whiteSpace: 'nowrap' }}>Team Photo '25 – '26</figcaption>
            </div>
          </figure>
        </div>
      </section>

      {/* JOIN */}
      <section id="join" style={{ position: 'relative', zIndex: 2, background: '#0e141c', padding: '130px clamp(24px,5vw,72px)' }}>
        <div style={{ maxWidth: 820 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: RESIPLE, fontSize: 20, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4fae7d' }}>
            {/* tethersonde stand-in for the usual "we're live" dot */}
            <svg className="balloon-bob" width="34" height="40" viewBox="-7 -7 34 40" fill="none" aria-hidden="true">
              {/* hand-drawn emphasis dashes radiating off the balloon */}
              <path d="M10 -5.5 L10 -2.8" stroke="#4fae7d" strokeWidth="1.7" strokeLinecap="round" />
              <path d="M1.2 -2.4 L3.4 0" stroke="#4fae7d" strokeWidth="1.7" strokeLinecap="round" />
              <path d="M18.8 -2.4 L16.6 0" stroke="#4fae7d" strokeWidth="1.7" strokeLinecap="round" />
              <path d="M-4.5 6 L-1.6 6.8" stroke="#4fae7d" strokeWidth="1.7" strokeLinecap="round" />
              <path d="M24.5 6 L21.6 6.8" stroke="#4fae7d" strokeWidth="1.7" strokeLinecap="round" />
              <circle cx="10" cy="8.5" r="7" stroke="#4fae7d" strokeWidth="2" />
              <path d="M8 15 L10 18 L12 15" stroke="#4fae7d" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M10 18 C 10 21, 8.5 22.5, 10 25" stroke="#4fae7d" strokeWidth="1.4" strokeLinecap="round" fill="none" />
              <rect x="7.5" y="25" width="5" height="5" stroke="#4fae7d" strokeWidth="1.6" />
            </svg>
            Recruitment open
          </div>
          <h2 style={{ fontFamily: MANTI, fontWeight: 700, fontSize: 'clamp(42px,6.2vw,80px)', letterSpacing: '-0.03em', lineHeight: 1, margin: '20px 0 0' }}>Design, Deploy,<br /><span style={{ color: '#4fae7d' }}>Discover</span></h2>
          <p style={{ ...BODY, maxWidth: 560, margin: '26px 0 0' }}>Build the instruments a changing planet needs. GeoData welcomes students of every major, from CS and MechE to earth science and design. If you want to build hardware that ends up outdoors collecting real data, there's a subteam for you.</p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 38 }}>
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSfI87dxinWPeDd9aevwKjwfP0NtWR8uJDhHeD9qjdQPXV9oiA/viewform?usp=dialog" target="_blank" rel="noopener noreferrer" style={PILL_PRIMARY}>Upperclassmen Recruiting: DUE 9/3</a>
            <a href="https://docs.google.com/forms/d/1u6mjjlEL9Y4fdN8RFB1K6jTpS7aYig-wt54i3YyhtS8/viewform" target="_blank" rel="noopener noreferrer" style={PILL}>Underclassmen Interest Form</a>
            <a href="https://docs.google.com/spreadsheets/d/1ZYLfV6FjYPi1sL58lr9eAjuKM37q2tXTtEAOSyoPfpU/edit?usp=sharing" target="_blank" rel="noopener noreferrer" style={PILL}>Coffee Chat Contacts</a>
          </div>
        </div>
      </section>

      {/* RECRUITING TIMELINE */}
      <RecruitingTimeline />

      </>
      )}

      {/* FOOTER - supported by + contact */}
      <footer id="partners" style={{ position: 'relative', zIndex: 2, background: '#0e141c', padding: '84px clamp(24px,5vw,72px) 36px' }}>
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '48px 72px', justifyContent: 'space-between' }}>
            <div style={{ flex: '1 1 220px' }}>
              <span style={{ fontFamily: MANTI, fontWeight: 600, fontSize: 20 }}>CU GeoData</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14, fontSize: 14, color: '#5f7078' }}>
                <span>Cornell University</span>
                <span>Ithaca, NY</span>
              </div>
              <img src="/cornell-engineering.svg" alt="Cornell Duffield College of Engineering" style={{ display: 'block', height: 22, width: 'auto', maxWidth: '100%', marginTop: 20 }} />
            </div>
            <div style={{ flex: '1 1 220px' }}>
              <div style={{ fontFamily: RESIPLE, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7c909b' }}>Supported by</div>
              <div className="partners-grid" style={{ display: 'grid', gridTemplateRows: 'repeat(2, auto)', gridAutoFlow: 'column', gridAutoColumns: 'max-content', gap: '8px 40px', marginTop: 14, fontSize: 14, color: '#a9bcc6' }}>
                {PARTNERS.map((partner) => (
                  <span key={partner}>{partner}</span>
                ))}
              </div>
            </div>
            <div style={{ flex: '1 1 220px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
                <span style={{ fontFamily: RESIPLE, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7c909b' }}>Contact</span>
                <div style={{ display: 'flex', gap: 16 }}>
                  <a href="https://www.instagram.com/cugeodata/" target="_blank" rel="noopener noreferrer" aria-label="CU GeoData on Instagram" style={{ color: '#a9bcc6', display: 'inline-flex' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.757 6.162 6.162 6.162 3.405 0 6.162-2.757 6.162-6.162 0-3.402-2.757-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.645-1.44-1.44 0-.794.646-1.439 1.44-1.439.793 0 1.44.645 1.44 1.439z"/></svg>
                  </a>
                  <a href="https://www.linkedin.com/company/cu-geodata/" target="_blank" rel="noopener noreferrer" aria-label="CU GeoData on LinkedIn" style={{ color: '#a9bcc6', display: 'inline-flex' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/></svg>
                  </a>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14, fontSize: 14 }}>
                <a href="mailto:cugeodata@cornell.edu">cugeodata@cornell.edu</a>
                <span style={{ color: '#a9bcc6' }}>Upson Hall Ithaca, NY 14853</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 30, display: 'flex', flexWrap: 'wrap', gap: '6px 20px', alignItems: 'center', fontSize: 10.5, color: '#5f7078' }}>
            <span>© {new Date().getFullYear()} CU GeoData. All rights reserved.</span>
            <a href="#/privacy" style={{ color: '#7c909b' }}>Privacy Policy</a>
            <a href="#/terms" style={{ color: '#7c909b' }}>Terms of Use</a>
            <a href="https://accessibility.cornell.edu" style={{ color: '#7c909b' }}>Web Accessibility Assistance</a>
            <a href="https://officeofcivilrights.cornell.edu/what-we-do/equal-opportunity-affirmative-action/" style={{ color: '#7c909b' }}>Equal Education and Employment Opportunity</a>
          </div>
          <div style={{ marginTop: 6, fontSize: 10.5, color: '#4d5b63', maxWidth: 720 }}>
            CU GeoData is a registered student organization of Cornell University. This website is maintained by its student members and does not represent the official views of Cornell University.
          </div>
        </div>
      </footer>

    </div>
  );
}
