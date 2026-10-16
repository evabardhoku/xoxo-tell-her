import { describe, expect, it } from 'vitest';
import { rippleIdentityPublication } from '@/lib/ripple-draft';
import { questionProvenance } from '@/lib/current';
const draft = { category: 'Travel', body: '  Which train would you take?  ', scope: 'extended', instinct: 'unsure', note: '' };
describe('Ripple identity publication boundary', () => {
 it('defaults to anonymous including private Wingwoman handoffs', () => { expect(rippleIdentityPublication({ ...draft, source: 'private' } as typeof draft)).toEqual({ _category: 'Travel', _body: 'Which train would you take?', _scope: 'extended', _instinct: 'unsure', _note: null, _author_visibility: 'anonymous' }); });
 it('named identity does not change reach', () => { expect(rippleIdentityPublication({ ...draft, author_visibility: 'named' })).toMatchObject({ _scope: 'extended', _author_visibility: 'named' }); });
 it('anonymous Current ignores accidental name fields', () => { expect(questionProvenance({ is_mine: false, audience_scope: 'circle', author_visibility: 'anonymous', first_name: 'Hidden' })).toBe('Anonymous Ripple · Direct reach'); });
 it('named Current uses safe first name', () => { expect(questionProvenance({ is_mine: false, audience_scope: 'extended', author_visibility: 'named', first_name: 'Eva' })).toBe('Eva · Trust Ripple · Extended reach'); });
});
