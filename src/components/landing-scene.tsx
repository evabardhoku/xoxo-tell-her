import trustRipples from '@/assets/trust-ripples.jpg';

/** Public decoration contains no member data. */
export function LandingScene() {
 return <div className="landing-scene" aria-hidden="true">
  <img src={trustRipples} alt="" className="landing-scene-image" />
  <div className="landing-orbits"><i /><i /><i /><i /><span className="landing-wings"><svg viewBox="0 0 140 64" focusable="false"><path d="M68 38 C52 12 26 4 8 14 C20 17 24 24 21 29 C28 30 31 36 30 42 C38 40 42 44 43 50 C52 45 62 41 68 38 Z" /><path d="M72 38 C88 12 114 4 132 14 C120 17 116 24 119 29 C112 30 109 36 110 42 C102 40 98 44 97 50 C88 45 78 41 72 38 Z" /></svg></span></div>
  <div className="landing-stars">{Array.from({ length: 9 }, (_, i) => <span key={i}>✦</span>)}</div>
 </div>;
}