import { supabase } from '@/integrations/supabase/client';

/** Finite, editorial trait sets. Configs store indexes only, so they stay tiny and renderable anywhere. */
export const SKIN = ['#F6DCC8', '#E9BFA0', '#D49A74', '#B07650', '#8A5638', '#5E3A26'];
export const HAIR_COLOR = ['#2B1B17', '#5A3825', '#8C5A3C', '#C99A5B', '#A9443B', '#9A9A9A'];
export const BG = ['#F3E6DC', '#EBD3D8', '#E8D6B8', '#D9DCE3', '#DCE5D8', '#E3D4E6'];
export const TOP = ['#5B2A45', '#B4778B', '#C79B58', '#567083', '#3F5B4B', '#2F2A33'];
export const HAIRSTYLES = ['Short', 'Bob', 'Long', 'Curls', 'Bun', 'Braid'];
export const FACES = ['Oval', 'Round', 'Soft square'];
export const EXPRESSIONS = ['Calm', 'Smile', 'Thoughtful'];
export const ACCESSORIES = ['None', 'Glasses', 'Earrings', 'Headscarf'];
export const TOPS = ['Crew', 'V-neck', 'Collar'];

export type OpenAvatarConfig = { skin: number; face: number; hair: number; hairColor: number; accessory: number; expression: number; top: number; topColor: number; bg: number };
export const OPEN_KEYS: { key: keyof OpenAvatarConfig; label: string; options: string[]; swatch?: boolean }[] = [
 { key: 'skin', label: 'Skin tone', options: SKIN, swatch: true },
 { key: 'face', label: 'Face', options: FACES },
 { key: 'hair', label: 'Hair', options: HAIRSTYLES },
 { key: 'hairColor', label: 'Hair colour', options: HAIR_COLOR, swatch: true },
 { key: 'accessory', label: 'Accessory', options: ACCESSORIES },
 { key: 'expression', label: 'Expression', options: EXPRESSIONS },
 { key: 'top', label: 'Top', options: TOPS },
 { key: 'topColor', label: 'Top colour', options: TOP, swatch: true },
 { key: 'bg', label: 'Background', options: BG, swatch: true },
];
const pick = (n: number) => Math.floor(Math.random() * n);
export const randomOpen = (): OpenAvatarConfig => Object.fromEntries(OPEN_KEYS.map(k => [k.key, pick(k.options.length)])) as OpenAvatarConfig;
export const DEFAULT_OPEN: OpenAvatarConfig = { skin: 1, face: 0, hair: 2, hairColor: 1, accessory: 0, expression: 0, top: 0, topColor: 0, bg: 0 };
/** Clamp anything stored to a valid index so a bad row can never break rendering. */
export const safeOpen = (c: unknown): OpenAvatarConfig => { const o = (c ?? {}) as Record<string, unknown>; return Object.fromEntries(OPEN_KEYS.map(k => { const v = Number(o[k.key]); return [k.key, Number.isInteger(v) && v >= 0 && v < k.options.length ? v : DEFAULT_OPEN[k.key]]; })) as OpenAvatarConfig; };

/** Undercover Look: a private style template. Every anonymous Ripple gets a fresh variant from it. */
export const ANON_PALETTES = [['#5B2A45', '#B4778B'], ['#C79B58', '#F3E6DC'], ['#567083', '#D9DCE3'], ['#3F5B4B', '#DCE5D8'], ['#7A4E6E', '#E3D4E6'], ['#A9443B', '#EBD3D8']];
export const SILHOUETTES = ['Soft', 'Profile', 'Veiled', 'Abstract'];
export const ANON_HAIR = ['Short', 'Long', 'Up', 'Hooded'];
export const ANON_ACCESSORY = ['None', 'Hat', 'Scarf', 'Moon'];
export const MOTIFS = ['Stars', 'Waves', 'Petals', 'Plain'];
export type AnonStyle = { silhouette: number; palette: number; hair: number; accessory: number; motif: number };
export type AnonAvatar = AnonStyle & { variant: number };
export const ANON_KEYS: { key: keyof AnonStyle; label: string; options: string[] }[] = [
 { key: 'silhouette', label: 'Silhouette', options: SILHOUETTES },
 { key: 'palette', label: 'Palette', options: ANON_PALETTES.map(p => p[0]!) },
 { key: 'hair', label: 'Hair family', options: ANON_HAIR },
 { key: 'accessory', label: 'Accessory', options: ANON_ACCESSORY },
 { key: 'motif', label: 'Background', options: MOTIFS },
];
export const DEFAULT_ANON: AnonStyle = { silhouette: 0, palette: 0, hair: 1, accessory: 0, motif: 0 };
export const safeAnon = (c: unknown): AnonAvatar => { const o = (c ?? {}) as Record<string, unknown>; const base = Object.fromEntries(ANON_KEYS.map(k => { const v = Number(o[k.key]); return [k.key, Number.isInteger(v) && v >= 0 && v < k.options.length ? v : DEFAULT_ANON[k.key]]; })) as AnonStyle; const v = Number(o['variant']); return { ...base, variant: Number.isFinite(v) ? v % 360 : 0 }; };
/** Mirrors the database resolver for previews: each trait follows the preference about half the time. */
export const previewAnon = (s: AnonStyle): AnonAvatar => ({ ...Object.fromEntries(ANON_KEYS.map(k => [k.key, Math.random() < 0.5 ? s[k.key] : pick(k.options.length)])) as AnonStyle, variant: pick(360) });

/** Automatic anonymous appearance, independent of profile preferences. */
export const randomAnonymous = (): AnonAvatar => ({ ...Object.fromEntries(ANON_KEYS.map(k => [k.key, pick(k.options.length)])) as AnonStyle, variant: pick(360) });

export type OpenAvatar = { member_id: string; kind: string; config: unknown };
/** Open avatars come only through the viewer-checked function. Batches ids seen on one screen. */
export const openAvatarQuery = (id: string | null | undefined) => ({
 queryKey: ['open-avatar', id], enabled: Boolean(id), staleTime: 120000,
 queryFn: async () => { const { data, error } = await supabase.rpc('tellher_open_avatars', { _ids: [id!] }); if (error) throw error; return (data?.[0] ?? null) as OpenAvatar | null; },
});
