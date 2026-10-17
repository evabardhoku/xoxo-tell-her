import * as Dialog from '@radix-ui/react-dialog';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, Check, Compass, Feather, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { guideSteps, rememberGuideVisit, shouldAutoOpenGuide } from '@/lib/user-guide';

export function UserGuide({ userId }: { userId: string }) {
 const go = useNavigate();
 const { pathname } = useLocation();
 const [open, setOpen] = useState(false);
 const [index, setIndex] = useState(0);
 const [moving, setMoving] = useState(false);
 const [error, setError] = useState('');
 const openedFor = useRef<string | null>(null);
 const step = guideSteps[index] ?? guideSteps[0];

 useEffect(() => {
  if (openedFor.current === userId) return;
  openedFor.current = userId;
  setIndex(0);
  try {
   const first = shouldAutoOpenGuide(window.localStorage, userId);
   if (first) rememberGuideVisit(window.localStorage, userId);
   setOpen(first);
  } catch { setOpen(false); }
 }, [userId]);

 useEffect(() => {
  if (!open || !step?.target) return;
  const elements = document.querySelectorAll<HTMLElement>(`[data-guide="${step.target}"]`);
  elements.forEach(element => element.setAttribute('data-guide-current', 'true'));
  return () => elements.forEach(element => element.removeAttribute('data-guide-current'));
 }, [open, step, pathname]);

 async function visit(next: number) {
  const destination = guideSteps[next];
  if (!destination || moving) return;
  setMoving(true); setError('');
  try {
   if (destination.page) await go({ to: destination.page, search: destination.page === '/search' ? { q: '' } : {} });
   setIndex(next);
  } catch { setError('This page could not be opened. Please try again.'); }
  finally { setMoving(false); }
 }

 if (!step) return null;
 return <Dialog.Root modal={false} open={open} onOpenChange={setOpen}>
  <Dialog.Trigger asChild><Button variant="soft" size="icon" className="tellher-guide-trigger" title="TellHer guide" aria-label="Open TellHer guide" onClick={() => { setIndex(0); setError(''); }}><Compass /></Button></Dialog.Trigger>
  <Dialog.Portal>
   <Dialog.Content className={`tellher-guide-panel tellher-guide-panel--${step.tone}`} onInteractOutside={event => event.preventDefault()}>
    <div className="tellher-guide-header"><span><Compass size={15} /> Your TellHer guide</span><Dialog.Close asChild><Button variant="ghost" size="icon" aria-label="Close guide"><X /></Button></Dialog.Close></div>
    <div className="tellher-guide-scroll">
     <div className="tellher-guide-emblem" aria-hidden="true"><i /><i /><Feather /></div>
     <p className="tellher-guide-count">Chapter {index + 1} of {guideSteps.length}</p>
     <div aria-live="polite" aria-atomic="true"><Dialog.Title className="tellher-guide-title">{step.title}</Dialog.Title><Dialog.Description className="tellher-guide-intro">{step.intro}</Dialog.Description></div>
     <ul className="tellher-guide-points">{step.points.map(point => <li key={point}>{point}</li>)}</ul>
     {error && <p role="alert" className="form-note form-error">{error}</p>}
     <div className="tellher-guide-actions">
      <Button variant="outline" disabled={index === 0 || moving} aria-label="Previous guide chapter" onClick={() => void visit(index - 1)}><ArrowLeft />Back</Button>
      {index === guideSteps.length - 1 ? <Dialog.Close asChild><Button><Check />Finish</Button></Dialog.Close> : <Button disabled={moving} onClick={() => void visit(index + 1)}>{moving ? 'Opening…' : index === 0 ? 'Start tour' : 'Next'}<ArrowRight /></Button>}
     </div>
     <Dialog.Close asChild><Button variant="link" className="tellher-guide-skip">Skip tour</Button></Dialog.Close>
     <details className="tellher-guide-chapters"><summary>All chapters</summary><ol>{guideSteps.map((chapter, number) => <li key={chapter.title}><Button variant="ghost" disabled={moving} aria-current={number === index ? 'step' : undefined} onClick={() => void visit(number)}><span>{number + 1}</span>{chapter.title}</Button></li>)}</ol></details>
    </div>
   </Dialog.Content>
  </Dialog.Portal>
 </Dialog.Root>;
}