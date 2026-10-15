import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowUpRight, ArrowRight, Fingerprint, Orbit, GitBranch } from 'lucide-react';
import { Brand } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { pageHead } from '@/lib/metadata';
import { useAccount } from '@/hooks/account';
import trustRipples from '@/assets/trust-ripples.jpg';

export const Route = createFileRoute('/')({ head: () => pageHead('Some things you ask her', 'Trust travels. Identity doesn’t have to. TellHer is a women-centered trust network for sensitive questions and second perspectives.'), component: Index });
function Index() {
 const { user } = useAccount();
 return <div>
  <header className="landing-header"><div className="landing-logo"><Brand /><span className="header-note">A little closer. A little wiser.</span></div><div className="header-actions"><Link className="landing-signin text-primary" to={user ? '/home' : '/auth'}>{user ? 'My space' : 'Sign in'}</Link><Button asChild variant="editorial"><Link to={user ? '/home' : '/auth'}>{user ? 'Open TellHer' : 'Enter TellHer'}<ArrowUpRight /></Link></Button></div></header>
  <main>
   <section className="hero"><img className="hero-art" src={trustRipples} alt="" width={1600} height={1008} fetchPriority="high" /><div className="hero-content"><div className="eyebrow"><span className="eyebrow-dot" />A circle of trust. A world of perspective.</div><h1>Some things you don’t<br className="hidden md:block" /> ask the internet.<br />You ask <em>her.</em></h1><p className="hero-subtitle">Trust travels. Identity doesn’t have to.</p><div className="hero-cta"><Button asChild variant="editorial" size="lg"><Link to={user ? '/home' : '/auth'}>Enter TellHer<ArrowRight /></Link></Button><span className="quiet">Your question. Your circle. Your choice.</span></div></div><div className="hero-caption">It starts with you. It ripples through trust.</div></section>
   <div className="manifesto">Not every question needs an audience.<span>✧</span>Some just need someone who understands.</div>
   <section className="ideas"><div className="section-intro"><div><div className="eyebrow">A different kind of asking</div><h2>Less noise. More knowing.</h2></div><p>Three small shifts. A more thoughtful way forward.</p></div><div className="idea-grid">
    <article className="idea-card"><div className="idea-top"><span className="idea-number">01 / REFLECT</span><Fingerprint className="idea-icon" /></div><h3>Start with your<br />own instinct.</h3><p>A little space to hear yourself first. Your perspective matters before anyone else’s enters the conversation.</p></article>
    <article className="idea-card"><div className="idea-top"><span className="idea-number">02 / REACH OUT</span><Orbit className="idea-icon" /></div><h3>Choose how far your<br />anonymous question travels.</h3><p>Your trusted women. Their trusted women. Or the wider TellHer community. You choose the reach of your Trust Ripple.</p></article>
    <article className="idea-card"><div className="idea-top"><span className="idea-number">03 / SEE DIFFERENTLY</span><GitBranch className="idea-icon" /></div><h3>See perspectives,<br />not popularity.</h3><p>Not a leaderboard of opinions. A Perspective Map that makes room for nuance, lived experience, and another way of seeing.</p></article>
   </div></section>
  </main><footer className="landing-footer"><span className="footer-signature">Made for the things that matter.</span><span>TellHer © 2026 · Rooted in trust, not in likes.</span></footer>
 </div>;
}
