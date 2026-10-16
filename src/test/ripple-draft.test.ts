import { describe, expect, it } from 'vitest';
import { ripplePublication } from '@/lib/ripple-draft';

describe('Wingwoman Ripple publication boundary', () => {
 it('publishes only the final edited question, never the original private source', () => {
  const draft = { category: 'Work', body: '  What context should I add before discussing this with my manager?  ', scope: 'extended', instinct: 'unsure', note: '', source: 'Private original Wingwoman situation', sessionId: 'private-session' };
  expect(ripplePublication(draft)).toEqual({ _category: 'Work', _body: 'What context should I add before discussing this with my manager?', _scope: 'extended', _instinct: 'unsure', _note: null });
  expect(JSON.stringify(ripplePublication(draft))).not.toContain(draft.source);
  expect(JSON.stringify(ripplePublication(draft))).not.toContain(draft.sessionId);
 });
 it('shares source wording only when the user retains it in the final edited body', () => {
  const source = 'My manager changed our meeting time without asking.';
  expect(ripplePublication({ category: 'Work', body: `${source} How would you address it?`, scope: 'circle', instinct: 'feels_off', note: '' })._body).toBe(`${source} How would you address it?`);
 });
});