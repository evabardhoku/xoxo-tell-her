import { Link } from '@tanstack/react-router';

export function RippleMark({ small = false }: { small?: boolean }) {
  return <span className={small ? 'ripple-mark small' : 'ripple-mark'} aria-hidden="true"><i /><i /><i /><b /></span>;
}

export function Brand({ signature = false }: { signature?: boolean }) {
  return <Link to="/" className={signature ? 'brand brand-signature' : 'brand'} aria-label="TellHer home"><RippleMark small /><span>{signature && <span className="brand-kiss">XOXO, </span>}TellHer<span className="brand-dot">.</span></span></Link>;
}

export function EmptyRipple() {
  return <div className="empty-ripple" aria-hidden="true"><RippleMark /><span className="trust-node node-one" /><span className="trust-node node-two" /></div>;
}
/** Abstract trust-ripple field for the landing hero: you at the centre, trust travelling outward. */
export function HeroRipples() {
 const rings = [70, 135, 205, 280, 360];
 const nodes: [number, number, number][] = [[1, 40, 0], [1, 160, 0], [1, 285, 0], [2, 95, 1], [2, 220, 1], [2, 330, 1], [3, 20, 2], [3, 140, 2], [3, 255, 2]];
 return <svg className="hero-art hero-ripples" viewBox="0 0 1600 1000" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
  <g transform="translate(1180 500)">
   {rings.map((r, i) => <circle key={r} r={r} className={`hr-ring hr-ring-${i}`} />)}
   {nodes.map(([ring, deg, tone], i) => { const r = rings[ring]!; const a = (deg * Math.PI) / 180; return <circle key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r} r={ring === 1 ? 6 : 4.5} className={`hr-node hr-node-${tone}`} />; })}
   <circle r="11" className="hr-core" />
  </g>
 </svg>;
}

/** Small concentric rings that gently expand to show how far a Trust Ripple travels. */
export function ReachRings({ level }: { level: 0 | 1 | 2 | 3 }) {
 return <svg className="reach-rings-mini" viewBox="0 0 120 120" aria-hidden="true">
  {[22, 38, 54].map((r, i) => <circle key={`${r}-${level}`} cx="60" cy="60" r={r} className={`rr-ring ${i < level ? 'is-on' : ''}`} style={{ animationDelay: `${i * 90}ms` }} />)}
  <circle cx="60" cy="60" r="6" className="rr-core" />
 </svg>;
}
