import { useQuery } from '@tanstack/react-query';
import { memberAvatar } from '@/lib/member.functions';
import { ANON_PALETTES, BG, HAIR_COLOR, SKIN, TOP, openAvatarQuery, safeAnon, safeOpen, type OpenAvatarConfig } from '@/lib/avatar';

/** Illustrated Open Avatar: soft editorial portrait from a tiny trait config. Decorative only. */
export function IllustratedAvatar({ config, size = 40 }: { config: OpenAvatarConfig; size?: number }) {
 const c = safeOpen(config); const skin = SKIN[c.skin]!; const hair = HAIR_COLOR[c.hairColor]!; const top = TOP[c.topColor]!;
 const face = [<ellipse key="f" cx="50" cy="46" rx="17" ry="21" fill={skin} />, <circle key="f" cx="50" cy="47" r="19" fill={skin} />, <rect key="f" x="32" y="27" width="36" height="40" rx="14" fill={skin} />][c.face];
 const back = [null, <path key="b" d="M28 46c0-20 10-28 22-28s22 8 22 28v12H28z" fill={hair} />, <path key="b" d="M27 44c0-19 10-27 23-27s23 8 23 27v40H27z" fill={hair} />, <g key="b" fill={hair}>{[30, 38, 46, 54, 62, 70].map((x, i) => <circle key={i} cx={x} cy={30 + (i % 2) * 6} r="9" />)}<circle cx="28" cy="46" r="8" /><circle cx="72" cy="46" r="8" /></g>, <circle key="b" cx="50" cy="16" r="10" fill={hair} />, <path key="b" d="M64 40c8 10 8 30 2 44l-6-2c5-12 4-28-2-38z" fill={hair} />][c.hair];
 const fringe = <path d="M31 42c2-16 10-23 19-23s18 7 19 23c-8-7-20-10-38 0z" fill={hair} />;
 const mouth = [<path key="m" d="M44 57q6 3 12 0" stroke="#6b3b3b" strokeWidth="1.6" fill="none" strokeLinecap="round" />, <path key="m" d="M43 56q7 6 14 0" stroke="#6b3b3b" strokeWidth="1.8" fill="none" strokeLinecap="round" />, <path key="m" d="M45 58h10" stroke="#6b3b3b" strokeWidth="1.6" strokeLinecap="round" />][c.expression];
 const neck = [<path key="t" d="M22 100c2-17 14-26 28-26s26 9 28 26z" fill={top} />, <g key="t"><path d="M22 100c2-17 14-26 28-26s26 9 28 26z" fill={top} /><path d="M42 75l8 12 8-12z" fill={skin} /></g>, <g key="t"><path d="M22 100c2-17 14-26 28-26s26 9 28 26z" fill={top} /><path d="M40 76l10 8 10-8-3 8-7 4-7-4z" fill="#ffffff" opacity=".75" /></g>][c.top];
 return <svg viewBox="0 0 100 100" width={size} height={size} className="illustrated-avatar" aria-hidden>
  <circle cx="50" cy="50" r="50" fill={BG[c.bg]} />
  {back}{c.accessory === 3 && <path d="M26 50c0-22 11-32 24-32s24 10 24 32v30H26z" fill={top} opacity=".9" />}
  <rect x="44" y="62" width="12" height="14" fill={skin} />{neck}{face}{c.accessory !== 3 && fringe}
  <circle cx="43" cy="47" r="1.8" fill="#3a2a2a" /><circle cx="57" cy="47" r="1.8" fill="#3a2a2a" />{mouth}
  {c.accessory === 1 && <g stroke="#2F2A33" strokeWidth="1.4" fill="none"><circle cx="43" cy="47" r="5" /><circle cx="57" cy="47" r="5" /><path d="M48 47h4" /></g>}
  {c.accessory === 2 && <g fill="#C79B58"><circle cx="31" cy="55" r="2.4" /><circle cx="69" cy="55" r="2.4" /></g>}
 </svg>;
}

