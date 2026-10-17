import { beforeEach, describe, expect, it } from 'vitest';
import { invitationCode, pendingInvitation, rememberInvitation } from '@/lib/invitation';
describe('Membership invitation handoff', () => {
 const code = 'ABCDEF0123456789ABCDEF0123456789';
 beforeEach(() => sessionStorage.clear());
 it('retains the invitation through signup navigation', () => { rememberInvitation(code); expect(pendingInvitation()).toBe(code); });
 it('accepts membership links but rejects ordinary connection codes', () => { expect(invitationCode(code)).toBe(code); expect(invitationCode('ABCDE-FGH23')).toBeUndefined(); });
 it('a new link takes priority over a previous invitation', () => { rememberInvitation(code); expect(pendingInvitation('0123456789ABCDEF0123456789ABCDEF')).toBe('0123456789ABCDEF0123456789ABCDEF'); });
});