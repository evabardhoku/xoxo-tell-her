/** Invitation links survive route changes; admission itself is bound in the database. */
export const PENDING_INVITE = 'tellher-membership-invite';
export function invitationCode(value: unknown): string | undefined {
 return typeof value === 'string' && /^[a-fA-F0-9]{32}$/.test(value) ? value : undefined;
}
export function pendingInvitation(explicit?: string): string | undefined {
 if (explicit) return invitationCode(explicit);
 try { return invitationCode(sessionStorage.getItem(PENDING_INVITE)); } catch { return undefined; }
}
export function rememberInvitation(code?: string) {
 try { if (code) sessionStorage.setItem(PENDING_INVITE, code); else sessionStorage.removeItem(PENDING_INVITE); } catch { /* URL and signup-bound claim work without storage. */ }
}