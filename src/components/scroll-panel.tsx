import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';

/** Vertical scroll panel with up/down arrows on the side; arrows hide at the ends. Children should be <li> items. */
export function ScrollPanel({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
 const track = useRef<HTMLUListElement>(null);
 const [atStart, setAtStart] = useState(true); const [atEnd, setAtEnd] = useState(true);
 const update = () => { const el = track.current; if (!el) return; setAtStart(el.scrollTop <= 4); setAtEnd(el.scrollTop + el.clientHeight >= el.scrollHeight - 4); };
 useEffect(() => { update(); const el = track.current; if (!el) return; const ro = new ResizeObserver(update); ro.observe(el); return () => ro.disconnect(); }, [children]);
 const nudge = (dir: 1 | -1) => { const el = track.current; if (el) el.scrollBy({ top: dir * Math.max(el.clientHeight * 0.8, 200), behavior: 'smooth' }); };
 return <div className={`scroll-panel ${className ?? ''}`}>
  <ul className="scroll-track" ref={track} onScroll={update} aria-label={label}>{children}</ul>
  <div className="scroll-arrows">
   <Button type="button" variant="outline" size="icon" className="scroll-arrow" aria-label={`Scroll ${label} up`} disabled={atStart} onClick={() => nudge(-1)}><ChevronUp /></Button>
   <Button type="button" variant="outline" size="icon" className="scroll-arrow" aria-label={`Scroll ${label} down`} disabled={atEnd} onClick={() => nudge(1)}><ChevronDown /></Button>
  </div>
 </div>;
}
