import { Link } from '@tanstack/react-router';

export function RippleMark({ small = false }: { small?: boolean }) {
  return <span className={small ? 'ripple-mark small' : 'ripple-mark'} aria-hidden="true"><i /><i /><i /><b /></span>;
}

export function Brand() {
  return <Link to="/" className="brand" aria-label="TellHer home"><RippleMark small /><span>TellHer<span className="brand-dot">.</span></span></Link>;
}

export function EmptyRipple() {
  return <div className="empty-ripple" aria-hidden="true"><RippleMark /><span className="trust-node node-one" /><span className="trust-node node-two" /></div>;
}