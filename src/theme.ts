import type React from 'react';

// the two site fonts. Manti Sans is display-only (no period glyph - decimals
// render as tofu), so anything numeric or body-sized uses Resiple.
export const RESIPLE = "'Resiple',sans-serif";
export const MANTI = "'Manti Sans',sans-serif";

// shared text styles for the big section headings and their body copy
export const H2: React.CSSProperties = { fontFamily: MANTI, fontWeight: 700, fontSize: 'clamp(36px,4.8vw,60px)', letterSpacing: '-0.02em', lineHeight: 1.02, margin: '18px 0 0' };
export const BODY: React.CSSProperties = { fontSize: 17, lineHeight: 1.65, color: '#a9bcc6' };
// recruitment call-to-action pills; PILL is the outlined variant, PILL_PRIMARY the filled one
export const PILL: React.CSSProperties = { display: 'inline-block', padding: '15px 32px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.18)', color: '#e6ecf0', fontWeight: 700, fontSize: 18.5, fontFamily: RESIPLE };
export const PILL_PRIMARY: React.CSSProperties = { ...PILL, border: 0, background: '#086727', color: '#eaf2ee' };
