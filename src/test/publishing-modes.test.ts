import { describe, expect, it } from 'vitest';
import { skyOnly } from '@/lib/constellations';
describe('Ripple publishing modes', () => {
 it('open Ripples never enter Sky', () => { expect(skyOnly([{ id: 'a', author_visibility: 'anonymous' }, { id: 'b', author_visibility: 'named' }]).map(r => r.id)).toEqual(['a']); });
 it('historical Ripples without a mode stay in Sky as anonymous', () => { expect(skyOnly([{ id: 'old' }])).toHaveLength(1); });
});