/** Undercover Look instance for one anonymous Ripple. Abstract, never linked to a member or profile. */
export function AnonymousAvatar({ avatar, size = 40 }: { avatar: unknown; size?: number }) {
 const a = safeAnon(avatar); const [ink, paper] = ANON_PALETTES[a.palette]!; const tilt = (a.variant % 30) - 15; const hue = `hsl(${a.variant} 30% 82% / .45)`;
 const motif = [<g key="m" fill={ink} opacity=".35">{[[20, 24], [78, 30], [70, 76], [26, 72]].map(([x, y], i) => <circle key={i} cx={(x! + a.variant / 9) % 90 + 5} cy={y} r="1.6" />)}</g>, <path key="m" d={`M0 ${70 + (a.variant % 12)} q25 -10 50 0 t50 0V100H0z`} fill={ink} opacity=".15" />, <g key="m" fill={ink} opacity=".18"><circle cx="20" cy="25" r="8" /><circle cx="82" cy="70" r="10" /></g>, null][a.motif];
 const head = a.silhouette === 3 ? <path d="M30 70c0-26 8-40 20-40s20 14 20 40z" fill={ink} /> : <g transform={`rotate(${a.silhouette === 1 ? tilt : 0} 50 50)`}>
  {[<path key="h" d="M30 52c0-18 9-26 20-26s20 8 20 26v6H30z" fill={ink} opacity=".9" />, <path key="h" d="M29 50c0-18 10-26 21-26s21 8 21 26v34H29z" fill={ink} opacity=".9" />, <circle key="h" cx="50" cy="22" r="9" fill={ink} />, <path key="h" d="M26 58c0-24 11-36 24-36s24 12 24 36v30H26z" fill={ink} opacity=".85" />][a.hair]}
  <ellipse cx="50" cy="50" rx="15" ry="18" fill={paper} opacity={a.silhouette === 2 ? 0.55 : 0.95} />
  {a.accessory === 1 && <path d="M30 34h40l-6-10H36z" fill={ink} />}{a.accessory === 2 && <path d="M34 64c10 6 22 6 32 0v8c-10 5-22 5-32 0z" fill={ink} opacity=".7" />}{a.accessory === 3 && <path d="M72 22a8 8 0 1 0 6 12 6 6 0 1 1-6-12z" fill={ink} />}
 </g>;
 return <svg viewBox="0 0 100 100" width={size} height={size} className="anonymous-avatar" aria-hidden>
  <circle cx="50" cy="50" r="50" fill={paper} /><circle cx="50" cy="50" r="50" fill={hue} />{motif}{head}
  <path d="M22 100c2-15 13-23 28-23s26 8 28 23z" fill={ink} opacity=".8" />
 </svg>;
}

/** A member's Open Avatar: illustrated config, her protected photo, or her initial. Viewer-checked. */
export function MemberAvatar({ id, name, hasPhoto, size = 40 }: { id: string | null | undefined; name: string | null | undefined; hasPhoto?: boolean; size?: number }) {
 const open = useQuery(openAvatarQuery(id));
 const photo = useQuery({ queryKey: ['member-avatar', id], enabled: Boolean(id && hasPhoto && open.data?.kind !== 'illustrated'), queryFn: () => memberAvatar({ data: { id: id! } }), staleTime: 240000 });
 const style = { width: size, height: size };
 if (open.data?.kind === 'illustrated' && open.data.config) return <span className="member-initial avatar-frame" style={style} aria-hidden><IllustratedAvatar config={open.data.config as OpenAvatarConfig} size={size} /></span>;
 return <span className="member-initial avatar-frame" style={style} aria-hidden>{photo.data?.url ? <img className="h-full w-full rounded-full object-cover" src={photo.data.url} alt="" /> : (name ?? 'T').slice(0, 1).toUpperCase()}</span>;
}
