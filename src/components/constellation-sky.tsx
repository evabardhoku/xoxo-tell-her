import { Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ArrowRight, Minus, Plus, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildSky, cometPath, echoWords, isComet, placeTitle, type SkyRow, type Star } from '@/lib/constellations';

/** The night sky of anonymous stars the viewer may open, one constellation per situation. Pinch, wheel or buttons to zoom. */
export function ConstellationSky({ rows }: { rows: SkyRow[] }) {
 const sky = useMemo(() => buildSky(rows), [rows]);
 const comets = useMemo(() => rows.filter(isComet), [rows]);
 const [sel, setSel] = useState<Star | null>(null);
 if (!rows.length) return <section className="empty-panel"><h2>The sky is still quiet.</h2><p>As anonymous stars reach you through your circles, they’ll gather here as constellations.</p></section>;
 return <>
  <div className="sky-with-legend">
   <TransformWrapper minScale={1} maxScale={3.5} wheel={{ step: 0.08 }} doubleClick={{ mode: 'zoomIn', step: 0.6 }} centerOnInit>
    {({ zoomIn, zoomOut, resetTransform }) => <div className="sky-frame">
     <div className="sky-zoom" role="group" aria-label="Zoom the sky">
      <Button size="icon" variant="ghost" onClick={() => zoomIn()} aria-label="Zoom in" title="Zoom in"><Plus size={15} /></Button>
      <Button size="icon" variant="ghost" onClick={() => zoomOut()} aria-label="Zoom out" title="Zoom out"><Minus size={15} /></Button>
      <Button size="icon" variant="ghost" onClick={() => resetTransform()} aria-label="Reset view" title="Reset view"><RotateCcw size={14} /></Button>
     </div>
     <TransformComponent wrapperClass="sky-wrap" contentClass="sky-content">
      <section className="sky sky--large" aria-label="Constellations of anonymous stars by situation">
       <svg className="sky-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        {sky.map(c => c.stars.slice(1).map((s, i) => <line key={s.id} x1={c.stars[i]?.x} y1={c.stars[i]?.y} x2={s.x} y2={s.y} />))}
       </svg>
       {sky.map(c => <div key={c.category} role="group" aria-label={placeTitle(c.category)}>
        <Link to="/constellations/$topic" params={{ topic: c.category }} className="sky-label sky-label--link" style={{ left: `${c.x}%`, top: `${Math.max(2, c.y - 15)}%` }}>{placeTitle(c.category)}</Link>
        {c.stars.map(s => <button key={s.id} type="button" className="star" data-echo={s.echo_level} data-outcome={s.has_outcome} data-letters={Boolean(s.has_letters)} data-active={sel?.id === s.id}
         style={{ left: `${s.x}%`, top: `${s.y}%` }} aria-label={`${c.category}: ${s.excerpt}`} onClick={() => setSel(s)} onFocus={() => setSel(s)} />)}
       </div>)}
       {comets.map(c => { const p = cometPath(c.id); return <button key={c.id} type="button" className="comet" data-active={sel?.id === c.id}
        style={{ top: `${p.top}%`, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`, ['--comet-drift' as string]: `${p.drift}px` }}
        aria-label={`New star awaiting its first perspective: ${c.excerpt}`} onClick={() => setSel({ ...c, x: 0, y: 0 })}><span className="comet-tail" /><span className="comet-head" /></button>; })}
      </section>
     </TransformComponent>
     {sel && <div className="sky-card sky-card--docked" role="dialog" aria-label="Star preview">
      <div className="question-meta"><span className="question-category">{placeTitle(sel.category)}</span><button type="button" className="ml-auto" aria-label="Close preview" onClick={() => setSel(null)}><X size={14} /></button></div>
      <p className="sky-excerpt">{sel.excerpt}{sel.excerpt.length >= 140 ? '…' : ''}</p>
      <ul className="sky-tags">{isComet(sel) && <li>New star — awaiting its first perspective</li>}{sel.echo_level > 0 && <li>{echoWords[sel.echo_level]}</li>}{sel.has_outcome && <li>Includes what happened next</li>}{sel.has_letters && <li>Letters from the Other Side</li>}</ul>
      <div className="flex flex-wrap gap-2"><Button asChild size="sm" variant="soft"><Link to="/askher/$id" params={{ id: sel.id }}>{isComet(sel) ? 'Give the first perspective' : 'Open star'}<ArrowRight /></Link></Button><Button asChild size="sm" variant="ghost"><Link to="/constellations/$topic" params={{ topic: sel.category }}>Visit this constellation</Link></Button></div>
     </div>}
    </div>}
   </TransformWrapper>
   <aside className="sky-legend-panel" aria-label="How to read the sky">
    <h2 className="eyebrow">How to read the sky</h2>
    <ul>
     <li><span className="legend-star" aria-hidden /><span><strong>Star</strong> — an anonymous discussion. Its light never reveals who asked.</span></li>
     <li><span className="legend-star legend-star--echo" aria-hidden /><span><strong>Bright star</strong> — echoed by other women who lived something similar.</span></li>
     <li><span className="legend-star legend-star--ring" aria-hidden /><span><strong>Ringed star</strong> — includes what happened next.</span></li>
     <li><span className="legend-star legend-star--letters" aria-hidden /><span><strong>Dotted ring</strong> — Letters from the Other Side wait inside.</span></li>
     <li><span className="legend-star legend-star--comet" aria-hidden /><span><strong>Comet</strong> — a brand-new star crossing the sky. Catch it and give the first perspective; once answered, it joins a constellation.</span></li>
    </ul>
    <p className="form-note">Stars of one situation gather into a constellation. Lines connect stories that share a place in the sky.</p>
   </aside>
  </div>
 </>;
}
