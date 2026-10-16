import { Link } from '@tanstack/react-router';
import { ArrowRight, Clock3, LockKeyhole } from 'lucide-react';
import { EmptyRipple } from './brand';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

const content = {
 home: { label: 'YOUR SPACE', title: 'A little space for you.', intro: 'You don’t have to have it all figured out.', empty: 'Every ripple starts somewhere.', copy: 'Ask a question through your circle, reflect privately with Wingwoman, or see what women are asking in AskHer.' },
 askher: { label: 'ASKHER', title: 'Room for another perspective.', intro: 'Thoughtful questions. Women with lived experience.', empty: 'A quieter kind of conversation.', copy: 'When Trust Ripples begin, questions from your network will appear here. No rankings. No race to be heard.' },
 circle: { label: 'MYCIRCLE', title: 'Trust starts close to home.', intro: 'The women you turn to. The trust that connects you.', empty: 'Your circle is taking shape.', copy: 'A small circle of women you trust. One day, their circles can gently extend yours. Your connections will live here.' },
 wingwoman: { label: 'WINGWOMAN', title: 'Hear yourself a little clearer.', intro: 'Your private space for reflection. Before you reach out.', empty: 'A moment, just for you.', copy: 'Wingwoman will help you reflect on a situation in private, then turn it into an editable Trust Ripple draft when you’re ready.' },
 ripple: { label: 'TRUST RIPPLE', title: 'Some things are worth asking.', intro: 'Your question. Your words. Your choice of how far it travels.', empty: 'Start with what’s on your mind.', copy: 'The Trust Ripple composer is coming soon. Nothing is shared, saved, or sent from this preview.' },
} as const;
export function FoundationPage({ kind }: { kind: keyof typeof content }) {
 const item = content[kind];
 return <><div className="page-heading"><div><div className="eyebrow">{item.label}</div><h1>{item.title}</h1><p>{item.intro}</p></div></div><section className="empty-panel"><EmptyRipple /><h2>{item.empty}</h2><p>{item.copy}</p>{kind === 'home' ? <Button asChild variant="editorial" className="mt-6"><Link to="/ripple">Start a Ripple<ArrowRight /></Link></Button> : <span className="status-label"><Clock3 size={12} />{kind === 'wingwoman' ? 'Private reflection · Coming soon' : 'Coming soon'}</span>}{kind === 'ripple' && <div className="composer-preview field"><label htmlFor="ripple-preview">What would you like a perspective on?</label><Textarea id="ripple-preview" disabled placeholder="Your words belong here…" /><div className="reach-preview"><span>○ My circle</span><span>○ Extended Circle</span><span>○ TellHer community</span></div><Button disabled variant="editorial" className="mt-5 w-full">Send Trust Ripple</Button></div>}</section>{kind === 'home' && <div className="home-links"><Link to="/circle" className="home-link"><div><h3>Your people, closer.</h3><p>Make room for the women you trust.</p></div><ArrowRight size={18} /></Link><Link to="/wingwoman" className="home-link"><div><h3>Begin with yourself.</h3><p>A private pause before a new perspective.</p></div><LockKeyhole size={18} /></Link></div>}</>;
}