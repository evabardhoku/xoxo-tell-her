import { describe, expect, it } from 'vitest';
import { filterStars } from '@/lib/constellations';

const now = Date.parse('2026-10-17T12:00:00Z'); const ago = (d: number) => new Date(now - d * 86400000).toISOString();
const rows = [
 { id: 'a', category: 'Work', created_at: ago(2), replies: 0 },
 { id: 'b', category: 'Work', created_at: ago(5), replies: 6 },
 { id: 'c', category: 'Travel', created_at: ago(60), replies: 1 },
 { id: 'd', category: 'Travel', created_at: ago(90), replies: 9 },
 { id: 'e', category: 'Services', created_at: ago(10), replies: 2 },
];
describe('Sky star filters', () => {
 it('new stars are recent with few or no perspectives, newest first', () => expect(filterStars(rows, 'new', now).map(r => r.id)).toEqual(['a', 'e']));
 it('forgotten stars are old with few perspectives, oldest first', () => expect(filterStars(rows, 'forgotten', now).map(r => r.id)).toEqual(['c']));
 it('trending stars come from active recent topics only', () => expect(filterStars(rows, 'trending', now).map(r => r.id)).toEqual(['b', 'a', 'e']));
 it('random keeps every star and is stable for a seed', () => { const r = filterStars(rows, 'random', now, 4).map(x => x.id); expect([...r].sort()).toEqual(['a', 'b', 'c', 'd', 'e']); expect(filterStars(rows, 'random', now, 4).map(x => x.id)).toEqual(r); });
});
