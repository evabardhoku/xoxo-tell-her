import { LogOut } from 'lucide-react';
import { quickExit, safetyResources } from '@/lib/safety';

export function QuickExit() {
 return <button type="button" className="quick-exit" onClick={quickExit} aria-label="Quick exit: leave TellHer immediately"><LogOut size={14} aria-hidden /><span>Quick exit</span></button>;
}

export function SafetyPanel() {
 return <aside className="safety-panel" role="note" aria-label="Safety support">
  <p>If you may be in immediate danger, consider contacting local emergency services or someone you trust nearby. TellHer can’t respond to emergencies.</p>
  <ul>{safetyResources.map(r => <li key={r.href}><a href={r.href} target="_blank" rel="noreferrer noopener" className="member-link">{r.label}</a></li>)}</ul>
  <QuickExit />
 </aside>;
}
