import { describe, expect, it } from 'vitest';
import { fieldNoteSchema, needsIdentityReveal, perspectiveCredit } from '@/lib/field-notes';
describe('Field Note rules', () => {
 const note = { title: 'What moving taught me', body: 'x'.repeat(2500), topic: 'Travel', location: '' };
 it('accepts 2500 characters and rejects 2501', () => { expect(fieldNoteSchema.safeParse(note).success).toBe(true); expect(fieldNoteSchema.safeParse({ ...note, body: 'x'.repeat(2501) }).success).toBe(false); });
 it('requires confirmation for own anonymous Ripple', () => { expect(needsIdentityReveal({ is_mine: true, author_visibility: 'anonymous' })).toBe(true); });
 it('does not require confirmation for own named Ripple', () => { expect(needsIdentityReveal({ is_mine: true, author_visibility: 'named' })).toBe(false); });
 it('never treats another woman’s anonymous Ripple as identity reveal', () => { expect(needsIdentityReveal({ is_mine: false, author_visibility: 'anonymous' })).toBe(false); });
 it('only credits perspectives from three onwards', () => { expect(perspectiveCredit(2)).toBeNull(); expect(perspectiveCredit(3)).toBe('Shaped by 3 perspectives'); expect(perspectiveCredit(14)).toBe('Shaped by 14 perspectives'); });
});