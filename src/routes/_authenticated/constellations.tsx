import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { pageHead } from '@/lib/metadata';
import { buildSky, echoWords, type SkyRow, type Star } from '@/lib/constellations';

const skyQuery = { queryKey: ['constellation'], queryFn: async () => { const { data, error } = await supabase.rpc('tellher_constellation'); if (error) throw error; return (data ?? []) as SkyRow[]; } };

export const Route = createFileRoute('/_authenticated/constellations')({
 loader: ({ context }) => context.queryClient.ensureQueryData(skyQuery),
 head: () => pageHead('Constellations', 'Similar experiences around yours, gathered by topic.'),
 component: Constellations,
});

function Constellations() {
 const { data } = useSuspenseQuery(skyQuery);
 const sky = useMemo(() => buildSky(data), [data]);
 const [sel, setSel] = useState<Star | null>(null);
 return <>
  <div className="page-heading"><div><div className="eyebrow">CONSTELLATIONS</div><h1>You’re not the only one.</h1><p>Every star is a Ripple that reached you, gathered by topic. Warmer stars were echoed by other women; a soft ring means the woman who asked shared what happened next.</p></div></div>
  {!data.length ? <section className="empty-panel"><h2>The sky is still quiet.</h2><p>As Ripples reach you through your circles and the community, they’ll gather here.</p></section> : <>
   <section className="sky" aria-label="Constellations of Ripples by topic">
    <svg className="sky-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
     {sky.map(c => c.stars.slice(1).map((s, i) => <line key={s.id} x1={c.stars[i]!.x} y1={c.stars[i]!.y} x2={s.x} y2={s.y} />))}
    </svg>
    {sky.map(c => <div key={c.category} role="group" aria-label={`${c.category}, ${c.stars.length} ${c.stars.length === 1 ? 'Ripple' : 'Ripples'}`}>
     <span className="sky-label" style={{ left: `${c.x}%`, top: `${Math.max(2, c.y - 15)}%` }}>{c.category}</span>
     {c.stars.map(s => <button key={s.id} type="button" className="star" data-echo={s.echo_level} data-outcome={s.has_outcome} data-active={sel?.id === s.id}
      style={{ left: `${s.x}%`, top: `${s.y}%` }} aria-label={`${c.category}: ${s.excerpt}`} onClick={() => setSel(s)} onMouseEnter={() => setSel(s)} onFocus={() => setSel(s)} />)}
    </div>)}
    {sel && <div className="sky-card" role="dialog" aria-label="Ripple preview" style={{ left: `${Math.min(70, Math.max(30, sel.x))}%`, top: sel.y > 55 ? undefined : `${sel.y + 6}%`, bottom: sel.y > 55 ? `${100 - sel.y + 6}%` : undefined }}>
     <div className="question-meta"><span className="question-category">{sel.category}</span><button type="button" className="ml-auto" aria-label="Close preview" onClick={() => setSel(null)}><X size={14} /></button></div>
     <p className="sky-excerpt">{sel.excerpt}{sel.excerpt.length >= 140 ? '…' : ''}</p>
     <ul className="sky-tags">{sel.echo_level > 0 && <li>{echoWords[sel.echo_level]}</li>}{sel.has_outcome && <li>Includes what happened next</li>}</ul>
     <Button asChild size="sm" variant="soft"><Link to="/askher/$id" params={{ id: sel.id }}>Open Ripple<ArrowRight /></Link></Button>
    </div>}
   </section>
   <dl className="sky-legend"><div><dt><span className="star" data-echo="0" /></dt><dd>A Ripple</dd></div><div><dt><span className="star" data-echo="3" /></dt><dd>Echoed by other women</dd></div><div><dt><span className="star" data-outcome="true" /></dt><dd>Includes what happened next</dd></div></dl>
   <ul className="sky-topics" aria-label="Topics">{sky.map(c => <li key={c.category}><Link to="/askher" search={{ category: c.category }} className="member-link">{c.category}</Link> <span className="form-note">· {c.stars.length}</span></li>)}</ul>
  </>}
 </>;
}
