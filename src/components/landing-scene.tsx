import trustRipples from '@/assets/trust-ripples.jpg';

/** Public decoration contains no member data. */
export function LandingScene() {
 return <div className="landing-scene" aria-hidden="true">
  <img src={trustRipples} alt="" className="landing-scene-image" />
  <div className="landing-orbits"><i /><i /><i /><i /><span className="landing-core" /><span className="landing-wings"><svg viewBox="0 0 140 70" focusable="false"><path d="M68 40 C60 18 38 6 10 8 C22 14 26 20 26 24 C14 24 8 30 6 36 C18 34 26 36 30 40 C22 44 18 50 18 56 C34 50 52 46 68 40 Z" /><path d="M72 40 C80 18 102 6 130 8 C118 14 114 20 114 24 C126 24 132 30 134 36 C122 34 114 36 110 40 C118 44 122 50 122 56 C106 50 88 46 72 40 Z" /></svg></span></div>
  <div className="landing-stars">{Array.from({ length: 9 }, (_, i) => <span key={i}>✦</span>)}</div>
 </div>;
}