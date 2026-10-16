import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

/** Horizontal scroll panel with side arrows; arrows hide at the ends. */
export function ScrollPanel({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
 const track = useRef<HTMLDivElement>(null);
 const [atStart, setAtStart] = useState(true); const [atEnd, setAtEnd] = useState(true);
 const update = () => { const el = track.current; if (!el) return; setAtStart(el.scrollLeft <= 4); setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4); };
 useEffect(() => { update(); const el = track.current; if (!el) return; const ro = new ResizeObserver(update); ro.observe(el); return () => ro.disconnect(); }, [children]);
 const nudge = (dir: 1 | -1) => { const el = track.current; if (el) el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.8, 240), behavior: 'smooth' }); };
 return <div className={`scroll-panel ${className ?? ''}`}>
  <Button type="button" variant="outline" size="icon" className="scroll-arrow" aria-label={`Scroll ${label} back`} disabled={atStart} onClick={() => nudge(-1)}><ChevronLeft /></Button>
  <div className="scroll-track" ref={track} onScroll={update} tabIndex={0} aria-label={label}>{children}</div>
  <Button type="button" variant="outline" size="icon" className="scroll-arrow" aria-label={`Scroll ${label} forward`} disabled={atEnd} onClick={() => nudge(1)}><ChevronRight /></Button>
 </div>;
}
