const RECOVERY_KEY = 'tellher-recovery-user';

/** Only verified recovery events authorize reset, not URL flags. */
export function rememberRecovery(userId: string | null) {
 try {
  if (userId) sessionStorage.setItem(RECOVERY_KEY, userId);
  else sessionStorage.removeItem(RECOVERY_KEY);
 } catch { /* Live recovery events work even when storage is blocked. */ }
}

export function hasRecovery(userId: string) {
 try { return sessionStorage.getItem(RECOVERY_KEY) === userId; }
 catch { return false; }
}