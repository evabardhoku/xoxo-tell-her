import { useEffect, useState } from 'react';
import { consumeRippleSent } from '@/lib/motion';

/** Soft outward rings plus a calm status line after a Trust Ripple is sent. Purely decorative; never blocks input. */
export function SentRipple() {
 const [show, setShow] = useState(false);
 useEffect(() => { if (consumeRippleSent()) { setShow(true); const t = setTimeout(() => setShow(false), 2600); return () => clearTimeout(t); } return undefined; }, []);
 if (!show) return null;
 return <div className="sent-ripple" role="status"><span className="sent-rings" aria-hidden><i /><i /><i /></span>It’s out there. Your Trust Ripple is on its way.</div>;
}
