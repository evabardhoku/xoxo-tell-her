import { describe, expect, it } from 'vitest';
import { detectPii, mentionsImmediateRisk } from '@/lib/safety';
describe('safety checks', () => {
 it('flags email, phone and handles', () => {
  expect(detectPii('mail me at ana@example.com')).toContain('an email address');
  expect(detectPii('call +39 333 123 4567')).toContain('a phone number');
  expect(detectPii('find me @ana_rossi')).toContain('a social handle or contact link');
 });
 it('ignores ordinary text', () => { expect(detectPii('My manager ignored my email twice this week.')).toEqual([]); });
 it('only explicit immediate risk shows the safety panel', () => {
  expect(mentionsImmediateRisk('he said he is going to kill me')).toBe(true);
  expect(mentionsImmediateRisk('I want to die')).toBe(true);
  expect(mentionsImmediateRisk('we argued about chores and I felt unheard')).toBe(false);
 });
});
