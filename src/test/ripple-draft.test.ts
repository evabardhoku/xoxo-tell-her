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
import { filterFeed, type FeedQuestion } from '@/lib/askher';
describe('feed filters', () => {
 const now = Date.parse('2026-10-16T12:00:00Z');
 const q = (id: string, o: Partial<FeedQuestion>): FeedQuestion => ({ id, category: 'Work', body: 'A question body', audience_scope: 'circle', created_at: '2026-10-15T12:00:00Z', reply_count: 0, is_mine: false, my_instinct: null, my_note: null, ...o });
 const list = [q('a', {}), q('b', { category: 'Travel', audience_scope: 'extended', reply_count: 2, created_at: '2026-09-01T00:00:00Z', body: 'airport taxi' })];
 const base = { kw: '', cat: '', reach: '', sort: 'newest' as const, status: '' as const, days: 0 };
 it('filters by keyword, category, reach, date and status', () => {
  expect(filterFeed(list, { ...base, kw: 'taxi' }, now).map(x => x.id)).toEqual(['b']);
  expect(filterFeed(list, { ...base, cat: 'Work' }, now).map(x => x.id)).toEqual(['a']);
  expect(filterFeed(list, { ...base, reach: 'extended' }, now).map(x => x.id)).toEqual(['b']);
  expect(filterFeed(list, { ...base, days: 7 }, now).map(x => x.id)).toEqual(['a']);
  expect(filterFeed(list, { ...base, status: 'answered' }, now).map(x => x.id)).toEqual(['b']);
  expect(filterFeed(list, { ...base, sort: 'oldest' }, now).map(x => x.id)).toEqual(['b', 'a']);
 });
});

import { conversationExcerpt } from '@/lib/ripple-draft';
describe('conversation excerpt', () => {
 it('keeps only the last four turns and counts the rest', () => {
  const m = Array.from({ length: 8 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `turn ${i}` }));
  const e = conversationExcerpt('opening', m);
  expect(e.omitted).toBe(4); expect(e.lines.map(l => l.text)).toEqual(['turn 4', 'turn 5', 'turn 6', 'turn 7']);
 });
 it('clips long turns to 220 characters', () => {
  expect(conversationExcerpt('o', [{ role: 'user', content: 'x'.repeat(500) }]).lines[0]!.text.length).toBe(221);
 });
});
