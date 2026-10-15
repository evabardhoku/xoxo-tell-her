import { perspectives, type Counts } from '@/lib/perspectives';

const total = (c: Counts) => Object.values(c).reduce((a, b) => a + b, 0);
const word = (n: number) => `${n} ${n === 1 ? 'perspective' : 'perspectives'}`;

export function PerspectiveMap({ counts }: { counts: Counts }) {
 const t = total(counts);
 return <section className="perspective-map" aria-labelledby="pm-title">
  <div className="eyebrow" id="pm-title">PERSPECTIVE MAP</div>
  <p className="form-note">{t === 0 ? 'No perspectives shared yet.' : `${word(t)} shared so far. Each one is a point of view, not a verdict.`}</p>
  <ul className="pm-rows">{perspectives.map((p, i) => {
   const n = counts[p.value]; const pct = t ? Math.round((n / t) * 100) : 0;
   return <li key={p.value} className="pm-row">
    <span className="pm-label">{p.label}</span>
    <span className="pm-track" role="meter" aria-label={p.label} aria-valuemin={0} aria-valuemax={t} aria-valuenow={n} aria-valuetext={word(n)}><span className={`pm-fill pm-fill-${i}`} style={{ width: `${pct}%` }} /></span>
    <span className="pm-count">{n}</span>
   </li>;
  })}</ul>
 </section>;
}

/** Small, quiet distribution strip for feed cards. */
export function PerspectiveStrip({ counts }: { counts: Counts }) {
 const t = total(counts); if (!t) return null;
 const desc = perspectives.map(p => `${p.label}: ${counts[p.value]}`).join(', ');
 return <span className="pm-strip" role="img" aria-label={`Perspectives — ${desc}`} title={desc}>
  {perspectives.map((p, i) => counts[p.value] ? <span key={p.value} className={`pm-fill pm-fill-${i}`} style={{ flexGrow: counts[p.value] }} /> : null)}
 </span>;
}
