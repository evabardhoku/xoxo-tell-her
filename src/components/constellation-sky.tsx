import { RippleAuthor } from '@/components/ripple-author';
import { Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ArrowRight, Minus, Plus, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildSky, echoWords, placeTitle, type SkyRow, type Star } from '@/lib/constellations';

/** The night sky of Ripples the viewer may open, one constellation per situation. Pinch, wheel or buttons to zoom. */
export function ConstellationSky({ rows }: { rows: SkyRow[] }) {
 const sky = useMemo(() => buildSky(rows), [rows]);
 const [sel, setSel] = useState<Star | null>(null);
 if (!rows.length) return <section className="empty-panel"><h2>The sky is still quiet.</h2><p>As Ripples reach you through your circles, they’ll gather here as constellations.</p></section>;
 return <>
  <TransformWrapper minScale={1} maxScale={3.5} wheel={{ step: 0.08 }} doubleClick={{ mode: 'zoomIn', step: 0.6 }} centerOnInit>
   {({ zoomIn, zoomOut, resetTransform }) => <div className="sky-frame">
    <div className="sky-zoom" role="group" aria-label="Zoom the sky">
     <button type="button" onClick={() => zoomIn()} aria-label="Zoom in"><Plus size={15} /></button>
     <button type="button" onClick={() => zoomOut()} aria-label="Zoom out"><Minus size={15} /></button>
     <button type="button" onClick={() => resetTransform()} aria-label="Reset view"><RotateCcw size={14} /></button>
    </div>
    <TransformComponent wrapperClass="sky-wrap" contentClass="sky-content">
     <section className="sky sky--large" aria-label="Constellations of Ripples by situation">
      <svg className="sky-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
       {sky.map(c => c.stars.slice(1).map((s, i) => <line key={s.id} x1={c.stars[i]!.x} y1={c.stars[i]!.y} x2={s.x} y2={s.y} />))}
      </svg>
      {sky.map(c => <div key={c.category} role="group" aria-label={`${placeTitle(c.category)}, ${c.stars.length} ${c.stars.length === 1 ? 'Ripple' : 'Ripples'}`}>
       <Link to="/constellations/$topic" params={{ topic: c.category }} className="sky-label sky-label--link" style={{ left: `${c.x}%`, top: `${Math.max(2, c.y - 15)}%` }}>{placeTitle(c.category)}</Link>
       {c.stars.map(s => <button key={s.id} type="button" className="star" data-echo={s.echo_level} data-outcome={s.has_outcome} data-letters={Boolean(s.has_letters)} data-active={sel?.id === s.id}
        style={{ left: `${s.x}%`, top: `${s.y}%` }} aria-label={`${c.category}: ${s.excerpt}`} onClick={() => setSel(s)} onFocus={() => setSel(s)} />)}
      </div>)}
     </section>
    </TransformComponent>
    {sel && <div className="sky-card sky-card--docked" role="dialog" aria-label="Ripple preview">
     <div className="question-meta"><span className="question-category">{placeTitle(sel.category)}</span><button type="button" className="ml-auto" aria-label="Close preview" onClick={() => setSel(null)}><X size={14} /></button></div>
     <RippleAuthor identity={sel} />
     <p className="sky-excerpt">{sel.excerpt}{sel.excerpt.length >= 140 ? '…' : ''}</p>
     <ul className="sky-tags">{sel.echo_level > 0 && <li>{echoWords[sel.echo_level]}</li>}{sel.has_outcome && <li>Includes what happened next</li>}{sel.has_letters && <li>Letters from the Other Side</li>}</ul>
     <div className="flex flex-wrap gap-2"><Button asChild size="sm" variant="soft"><Link to="/askher/$id" params={{ id: sel.id }}>Open Ripple<ArrowRight /></Link></Button><Button asChild size="sm" variant="ghost"><Link to="/constellations/$topic" params={{ topic: sel.category }}>Visit this constellation</Link></Button></div>
    </div>}
   </div>}
  </TransformWrapper>
  <dl className="sky-legend"><div><dt><span className="star" data-echo="0" /></dt><dd>A Ripple</dd></div><div><dt><span className="star" data-echo="3" /></dt><dd>Echoed by women who’ve been here</dd></div><div><dt><span className="star" data-outcome="true" /></dt><dd>Includes what happened next</dd></div><div><dt><span className="star" data-letters="true" /></dt><dd>Has Letters from the Other Side</dd></div></dl>
  <ul className="sky-places" aria-label="Constellations">{sky.map(c => <li key={c.category}><Link to="/constellations/$topic" params={{ topic: c.category }} className="sky-place"><strong>{placeTitle(c.category)}</strong><span className="form-note">{c.stars.length} {c.stars.length === 1 ? 'Ripple' : 'Ripples'}</span><ArrowRight size={14} /></Link></li>)}</ul>
 </>;
}
